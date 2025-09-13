#!/bin/bash

# WebQX Dedicated Server Port Management Script
# Ensures WebQX ports are dedicated and available for remote triggering

set -e

echo "🏥 WebQX Dedicated Server Port Management"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# WebQX dedicated ports
WEBQX_PORTS=(3000 3001 3002 3003)
WEBQX_SERVICES=("main-gateway" "django-auth" "openemr" "telehealth")

echo -e "${BLUE}1. Checking for processes using WebQX ports...${NC}"

# Function to kill processes on WebQX ports
kill_port_processes() {
    local port=$1
    local service_name=$2
    
    echo "Checking port $port for $service_name..."
    
    # Find processes using the port
    local pids=$(lsof -ti:$port 2>/dev/null || true)
    
    if [ ! -z "$pids" ]; then
        echo -e "${YELLOW}⚠️ Found processes on port $port: $pids${NC}"
        
        # Check if it's a WebQX process
        for pid in $pids; do
            local cmd=$(ps -p $pid -o cmd= 2>/dev/null || echo "unknown")
            if [[ "$cmd" == *"webqx"* ]] || [[ "$cmd" == *"start-webqx"* ]]; then
                echo -e "${BLUE}📝 WebQX process found on port $port (PID: $pid)${NC}"
                echo "Command: $cmd"
                
                read -p "Keep this WebQX process? (y/N): " keep_process
                if [[ ! $keep_process =~ ^[Yy]$ ]]; then
                    echo "Stopping WebQX process on port $port..."
                    kill -TERM $pid 2>/dev/null || true
                    sleep 2
                    kill -KILL $pid 2>/dev/null || true
                fi
            else
                echo -e "${RED}❌ Non-WebQX process found on port $port (PID: $pid)${NC}"
                echo "Command: $cmd"
                
                read -p "Kill this process to free port for WebQX? (y/N): " kill_process
                if [[ $kill_process =~ ^[Yy]$ ]]; then
                    echo "Killing process $pid..."
                    kill -TERM $pid 2>/dev/null || true
                    sleep 2
                    kill -KILL $pid 2>/dev/null || true
                fi
            fi
        done
    else
        echo -e "${GREEN}✅ Port $port is available${NC}"
    fi
}

# Check each WebQX port
for i in "${!WEBQX_PORTS[@]}"; do
    kill_port_processes ${WEBQX_PORTS[$i]} ${WEBQX_SERVICES[$i]}
done

echo -e "${BLUE}2. Creating WebQX port reservation script...${NC}"

# Create systemd service to reserve WebQX ports
cat > /tmp/webqx-port-reservation.service << 'EOF'
[Unit]
Description=WebQX Port Reservation Service
After=network.target
Before=webqx.service

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/bin/bash -c '
for port in 3000 3001 3002 3003; do
    echo "Reserving port $port for WebQX"
    nc -l -p $port -k &
    echo $! > /tmp/webqx-port-$port.pid
done
'
ExecStop=/bin/bash -c '
for port in 3000 3001 3002 3003; do
    if [ -f /tmp/webqx-port-$port.pid ]; then
        kill $(cat /tmp/webqx-port-$port.pid) 2>/dev/null || true
        rm -f /tmp/webqx-port-$port.pid
    fi
done
'

[Install]
WantedBy=multi-user.target
EOF

echo -e "${BLUE}3. Setting up WebQX auto-start service...${NC}"

# Get current directory
WEBQX_DIR=$(pwd)

# Create enhanced WebQX systemd service
sudo tee /etc/systemd/system/webqx.service > /dev/null << EOF
[Unit]
Description=WebQX Healthcare Platform - Dedicated Server
Documentation=https://webqx.github.io/webqx/
After=network.target network-online.target
Wants=network-online.target
StartLimitIntervalSec=60
StartLimitBurst=3

[Service]
Type=simple
User=$USER
Group=$USER
WorkingDirectory=$WEBQX_DIR
Environment=NODE_ENV=production
Environment=WEBQX_DEDICATED_SERVER=true
Environment=PATH=/usr/bin:/usr/local/bin:/opt/node/bin
ExecStartPre=/bin/bash -c 'echo "🏥 Starting WebQX Dedicated Server..."'
ExecStart=/usr/bin/node start-webqx-server.js
ExecReload=/bin/kill -HUP \$MAINPID
ExecStop=/bin/bash -c 'echo "🛑 Stopping WebQX Dedicated Server..."; /bin/kill -TERM \$MAINPID'
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=webqx
KillMode=mixed
KillSignal=SIGTERM
TimeoutStartSec=60
TimeoutStopSec=30

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096

# Security settings
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=read-only
ReadWritePaths=$WEBQX_DIR /tmp /var/log
PrivateTmp=yes

[Install]
WantedBy=multi-user.target
EOF

echo -e "${BLUE}4. Creating WebQX remote trigger API...${NC}"

# Create standalone remote trigger server (runs on port 8080)
cat > webqx-remote-trigger.js << 'EOF'
/**
 * WebQX Remote Trigger API Server
 * Runs on port 8080 to handle remote start/stop requests from GitHub Pages
 */

const express = require('express');
const { spawn, exec } = require('child_process');
const cors = require('cors');

const app = express();
const PORT = 8080;

// Enable CORS for GitHub Pages
app.use(cors({
    origin: [
        'https://webqx.github.io',
        'http://localhost:3000',
        /^https?:\/\/.*\.github\.io$/,
        /^https?:\/\/.*\.webqx\..*$/
    ],
    credentials: true
}));

app.use(express.json());

// Status tracking
let serverStatus = {
    isRunning: false,
    lastStarted: null,
    lastStopped: null,
    pid: null
};

// Check if WebQX server is running
function checkWebQXStatus() {
    return new Promise((resolve) => {
        exec('systemctl is-active webqx', (error, stdout) => {
            const isActive = stdout.trim() === 'active';
            serverStatus.isRunning = isActive;
            resolve(isActive);
        });
    });
}

// Remote start endpoint
app.post('/api/remote-start', async (req, res) => {
    console.log('🔔 Remote start request from:', req.ip);
    
    try {
        const isRunning = await checkWebQXStatus();
        
        if (isRunning) {
            res.json({
                success: true,
                message: 'WebQX server is already running',
                status: 'running'
            });
            return;
        }
        
        // Start WebQX service
        exec('sudo systemctl start webqx', (error) => {
            if (error) {
                console.error('❌ Failed to start WebQX:', error);
                return;
            }
            
            serverStatus.lastStarted = new Date().toISOString();
            console.log('✅ WebQX server started successfully');
        });
        
        res.json({
            success: true,
            message: 'WebQX server start initiated',
            status: 'starting'
        });
        
    } catch (error) {
        console.error('❌ Error starting WebQX:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to start WebQX server',
            error: error.message
        });
    }
});

// Remote stop endpoint
app.post('/api/remote-stop', async (req, res) => {
    console.log('🛑 Remote stop request from:', req.ip);
    
    try {
        exec('sudo systemctl stop webqx', (error) => {
            if (error) {
                console.error('❌ Failed to stop WebQX:', error);
                return;
            }
            
            serverStatus.lastStopped = new Date().toISOString();
            serverStatus.isRunning = false;
            console.log('✅ WebQX server stopped successfully');
        });
        
        res.json({
            success: true,
            message: 'WebQX server stop initiated',
            status: 'stopping'
        });
        
    } catch (error) {
        console.error('❌ Error stopping WebQX:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to stop WebQX server',
            error: error.message
        });
    }
});

// Status endpoint
app.get('/api/server-status', async (req, res) => {
    const isRunning = await checkWebQXStatus();
    
    res.json({
        success: true,
        status: isRunning ? 'running' : 'stopped',
        serverInfo: {
            ...serverStatus,
            isRunning,
            uptime: isRunning ? process.uptime() : 0,
            timestamp: new Date().toISOString()
        },
        ports: {
            main: 3000,
            auth: 3001,
            openemr: 3002,
            telehealth: 3003,
            trigger: 8080
        }
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'WebQX Remote Trigger API',
        timestamp: new Date().toISOString()
    });
});

// Start the trigger server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🔧 WebQX Remote Trigger API running on port ${PORT}`);
    console.log(`📡 Ready to receive remote start/stop commands`);
    
    // Initial status check
    checkWebQXStatus();
});
EOF

echo -e "${BLUE}5. Creating WebQX remote trigger service...${NC}"

# Create systemd service for remote trigger API
sudo tee /etc/systemd/system/webqx-remote-trigger.service > /dev/null << EOF
[Unit]
Description=WebQX Remote Trigger API
After=network.target
Before=webqx.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$WEBQX_DIR
Environment=NODE_ENV=production
ExecStart=/usr/bin/node webqx-remote-trigger.js
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=webqx-trigger

[Install]
WantedBy=multi-user.target
EOF

echo -e "${BLUE}6. Setting up port forwarding configuration...${NC}"

# Create UFW rules for WebQX ports
sudo ufw allow 3000/tcp comment "WebQX Main Gateway"
sudo ufw allow 3001/tcp comment "WebQX Django Auth"
sudo ufw allow 3002/tcp comment "WebQX OpenEMR"
sudo ufw allow 3003/tcp comment "WebQX Telehealth"
sudo ufw allow 8080/tcp comment "WebQX Remote Trigger API"

echo -e "${BLUE}7. Enabling services...${NC}"

# Reload systemd and enable services
sudo systemctl daemon-reload
sudo systemctl enable webqx
sudo systemctl enable webqx-remote-trigger

# Start remote trigger service
sudo systemctl start webqx-remote-trigger

echo -e "${BLUE}8. Creating GitHub Pages integration script...${NC}"

# Create JavaScript for GitHub Pages integration
cat > webqx-github-integration.js << 'EOF'
/**
 * WebQX GitHub Pages Integration
 * Add this script to your GitHub Pages patient portal for remote server control
 */

class WebQXRemoteServer {
    constructor(serverIP = '10.0.6.127') {
        this.serverIP = serverIP;
        this.triggerPort = 8080;
        this.mainPort = 3000;
        this.baseURL = `http://${this.serverIP}:${this.triggerPort}`;
        this.mainURL = `http://${this.serverIP}:${this.mainPort}`;
    }

    async startServer() {
        try {
            console.log('🚀 Triggering WebQX server start...');
            
            const response = await fetch(`${this.baseURL}/api/remote-start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                mode: 'cors'
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Server start initiated:', result.message);
                
                // Show loading indicator
                this.showStatus('Starting WebQX server...', 'loading');
                
                // Wait for server to be ready
                this.waitForServerReady();
                
                return result;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('❌ Failed to start server:', error);
            this.showStatus('Failed to start server: ' + error.message, 'error');
            throw error;
        }
    }

    async stopServer() {
        try {
            console.log('🛑 Triggering WebQX server stop...');
            
            const response = await fetch(`${this.baseURL}/api/remote-stop`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                mode: 'cors'
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Server stop initiated:', result.message);
                this.showStatus('WebQX server stopped', 'success');
                return result;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('❌ Failed to stop server:', error);
            this.showStatus('Failed to stop server: ' + error.message, 'error');
            throw error;
        }
    }

    async getServerStatus() {
        try {
            const response = await fetch(`${this.baseURL}/api/server-status`, {
                mode: 'cors'
            });
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('❌ Failed to get server status:', error);
            return { success: false, status: 'unknown', error: error.message };
        }
    }

    async waitForServerReady(maxAttempts = 30) {
        let attempts = 0;
        
        const checkReady = async () => {
            attempts++;
            
            try {
                const response = await fetch(`${this.mainURL}/health`, {
                    mode: 'cors',
                    timeout: 5000
                });
                
                if (response.ok) {
                    console.log('✅ WebQX server is ready!');
                    this.showStatus('WebQX server is online and ready!', 'success');
                    
                    // Redirect to server
                    setTimeout(() => {
                        window.location.href = this.mainURL;
                    }, 2000);
                    
                    return true;
                }
            } catch (error) {
                // Server not ready yet
            }
            
            if (attempts < maxAttempts) {
                console.log(`⏳ Waiting for server... (${attempts}/${maxAttempts})`);
                this.showStatus(`Starting server... (${attempts}/${maxAttempts})`, 'loading');
                setTimeout(checkReady, 2000);
            } else {
                console.log('❌ Server startup timeout');
                this.showStatus('Server startup timeout - please try again', 'error');
            }
        };
        
        checkReady();
    }

    showStatus(message, type = 'info') {
        // Remove existing status
        const existing = document.querySelector('.webqx-status');
        if (existing) existing.remove();
        
        // Create status element
        const status = document.createElement('div');
        status.className = 'webqx-status';
        status.textContent = message;
        
        // Style based on type
        const styles = {
            info: 'background: #3b82f6; color: white;',
            success: 'background: #10b981; color: white;',
            error: 'background: #ef4444; color: white;',
            loading: 'background: #f59e0b; color: white;'
        };
        
        status.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            ${styles[type] || styles.info}
        `;
        
        document.body.appendChild(status);
        
        // Auto-remove after 5 seconds (except loading)
        if (type !== 'loading') {
            setTimeout(() => status.remove(), 5000);
        }
    }

    // Add placement card integration
    addPlacementCard() {
        const cardHTML = `
            <div class="webqx-remote-card" style="
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 10px;
                padding: 20px;
                margin: 20px 0;
                text-align: center;
                color: white;
            ">
                <h3>🏥 WebQX Dedicated Server</h3>
                <p>Remote server management for your dedicated WebQX instance</p>
                <div style="margin: 15px 0;">
                    <button onclick="webqxServer.startServer()" style="
                        background: #10b981;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        margin: 5px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-weight: bold;
                    ">🚀 Start Server</button>
                    
                    <button onclick="webqxServer.stopServer()" style="
                        background: #ef4444;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        margin: 5px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-weight: bold;
                    ">🛑 Stop Server</button>
                    
                    <button onclick="webqxServer.getServerStatus().then(s => alert(JSON.stringify(s, null, 2)))" style="
                        background: #3b82f6;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        margin: 5px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-weight: bold;
                    ">📊 Status</button>
                </div>
                <p style="font-size: 12px; opacity: 0.8;">
                    Server IP: ${this.serverIP} | Trigger Port: ${this.triggerPort}
                </p>
            </div>
        `;
        
        // Insert at top of container
        const container = document.querySelector('.container');
        if (container) {
            container.insertAdjacentHTML('afterbegin', cardHTML);
        }
    }
}

// Initialize WebQX remote server (update IP as needed)
const webqxServer = new WebQXRemoteServer('10.0.6.127');

// Auto-add placement card when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    webqxServer.addPlacementCard();
});
EOF

echo -e "${GREEN}✅ WebQX Dedicated Server Setup Complete!${NC}"
echo "========================================"
echo -e "${YELLOW}Server Information:${NC}"
echo "Main Server: http://10.0.6.127:3000"
echo "Remote Trigger API: http://10.0.6.127:8080"
echo ""
echo -e "${YELLOW}Remote Control Commands:${NC}"
echo "Start server: curl -X POST http://10.0.6.127:8080/api/remote-start"
echo "Stop server: curl -X POST http://10.0.6.127:8080/api/remote-stop"
echo "Check status: curl http://10.0.6.127:8080/api/server-status"
echo ""
echo -e "${YELLOW}Management Commands:${NC}"
echo "Start WebQX: sudo systemctl start webqx"
echo "Stop WebQX: sudo systemctl stop webqx"
echo "Status: sudo systemctl status webqx"
echo "Logs: sudo journalctl -u webqx -f"
echo ""
echo -e "${YELLOW}GitHub Pages Integration:${NC}"
echo "Add webqx-github-integration.js to your GitHub Pages site"
echo "It will create a placement card with remote start/stop buttons"
echo ""
echo -e "${GREEN}🎉 Your computer is now a dedicated WebQX server!${NC}"
echo "Users can remotely start/stop the server from the GitHub Pages portal"