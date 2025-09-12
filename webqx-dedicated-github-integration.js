/**
 * WebQX GitHub Pages Remote Server Integration
 * Add this script to https://webqx.github.io/webqx/patient-portal/index.html
 * for remote server start/stop functionality
 */

class WebQXDedicatedServer {
    constructor() {
        // Update this IP to match your dedicated server
        this.serverIP = '10.0.6.127'; // Change to your actual server IP
        this.triggerPort = 8080;
        this.mainPort = 3000;
        this.triggerURL = `http://${this.serverIP}:${this.triggerPort}`;
        this.mainURL = `http://${this.serverIP}:${this.mainPort}`;
        
        this.isChecking = false;
        this.serverStatus = 'unknown';
    }

    // Remote start server
    async startServer() {
        try {
            console.log('🚀 Triggering dedicated WebQX server start...');
            this.showStatus('Starting WebQX dedicated server...', 'loading');
            
            const response = await fetch(`${this.triggerURL}/api/remote-start`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                mode: 'cors'
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Server start initiated:', result.message);
                this.showStatus('Server starting... Please wait', 'loading');
                
                // Wait for server to be ready
                this.waitForServerReady();
                
                return result;
            } else {
                throw new Error(result.message || 'Server start failed');
            }
        } catch (error) {
            console.error('❌ Failed to start dedicated server:', error);
            this.showStatus(`Failed to start server: ${error.message}`, 'error');
            
            // Show fallback options
            this.showFallbackOptions();
            
            throw error;
        }
    }

    // Remote stop server
    async stopServer() {
        try {
            console.log('🛑 Triggering dedicated WebQX server stop...');
            this.showStatus('Stopping WebQX dedicated server...', 'loading');
            
            const response = await fetch(`${this.triggerURL}/api/remote-stop`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                mode: 'cors'
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Server stop initiated:', result.message);
                this.showStatus('WebQX dedicated server stopped', 'success');
                this.updatePlacementCardStatus('stopped');
                return result;
            } else {
                throw new Error(result.message || 'Server stop failed');
            }
        } catch (error) {
            console.error('❌ Failed to stop dedicated server:', error);
            this.showStatus(`Failed to stop server: ${error.message}`, 'error');
            throw error;
        }
    }

    // Get server status
    async getServerStatus() {
        if (this.isChecking) return;
        
        this.isChecking = true;
        
        try {
            // Check trigger API
            const triggerResponse = await fetch(`${this.triggerURL}/api/server-status`, {
                mode: 'cors',
                timeout: 5000
            });
            
            if (triggerResponse.ok) {
                const triggerResult = await triggerResponse.json();
                
                // Check main server
                try {
                    const mainResponse = await fetch(`${this.mainURL}/health`, {
                        mode: 'cors',
                        timeout: 5000
                    });
                    
                    if (mainResponse.ok) {
                        this.serverStatus = 'running';
                        this.updatePlacementCardStatus('running');
                        return {
                            status: 'running',
                            triggerAPI: true,
                            mainServer: true,
                            details: triggerResult
                        };
                    }
                } catch (mainError) {
                    console.log('Main server not responding');
                }
                
                this.serverStatus = triggerResult.serverInfo?.isRunning ? 'starting' : 'stopped';
                this.updatePlacementCardStatus(this.serverStatus);
                
                return {
                    status: this.serverStatus,
                    triggerAPI: true,
                    mainServer: false,
                    details: triggerResult
                };
            }
        } catch (error) {
            console.log('❌ Cannot reach dedicated server:', error.message);
            this.serverStatus = 'offline';
            this.updatePlacementCardStatus('offline');
            
            return {
                status: 'offline',
                triggerAPI: false,
                mainServer: false,
                error: error.message
            };
        } finally {
            this.isChecking = false;
        }
    }

    // Wait for server to be ready
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
                    console.log('✅ WebQX dedicated server is ready!');
                    this.showStatus('WebQX server is online and ready!', 'success');
                    this.updatePlacementCardStatus('running');
                    
                    // Show success with redirect option
                    this.showSuccessDialog();
                    
                    return true;
                }
            } catch (error) {
                // Server not ready yet
            }
            
            if (attempts < maxAttempts) {
                console.log(`⏳ Waiting for dedicated server... (${attempts}/${maxAttempts})`);
                this.showStatus(`Starting server... (${attempts}/${maxAttempts})`, 'loading');
                setTimeout(checkReady, 3000);
            } else {
                console.log('❌ Server startup timeout');
                this.showStatus('Server startup timeout - check server manually', 'error');
                this.updatePlacementCardStatus('timeout');
                this.showFallbackOptions();
            }
        };
        
        setTimeout(checkReady, 5000); // Initial delay
    }

    // Show status message
    showStatus(message, type = 'info') {
        // Remove existing status
        const existing = document.querySelector('.webqx-dedicated-status');
        if (existing) existing.remove();
        
        // Create status element
        const status = document.createElement('div');
        status.className = 'webqx-dedicated-status';
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
            max-width: 300px;
            ${styles[type] || styles.info}
        `;
        
        document.body.appendChild(status);
        
        // Auto-remove after 5 seconds (except loading)
        if (type !== 'loading') {
            setTimeout(() => {
                if (status.parentNode) status.remove();
            }, 5000);
        }
    }

    // Show success dialog with options
    showSuccessDialog() {
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            color: black;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            z-index: 10001;
            text-align: center;
            max-width: 400px;
        `;
        
        dialog.innerHTML = `
            <h3 style="color: #10b981; margin-top: 0;">🎉 WebQX Server Ready!</h3>
            <p>Your dedicated WebQX server is now online and ready to use.</p>
            <div style="margin: 20px 0;">
                <button onclick="window.open('${this.mainURL}', '_blank')" style="
                    background: #10b981;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    margin: 5px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: bold;
                ">🚀 Open WebQX Portal</button>
                
                <button onclick="this.parentNode.parentNode.remove()" style="
                    background: #6b7280;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    margin: 5px;
                    border-radius: 8px;
                    cursor: pointer;
                ">Stay Here</button>
            </div>
            <p style="font-size: 12px; color: #6b7280;">
                Server URL: ${this.mainURL}
            </p>
        `;
        
        document.body.appendChild(dialog);
        
        // Auto-remove after 30 seconds
        setTimeout(() => {
            if (dialog.parentNode) dialog.remove();
        }, 30000);
    }

    // Show fallback options
    showFallbackOptions() {
        const fallback = document.createElement('div');
        fallback.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #374151;
            color: white;
            padding: 20px;
            border-radius: 10px;
            max-width: 300px;
            z-index: 10000;
        `;
        
        fallback.innerHTML = `
            <h4 style="margin-top: 0;">🔧 Manual Options</h4>
            <p style="font-size: 14px;">If remote start fails, try:</p>
            <div style="margin: 10px 0;">
                <button onclick="window.open('${this.mainURL}', '_blank')" style="
                    background: #3b82f6;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    margin: 2px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 12px;
                ">Check Server</button>
                
                <button onclick="this.parentNode.parentNode.remove()" style="
                    background: #6b7280;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    margin: 2px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 12px;
                ">Close</button>
            </div>
            <p style="font-size: 11px; opacity: 0.8;">
                Server: ${this.serverIP}:${this.mainPort}
            </p>
        `;
        
        document.body.appendChild(fallback);
        
        setTimeout(() => {
            if (fallback.parentNode) fallback.remove();
        }, 15000);
    }

    // Update placement card status
    updatePlacementCardStatus(status) {
        const card = document.querySelector('.webqx-dedicated-card');
        if (!card) return;
        
        const statusElement = card.querySelector('.server-status');
        const startButton = card.querySelector('.start-btn');
        const stopButton = card.querySelector('.stop-btn');
        
        if (statusElement) {
            const statusConfig = {
                running: { text: '🟢 Online', color: '#10b981' },
                stopped: { text: '🔴 Stopped', color: '#ef4444' },
                starting: { text: '🟡 Starting', color: '#f59e0b' },
                offline: { text: '⚫ Offline', color: '#6b7280' },
                timeout: { text: '🟠 Timeout', color: '#f97316' }
            };
            
            const config = statusConfig[status] || statusConfig.offline;
            statusElement.textContent = config.text;
            statusElement.style.color = config.color;
        }
        
        // Update button states
        if (startButton && stopButton) {
            if (status === 'running') {
                startButton.disabled = true;
                stopButton.disabled = false;
            } else if (status === 'stopped' || status === 'offline') {
                startButton.disabled = false;
                stopButton.disabled = true;
            } else {
                startButton.disabled = true;
                stopButton.disabled = true;
            }
        }
    }

    // Add dedicated server placement card
    addDedicatedServerCard() {
        // Check if card already exists
        if (document.querySelector('.webqx-dedicated-card')) return;
        
        const cardHTML = `
            <div class="webqx-dedicated-card service-card" style="
                background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%);
                border: 2px solid rgba(255, 255, 255, 0.3);
                position: relative;
                overflow: hidden;
            ">
                <div style="
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: rgba(255,255,255,0.2);
                    padding: 4px 8px;
                    border-radius: 20px;
                    font-size: 10px;
                    font-weight: bold;
                ">DEDICATED</div>
                
                <div class="service-header">
                    <div class="service-icon" style="background: #1e40af;">🖥️</div>
                    <div class="service-info">
                        <h3>WebQX Dedicated Server</h3>
                        <p>Remote server management</p>
                    </div>
                </div>
                
                <div class="service-status server-status" style="
                    font-weight: bold;
                    margin-bottom: 15px;
                ">🔍 Checking...</div>
                
                <div style="margin: 15px 0;">
                    <button class="start-btn" onclick="webqxDedicated.startServer()" style="
                        background: #10b981;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        margin: 5px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-weight: bold;
                        font-size: 14px;
                    ">🚀 Start Server</button>
                    
                    <button class="stop-btn" onclick="webqxDedicated.stopServer()" style="
                        background: #ef4444;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        margin: 5px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-weight: bold;
                        font-size: 14px;
                    " disabled>🛑 Stop Server</button>
                </div>
                
                <div class="service-details" style="font-size: 12px;">
                    • Remote start/stop capability<br>
                    • Dedicated WebQX instance<br>
                    • Server IP: ${this.serverIP}:${this.mainPort}<br>
                    • Trigger API: Port ${this.triggerPort}
                </div>
                
                <div style="margin-top: 10px;">
                    <button onclick="webqxDedicated.getServerStatus().then(s => alert(JSON.stringify(s, null, 2)))" style="
                        background: #3b82f6;
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 11px;
                    ">📊 Status</button>
                    
                    <button onclick="window.open('${this.mainURL}', '_blank')" style="
                        background: #6b7280;
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 11px;
                        margin-left: 5px;
                    ">🔗 Direct Access</button>
                </div>
            </div>
        `;
        
        // Insert at the beginning of services section
        const servicesRow = document.querySelector('.services-row');
        if (servicesRow) {
            servicesRow.insertAdjacentHTML('afterbegin', cardHTML);
        }
        
        // Initial status check
        setTimeout(() => this.getServerStatus(), 1000);
    }
}

// Initialize dedicated server integration
const webqxDedicated = new WebQXDedicatedServer();

// Auto-initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🏥 WebQX Dedicated Server integration loaded');
    webqxDedicated.addDedicatedServerCard();
    
    // Periodic status check
    setInterval(() => {
        webqxDedicated.getServerStatus();
    }, 30000); // Check every 30 seconds
});

// Export for global use
window.webqxDedicated = webqxDedicated;