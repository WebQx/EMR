#!/usr/bin/env node

/**
 * WebQX™ Healthcare Platform Gateway Startup Script (legacy orchestrator)
 * 
 * Single command to start all healthcare services:
 * - Main API Gateway (Port 3000)
 * - Django Authentication (Port 3001)
 * - OpenEMR Integration (Port 3002)
 * - Telehealth Services (Port 3003)
 * 
 * Features:
 * - Dependency checking
 * - Port management
 * - Health monitoring
 * - Graceful shutdown
 * - Service discovery
 * 
 * Usage:
 *   node start-webqx-server.js
 *   npm run start:unified
 * 
 * @author WebQX Health
 * @version 1.0.0
 */

const { spawn, fork } = require('child_process');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

class WebQXServerManager {
    constructor() {
        this.services = new Map();
        this.startupOrder = [
            { name: 'django-auth', port: 3001, script: 'django-auth-server.js', required: true },
            { name: 'openemr', port: 3002, script: 'openemr-server.js', required: true },
            { name: 'telehealth', port: 3003, script: 'telehealth-server.js', required: true },
            { name: 'main-gateway', port: 3000, script: 'unified-server.js', required: true }
        ];
        
        this.healthCheckInterval = null;
        this.shutdownInProgress = false;
        
        console.log('🏥 WebQX Healthcare Server Manager Initializing...');
    }

    /**
     * Check system requirements and dependencies
     */
    async checkDependencies() {
        console.log('🔍 Checking dependencies...');
        
        const projectRoot = path.join(__dirname, '..');
        const requiredFiles = [
            'package.json', // root
            'core/django-auth-server.js',
            'core/openemr-server.js',
            'core/telehealth-server.js',
            'core/unified-server.js'
        ];

        for (const file of requiredFiles) {
            const full = path.join(projectRoot, file);
            if (!fs.existsSync(full)) {
                throw new Error(`Required file missing: ${file} (looked in ${full})`);
            }
        }

        // Check node_modules
        if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
            console.log('📦 Installing dependencies...');
            await this.runCommand('npm', ['install']);
        }

        console.log('✅ Dependencies check passed');
    }

    /**
     * Check if ports are available
     */
    async checkPorts() {
        console.log('🔌 Checking port availability...');
        
        for (const service of this.startupOrder) {
            try {
                await axios.get(`http://localhost:${service.port}/health`, { timeout: 1000 });
                console.warn(`⚠️ Port ${service.port} is already in use (${service.name})`);
            } catch (error) {
                // Port is available
                console.log(`✅ Port ${service.port} available for ${service.name}`);
            }
        }
    }

    /**
     * Start all services in order
     */
    async startServices() {
    console.log('🚀 Starting WebQX Healthcare Platform Services...\n');
        
        for (const service of this.startupOrder) {
            await this.startService(service);
            
            // Wait for service to be ready
            if (service.name !== 'main-gateway') {
                await this.waitForService(service);
            }
        }
        
        console.log('\n✅ All services started successfully!');
        this.printServiceStatus();
        this.startHealthMonitoring();
    }

    /**
     * Start individual service
     */
    async startService(service) {
        return new Promise((resolve, reject) => {
            console.log(`🔧 Starting ${service.name}...`);
            
            const scriptPath = path.join(__dirname, service.script);
            
            if (!fs.existsSync(scriptPath)) {
                console.error(`❌ Service script not found: ${service.script}`);
                return reject(new Error(`Service script not found: ${service.script}`));
            }

            const childProcess = spawn('node', [scriptPath], {
                env: {
                    ...process.env,
                    PORT: service.port,
                    NODE_ENV: process.env.NODE_ENV || 'development'
                },
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let serviceReady = false;

            childProcess.stdout.on('data', (data) => {
                const output = data.toString().trim();
                console.log(`[${service.name}] ${output}`);
                
                if (output.includes('started') || output.includes('listening') || output.includes('running')) {
                    serviceReady = true;
                    resolve();
                }
            });

            childProcess.stderr.on('data', (data) => {
                console.error(`[${service.name} Error] ${data.toString().trim()}`);
            });

            childProcess.on('error', (error) => {
                console.error(`❌ Failed to start ${service.name}:`, error);
                reject(error);
            });

            childProcess.on('exit', (code, signal) => {
                if (!this.shutdownInProgress) {
                    console.error(`❌ ${service.name} exited unexpectedly (code: ${code}, signal: ${signal})`);
                    this.services.delete(service.name);
                }
            });

            this.services.set(service.name, {
                ...service,
                process: childProcess,
                pid: childProcess.pid,
                startedAt: new Date().toISOString(),
                status: 'starting'
            });

            // Timeout fallback
            setTimeout(() => {
                if (!serviceReady) {
                    console.log(`⚠️ ${service.name} startup timeout, assuming ready`);
                    resolve();
                }
            }, 10000);
        });
    }

    /**
     * Wait for service to be ready
     */
    async waitForService(service, maxRetries = 30) {
        console.log(`⏳ Waiting for ${service.name} to be ready...`);
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                const response = await axios.get(`http://localhost:${service.port}/health`, {
                    timeout: 2000
                });
                
                if (response.status === 200) {
                    console.log(`✅ ${service.name} is ready`);
                    
                    const serviceData = this.services.get(service.name);
                    if (serviceData) {
                        serviceData.status = 'running';
                        this.services.set(service.name, serviceData);
                    }
                    
                    return;
                }
            } catch (error) {
                // Service not ready yet
                await this.sleep(1000);
            }
        }
        
        console.warn(`⚠️ ${service.name} health check timeout, continuing...`);
    }

    /**
     * Start health monitoring
     */
    startHealthMonitoring() {
        console.log('💓 Starting health monitoring...');
        
        this.healthCheckInterval = setInterval(async () => {
            await this.performHealthChecks();
        }, 30000); // Check every 30 seconds
    }

    /**
     * Perform health checks on all services
     */
    async performHealthChecks() {
        for (const [name, service] of this.services) {
            if (service.status === 'running') {
                try {
                    const response = await axios.get(`http://localhost:${service.port}/health`, {
                        timeout: 5000
                    });
                    
                    if (response.status !== 200) {
                        console.warn(`⚠️ ${name} health check failed: ${response.status}`);
                        service.status = 'unhealthy';
                    }
                } catch (error) {
                    console.warn(`⚠️ ${name} health check failed: ${error.message}`);
                    service.status = 'unhealthy';
                }
            }
        }
    }

    /**
     * Print service status
     */
    printServiceStatus() {
        console.log('\n🏥 WebQX Healthcare Services Status:');
        console.log('═══════════════════════════════════════════════════════════');
        
        for (const [name, service] of this.services) {
            const status = service.status === 'running' ? '✅' : 
                          service.status === 'starting' ? '🔄' :
                          service.status === 'unhealthy' ? '⚠️' : '❌';
            
            console.log(`${status} ${name.padEnd(15)} : http://localhost:${service.port} (PID: ${service.pid || 'N/A'})`);
        }
        
        console.log('═══════════════════════════════════════════════════════════');
        console.log('\n🔗 Unified Access Points:');
        console.log(`   • Main Portal        : http://localhost:3000`);
        console.log(`   • Authentication API : http://localhost:3000/api/auth/*`);
        console.log(`   • OpenEMR/FHIR API   : http://localhost:3000/api/openemr/*`);
        console.log(`   • FHIR Direct        : http://localhost:3000/fhir/*`);
        console.log(`   • Telehealth API     : http://localhost:3000/api/telehealth/*`);
        console.log(`   • WebSocket          : ws://localhost:3000/ws`);
        console.log('\n💡 All services are accessible through the main gateway (port 3000)');
        console.log('🛡️ Services run independently but communicate securely');
        console.log('📋 Use Ctrl+C to gracefully shutdown all services');
    }

    /**
     * Run command and return promise
     */
    runCommand(command, args) {
        return new Promise((resolve, reject) => {
            const child = spawn(command, args, { stdio: 'inherit' });
            child.on('close', (code) => {
                if (code === 0) resolve();
                else reject(new Error(`Command failed with code ${code}`));
            });
        });
    }

    /**
     * Graceful shutdown
     */
    async shutdown() {
        if (this.shutdownInProgress) return;
        
        this.shutdownInProgress = true;
        console.log('\n🛑 Shutting down WebQX Healthcare Services...');
        
        // Stop health monitoring
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
        
        // Shutdown services in reverse order
        const shutdownOrder = [...this.startupOrder].reverse();
        
        for (const service of shutdownOrder) {
            const serviceData = this.services.get(service.name);
            if (serviceData && serviceData.process) {
                console.log(`🛑 Stopping ${service.name}...`);
                
                try {
                    serviceData.process.kill('SIGTERM');
                    
                    // Wait for graceful shutdown
                    await new Promise((resolve) => {
                        const timeout = setTimeout(() => {
                            console.log(`⚠️ Force killing ${service.name}...`);
                            serviceData.process.kill('SIGKILL');
                            resolve();
                        }, 5000);
                        
                        serviceData.process.on('exit', () => {
                            clearTimeout(timeout);
                            resolve();
                        });
                    });
                    
                    console.log(`✅ ${service.name} stopped`);
                } catch (error) {
                    console.error(`❌ Error stopping ${service.name}:`, error.message);
                }
            }
        }
        
        console.log('✅ All services stopped gracefully');
        process.exit(0);
    }

    /**
     * Helper function to sleep
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Main startup function
     */
    async start() {
        try {
            console.log('🏥 WebQX Healthcare Platform Starting...');
            console.log('═══════════════════════════════════════════════════════════');
            
            await this.checkDependencies();
            await this.checkPorts();
            await this.startServices();
            
            // Setup signal handlers for graceful shutdown
            process.on('SIGINT', () => this.shutdown());
            process.on('SIGTERM', () => this.shutdown());
            process.on('SIGUSR2', () => this.shutdown()); // For nodemon
            
            // Keep process alive
            process.stdin.resume();
            
        } catch (error) {
            console.error('❌ Failed to start WebQX Healthcare Platform:', error);
            await this.shutdown();
            process.exit(1);
        }
    }
}

// Start the server manager if called directly
if (require.main === module) {
    const manager = new WebQXServerManager();
    manager.start().catch(console.error);
}

module.exports = WebQXServerManager;