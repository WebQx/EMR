/**
 * WebQX Port Manager - Dedicated Port Assignment System
 * Prevents port conflicts and ensures consistent server startup
 */

const net = require('net');
const fs = require('fs');
const path = require('path');

// WebQX Dedicated Port Configuration
const WEBQX_PORTS = {
    main: 3000,           // Main WebQX server
    analytics: 3002,      // Analytics server  
    user_system: 3001,    // User registration system
    emr_system: 8080,     // EMR system
    websocket: 8081,      // WebSocket server
    fhir: 3003,          // FHIR server (if separate)
    telehealth: 3004,    // Telehealth services
    auth: 3005           // Authentication services
};

const PORT_LOCK_FILE = path.join(__dirname, '.port-locks.json');

class PortManager {
    constructor() {
        this.locks = this.loadLocks();
    }

    loadLocks() {
        try {
            if (fs.existsSync(PORT_LOCK_FILE)) {
                return JSON.parse(fs.readFileSync(PORT_LOCK_FILE, 'utf8'));
            }
        } catch (error) {
            console.warn('Could not load port locks:', error.message);
        }
        return {};
    }

    saveLocks() {
        try {
            fs.writeFileSync(PORT_LOCK_FILE, JSON.stringify(this.locks, null, 2));
        } catch (error) {
            console.error('Could not save port locks:', error.message);
        }
    }

    async isPortAvailable(port) {
        return new Promise((resolve) => {
            const server = net.createServer();
            
            server.listen(port, () => {
                server.once('close', () => resolve(true));
                server.close();
            });
            
            server.on('error', () => resolve(false));
        });
    }

    async killProcessOnPort(port) {
        const { exec } = require('child_process');
        
        return new Promise((resolve) => {
            // Windows command to kill process on port
            exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
                if (error || !stdout) {
                    resolve(false);
                    return;
                }

                const lines = stdout.split('\n');
                const pids = new Set();
                
                lines.forEach(line => {
                    const parts = line.trim().split(/\s+/);
                    if (parts.length >= 5 && parts[1].includes(`:${port}`)) {
                        const pid = parts[4];
                        if (pid && pid !== '0') {
                            pids.add(pid);
                        }
                    }
                });

                if (pids.size === 0) {
                    resolve(false);
                    return;
                }

                let killed = 0;
                pids.forEach(pid => {
                    exec(`taskkill /PID ${pid} /F`, (killError) => {
                        killed++;
                        if (killed === pids.size) {
                            console.log(`✅ Killed ${pids.size} process(es) on port ${port}`);
                            resolve(true);
                        }
                    });
                });
            });
        });
    }

    async reservePort(serviceName, port) {
        const available = await this.isPortAvailable(port);
        
        if (!available) {
            console.log(`⚠️ Port ${port} is in use. Attempting to free it...`);
            await this.killProcessOnPort(port);
            
            // Wait a moment for the port to be freed
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const nowAvailable = await this.isPortAvailable(port);
            if (!nowAvailable) {
                throw new Error(`Port ${port} could not be freed for ${serviceName}`);
            }
        }

        this.locks[serviceName] = {
            port,
            reserved_at: new Date().toISOString(),
            pid: process.pid
        };
        
        this.saveLocks();
        console.log(`🔒 Reserved port ${port} for ${serviceName}`);
        return port;
    }

    async releasePort(serviceName) {
        if (this.locks[serviceName]) {
            const port = this.locks[serviceName].port;
            delete this.locks[serviceName];
            this.saveLocks();
            console.log(`🔓 Released port ${port} for ${serviceName}`);
        }
    }

    async getAvailablePort(serviceName, preferredPort) {
        try {
            return await this.reservePort(serviceName, preferredPort);
        } catch (error) {
            // Find next available port
            for (let port = preferredPort + 1; port < preferredPort + 100; port++) {
                try {
                    return await this.reservePort(serviceName, port);
                } catch (e) {
                    continue;
                }
            }
            throw new Error(`No available ports found for ${serviceName}`);
        }
    }

    getServicePort(serviceName) {
        if (this.locks[serviceName]) {
            return this.locks[serviceName].port;
        }
        return WEBQX_PORTS[serviceName] || null;
    }

    async cleanupStaleReservations() {
        const { exec } = require('child_process');
        
        for (const [serviceName, lock] of Object.entries(this.locks)) {
            // Check if the process is still running
            exec(`tasklist /FI "PID eq ${lock.pid}"`, (error, stdout) => {
                if (error || !stdout.includes(lock.pid.toString())) {
                    console.log(`🧹 Cleaning up stale reservation for ${serviceName} (PID ${lock.pid})`);
                    delete this.locks[serviceName];
                    this.saveLocks();
                }
            });
        }
    }

    async initializeWebQXPorts() {
        console.log('🚀 Initializing WebQX Port Management System...');
        
        await this.cleanupStaleReservations();
        
        const reservations = [];
        
        for (const [serviceName, port] of Object.entries(WEBQX_PORTS)) {
            try {
                const reservedPort = await this.getAvailablePort(serviceName, port);
                reservations.push({ serviceName, port: reservedPort });
            } catch (error) {
                console.error(`❌ Failed to reserve port for ${serviceName}:`, error.message);
            }
        }

        console.log('\n📋 WebQX Port Assignments:');
        console.log('================================');
        reservations.forEach(({ serviceName, port }) => {
            console.log(`${serviceName.padEnd(15)} → Port ${port}`);
        });
        console.log('================================\n');

        return reservations;
    }
}

// Graceful cleanup on exit
process.on('SIGINT', () => {
    const manager = new PortManager();
    manager.releasePort('main');
    process.exit(0);
});

process.on('SIGTERM', () => {
    const manager = new PortManager();
    manager.releasePort('main');
    process.exit(0);
});

module.exports = { PortManager, WEBQX_PORTS };