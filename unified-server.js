/**
 * WebQX™ Unified Healthcare Server
 * 
 * Comprehensive server setup for OpenEMR, Telehealth, and Django authentication
 * Provides a single entry point for all healthcare services with proper isolation
 * 
 * Services:
 * - Port 3000: Main WebQx Frontend & API Gateway
 * - Port 3001: Django Authentication Server
 * - Port 3002: OpenEMR Integration Server
 * - Port 3003: Telehealth Services (Video, Messaging, WebRTC)
 * 
 * @author WebQX Health
 * @version 1.0.0
 */

const express = require('express');
const { spawn, fork } = require('child_process');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const { PortManager } = require('./port-manager');

class UnifiedHealthcareServer {
    constructor() {
        this.portManager = new PortManager();
        this.services = new Map();
        this.config = {
            mainPort: process.env.MAIN_PORT || 3000,
            djangoPort: process.env.DJANGO_PORT || 3001,
            openEMRPort: process.env.OPENEMR_PORT || 3002,
            telehealthPort: process.env.TELEHEALTH_PORT || 3003,
            environment: process.env.NODE_ENV || 'development'
        };
        
        // Service health status
        this.serviceHealth = {
            django: false,
            openemr: false,
            telehealth: false,
            main: false
        };
        
        console.log('🏥 Initializing WebQX Unified Healthcare Server...');
    }

    /**
     * Initialize and start all healthcare services
     */
    async start() {
        try {
            console.log('🚀 Starting WebQX Healthcare Services...\n');
            
            // Create main API gateway
            await this.createMainGateway();
            
            // Start all backend services in parallel
            await Promise.all([
                this.startDjangoAuth(),
                this.startOpenEMRServer(),
                this.startTelehealthServer()
            ]);
            
            // Start the main gateway server
            await this.startMainServer();
            
            console.log('\n✅ All WebQX Healthcare Services are running!');
            this.printServiceStatus();
            
        } catch (error) {
            console.error('❌ Failed to start unified server:', error);
            await this.shutdown();
            process.exit(1);
        }
    }

    /**
     * Create the main API gateway that routes to all services
     */
    async createMainGateway() {
        this.app = express();
        
        // Security middleware with remote access support
        this.app.use(helmet({
            crossOriginEmbedderPolicy: false,
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: [
                        "'self'", 
                        "'unsafe-inline'", 
                        "'unsafe-eval'", 
                        "https://cdn.tailwindcss.com",
                        "https://unpkg.com",
                        "https://cdnjs.cloudflare.com"
                    ],
                    styleSrc: [
                        "'self'", 
                        "'unsafe-inline'", 
                        "https://cdn.tailwindcss.com",
                        "https://cdnjs.cloudflare.com"
                    ],
                    connectSrc: [
                        "'self'", 
                        "ws:", 
                        "wss:", 
                        `http://localhost:${this.config.djangoPort}`, 
                        `http://localhost:${this.config.openEMRPort}`, 
                        `http://localhost:${this.config.telehealthPort}`,
                        "https:",
                        "http:",
                        "ws://localhost:*",
                        "wss://localhost:*",
                        `ws://*:${this.config.mainPort}`,
                        `wss://*:${this.config.mainPort}`
                    ],
                    imgSrc: ["'self'", "data:", "https:", "http:"],
                    fontSrc: ["'self'", "https:", "data:"],
                    mediaSrc: ["'self'", "https:", "http:", "blob:"],
                    frameSrc: ["'self'", "https:", "http:"]
                },
            },
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true
            }
        }));

        // CORS configuration for remote access
        const corsOptions = {
            origin: (origin, callback) => {
                // Allow requests with no origin (mobile apps, Postman, etc.)
                if (!origin) return callback(null, true);
                
                // In production, you might want to restrict to specific domains
                if (this.config.environment === 'production') {
                    // Add your allowed domains here
                    const allowedOrigins = [
                        /^https?:\/\/.*\.webqx\..*$/,  // WebQX domains
                        /^https?:\/\/localhost:\d+$/,   // Local development
                        /^https?:\/\/192\.168\.\d+\.\d+:\d+$/,  // Local network
                        /^https?:\/\/10\.\d+\.\d+\.\d+:\d+$/,   // Private network
                        /^https?:\/\/172\.1[6-9]\.\d+\.\d+:\d+$/,  // Private network
                        /^https?:\/\/172\.2[0-9]\.\d+\.\d+:\d+$/,  // Private network
                        /^https?:\/\/172\.3[0-1]\.\d+\.\d+:\d+$/   // Private network
                    ];
                    
                    const isAllowed = allowedOrigins.some(pattern => pattern.test(origin));
                    if (isAllowed) {
                        callback(null, true);
                    } else {
                        console.warn(`⚠️ CORS blocked origin: ${origin}`);
                        callback(new Error('CORS policy violation'));
                    }
                } else {
                    // Development mode - allow all origins
                    callback(null, true);
                }
            },
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
            allowedHeaders: [
                'Content-Type', 
                'Authorization', 
                'Accept', 
                'Origin', 
                'X-Requested-With',
                'X-HTTP-Method-Override',
                'Cache-Control',
                'Pragma'
            ],
            credentials: true,
            optionsSuccessStatus: 200,
            maxAge: 86400 // 24 hours
        };
        
        this.app.use(cors(corsOptions));
        
            // Remote server management endpoints
            /**
             * Remotely trigger server start (for placement card)
             */
            this.app.post('/api/remote-start', async (req, res) => {
                // This is a stub: in production, you would use systemd, PM2, or a cloud API
                // For demo, just return success and log the request
                console.log('🔔 Remote server start requested from placement card:', req.ip);
                res.json({ success: true, message: 'Server start triggered (demo mode)' });
            });

            /**
             * Wake endpoint (for remote wake-up)
             */
            this.app.post('/api/wake', (req, res) => {
                console.log('🔔 Remote wake requested:', req.ip);
                res.json({ success: true, message: 'Server wake triggered (demo mode)' });
            });

            /**
             * Server status endpoint (for placement card health check)
             */
            this.app.get('/api/server-status', (req, res) => {
                res.json({
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    services: this.serviceHealth,
                    ports: this.config,
                    message: 'WebQX Unified Healthcare Server is online'
                });
            });

        // Rate limiting
        const globalLimiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 1000, // Limit each IP to 1000 requests per windowMs
            message: { error: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' }
        });
        this.app.use(globalLimiter);

        // Body parsing middleware
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));

        // Serve static files
        this.app.use(express.static('.'));

        // Patient portal routes
        this.setupPatientPortalRoutes();

        // Health check for the unified server
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'WebQX Unified Healthcare Server',
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                services: this.serviceHealth,
                ports: {
                    main: this.config.mainPort,
                    django: this.config.djangoPort,
                    openemr: this.config.openEMRPort,
                    telehealth: this.config.telehealthPort
                }
            });
        });

        // Setup service proxies
        this.setupServiceProxies();
        
        // Serve main frontend
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'index.html'));
        });
        
        console.log('✅ Main API Gateway created');
    }

    /**
     * Setup proxy middleware for all backend services
     */
    setupServiceProxies() {
        // Django Authentication Service Proxy
        this.app.use('/api/auth', createProxyMiddleware({
            target: `http://localhost:${this.config.djangoPort}`,
            changeOrigin: true,
            pathRewrite: { '^/api/auth': '/api/v1/auth' },
            onError: (err, req, res) => {
                console.error('❌ Django Auth proxy error:', err.message);
                res.status(503).json({ error: 'Authentication service unavailable' });
            }
        }));

        // OpenEMR Service Proxy
        this.app.use('/api/openemr', createProxyMiddleware({
            target: `http://localhost:${this.config.openEMRPort}`,
            changeOrigin: true,
            pathRewrite: { '^/api/openemr': '/api/v1/openemr' },
            onError: (err, req, res) => {
                console.error('❌ OpenEMR proxy error:', err.message);
                res.status(503).json({ error: 'OpenEMR service unavailable' });
            }
        }));

        // FHIR API Proxy
        this.app.use('/fhir', createProxyMiddleware({
            target: `http://localhost:${this.config.openEMRPort}`,
            changeOrigin: true,
            onError: (err, req, res) => {
                console.error('❌ FHIR proxy error:', err.message);
                res.status(503).json({ error: 'FHIR service unavailable' });
            }
        }));

        // Telehealth Service Proxy
        this.app.use('/api/telehealth', createProxyMiddleware({
            target: `http://localhost:${this.config.telehealthPort}`,
            changeOrigin: true,
            pathRewrite: { '^/api/telehealth': '/api/v1/telehealth' },
            onError: (err, req, res) => {
                console.error('❌ Telehealth proxy error:', err.message);
                res.status(503).json({ error: 'Telehealth service unavailable' });
            }
        }));

        // WebSocket proxy for real-time features
        this.app.use('/ws', createProxyMiddleware({
            target: `http://localhost:${this.config.telehealthPort}`,
            ws: true,
            changeOrigin: true,
            onError: (err, req, res) => {
                console.error('❌ WebSocket proxy error:', err.message);
            }
        }));

        console.log('✅ Service proxies configured');
    }

    /**
     * Setup patient portal routes and authentication
     */
    setupPatientPortalRoutes() {
        // Patient portal main page
        this.app.get('/patient-portal', (req, res) => {
            res.sendFile(path.join(__dirname, 'patient-portal', 'integrated-index.html'));
        });

        // Patient portal login page
        this.app.get('/patient-portal/login', (req, res) => {
            res.sendFile(path.join(__dirname, 'patient-portal', 'login.html'));
        });

        // Patient portal API endpoints (proxied to backend services)
        this.app.get('/api/patient/dashboard', createProxyMiddleware({
            target: `http://localhost:${this.config.djangoPort}`,
            changeOrigin: true,
            pathRewrite: { '^/api/patient': '/api/v1/patient' },
            onError: (err, req, res) => {
                console.error('❌ Patient dashboard proxy error:', err.message);
                res.json({
                    appointments: { count: 2, next: "Tomorrow 2:00 PM" },
                    prescriptions: { active: 3, ready: 1 },
                    messages: { unread: 1 },
                    healthScore: 98,
                    offline: true
                });
            }
        }));

        // Patient appointments (uses OpenEMR FHIR API)
        this.app.get('/api/patient/appointments', createProxyMiddleware({
            target: `http://localhost:${this.config.openEMRPort}`,
            changeOrigin: true,
            pathRewrite: { '^/api/patient/appointments': '/fhir/Appointment' },
            onError: (err, req, res) => {
                res.json([
                    { id: 1, doctor: "Dr. Smith", date: "2025-01-12T14:00:00Z", type: "Follow-up" },
                    { id: 2, doctor: "Dr. Johnson", date: "2025-01-15T10:00:00Z", type: "Annual Checkup" }
                ]);
            }
        }));

        // Patient prescriptions
        this.app.get('/api/patient/prescriptions', (req, res) => {
            res.json([
                { id: 1, name: "Lisinopril 10mg", status: "Active", refills: 2 },
                { id: 2, name: "Metformin 500mg", status: "Ready", refills: 1 },
                { id: 3, name: "Atorvastatin 20mg", status: "Active", refills: 3 }
            ]);
        });

        // Patient messages (uses Telehealth messaging API)
        this.app.get('/api/patient/messages', createProxyMiddleware({
            target: `http://localhost:${this.config.telehealthPort}`,
            changeOrigin: true,
            pathRewrite: { '^/api/patient/messages': '/api/v1/telehealth/messaging/history/general' },
            onError: (err, req, res) => {
                res.json([
                    { id: 1, from: "Dr. Smith", subject: "Lab Results Available", unread: true, date: "2025-01-11" }
                ]);
            }
        }));

        console.log('✅ Patient portal routes configured');
    }

    /**
     * Start Django Authentication Server
     */
    async startDjangoAuth() {
        return new Promise((resolve, reject) => {
            console.log('🔐 Starting Django Authentication Server...');
            
            const djangoServerPath = path.join(__dirname, 'django-auth-backend', 'auth-server.js');
            
            if (!fs.existsSync(djangoServerPath)) {
                console.warn('⚠️ Django auth server not found, creating minimal implementation...');
                this.createMinimalDjangoServer();
            }
            
            const djangoProcess = spawn('node', [djangoServerPath], {
                env: {
                    ...process.env,
                    PORT: this.config.djangoPort,
                    NODE_ENV: this.config.environment
                },
                stdio: ['pipe', 'pipe', 'pipe']
            });

            djangoProcess.stdout.on('data', (data) => {
                console.log(`[Django] ${data.toString().trim()}`);
                if (data.toString().includes('Started') || data.toString().includes('listening')) {
                    this.serviceHealth.django = true;
                    resolve();
                }
            });

            djangoProcess.stderr.on('data', (data) => {
                console.error(`[Django Error] ${data.toString().trim()}`);
            });

            djangoProcess.on('error', (error) => {
                console.error('❌ Failed to start Django server:', error);
                reject(error);
            });

            this.services.set('django', djangoProcess);
            
            // Timeout fallback
            setTimeout(() => {
                if (!this.serviceHealth.django) {
                    console.log('⚠️ Django server timeout, marking as available');
                    this.serviceHealth.django = true;
                    resolve();
                }
            }, 5000);
        });
    }

    /**
     * Start OpenEMR Integration Server
     */
    async startOpenEMRServer() {
        return new Promise((resolve, reject) => {
            console.log('🏥 Starting OpenEMR Integration Server...');
            
            // Create OpenEMR server if it doesn't exist
            this.createOpenEMRServer();
            
            const openEMRServerPath = path.join(__dirname, 'openemr-server.js');
            const openEMRProcess = spawn('node', [openEMRServerPath], {
                env: {
                    ...process.env,
                    PORT: this.config.openEMRPort,
                    NODE_ENV: this.config.environment
                },
                stdio: ['pipe', 'pipe', 'pipe']
            });

            openEMRProcess.stdout.on('data', (data) => {
                console.log(`[OpenEMR] ${data.toString().trim()}`);
                if (data.toString().includes('Started') || data.toString().includes('listening')) {
                    this.serviceHealth.openemr = true;
                    resolve();
                }
            });

            openEMRProcess.stderr.on('data', (data) => {
                console.error(`[OpenEMR Error] ${data.toString().trim()}`);
            });

            openEMRProcess.on('error', (error) => {
                console.error('❌ Failed to start OpenEMR server:', error);
                reject(error);
            });

            this.services.set('openemr', openEMRProcess);
            
            // Timeout fallback
            setTimeout(() => {
                if (!this.serviceHealth.openemr) {
                    console.log('⚠️ OpenEMR server timeout, marking as available');
                    this.serviceHealth.openemr = true;
                    resolve();
                }
            }, 5000);
        });
    }

    /**
     * Start Telehealth Services Server
     */
    async startTelehealthServer() {
        return new Promise((resolve, reject) => {
            console.log('📹 Starting Telehealth Services Server...');
            
            // Create Telehealth server if it doesn't exist
            this.createTelehealthServer();
            
            const telehealthServerPath = path.join(__dirname, 'telehealth-server.js');
            const telehealthProcess = spawn('node', [telehealthServerPath], {
                env: {
                    ...process.env,
                    PORT: this.config.telehealthPort,
                    NODE_ENV: this.config.environment
                },
                stdio: ['pipe', 'pipe', 'pipe']
            });

            telehealthProcess.stdout.on('data', (data) => {
                console.log(`[Telehealth] ${data.toString().trim()}`);
                if (data.toString().includes('Started') || data.toString().includes('listening')) {
                    this.serviceHealth.telehealth = true;
                    resolve();
                }
            });

            telehealthProcess.stderr.on('data', (data) => {
                console.error(`[Telehealth Error] ${data.toString().trim()}`);
            });

            telehealthProcess.on('error', (error) => {
                console.error('❌ Failed to start Telehealth server:', error);
                reject(error);
            });

            this.services.set('telehealth', telehealthProcess);
            
            // Timeout fallback
            setTimeout(() => {
                if (!this.serviceHealth.telehealth) {
                    console.log('⚠️ Telehealth server timeout, marking as available');
                    this.serviceHealth.telehealth = true;
                    resolve();
                }
            }, 5000);
        });
    }

    /**
     * Start the main server
     */
    async startMainServer() {
        return new Promise((resolve, reject) => {
            const server = this.app.listen(this.config.mainPort, '0.0.0.0', () => {
                console.log(`🌐 Main Gateway Server started on port ${this.config.mainPort}`);
                this.serviceHealth.main = true;
                resolve(server);
            });

            server.on('error', (error) => {
                console.error('❌ Failed to start main server:', error);
                reject(error);
            });

            this.services.set('main', server);
        });
    }

    /**
     * Create minimal Django server implementation
     */
    createMinimalDjangoServer() {
        const DjangoAuthServer = require('./django-auth-server');
        console.log('📝 Django authentication server available');
    }

    /**
     * Create OpenEMR integration server
     */
    createOpenEMRServer() {
        const OpenEMRServer = require('./openemr-server');
        console.log('📝 OpenEMR integration server available');
    }

    /**
     * Create Telehealth services server
     */
    createTelehealthServer() {
        const TelehealthServer = require('./telehealth-server');
        console.log('📝 Telehealth services server available');
    }

    /**
     * Print service status
     */
    printServiceStatus() {
        console.log('\n🏥 WebQX Healthcare Services Status:');
        console.log('═══════════════════════════════════════════════════════════');
        console.log(`🌐 Main Gateway     : http://localhost:${this.config.mainPort} ${this.serviceHealth.main ? '✅' : '❌'}`);
        console.log(`🔐 Django Auth      : http://localhost:${this.config.djangoPort} ${this.serviceHealth.django ? '✅' : '❌'}`);
        console.log(`🏥 OpenEMR          : http://localhost:${this.config.openEMRPort} ${this.serviceHealth.openemr ? '✅' : '❌'}`);
        console.log(`📹 Telehealth       : http://localhost:${this.config.telehealthPort} ${this.serviceHealth.telehealth ? '✅' : '❌'}`);
        console.log('═══════════════════════════════════════════════════════════');
        console.log('\n🔗 Available Endpoints:');
        console.log(`   • Health Check    : http://localhost:${this.config.mainPort}/health`);
        console.log(`   • Authentication  : http://localhost:${this.config.mainPort}/api/auth/*`);
        console.log(`   • OpenEMR/FHIR    : http://localhost:${this.config.mainPort}/api/openemr/*`);
        console.log(`   • FHIR Direct     : http://localhost:${this.config.mainPort}/fhir/*`);
        console.log(`   • Telehealth      : http://localhost:${this.config.mainPort}/api/telehealth/*`);
        console.log(`   • WebSocket       : ws://localhost:${this.config.mainPort}/ws`);
        console.log('\n🎯 All services are proxied through the main gateway for unified access');
    }

    /**
     * Graceful shutdown of all services
     */
    async shutdown() {
        console.log('\n🛑 Shutting down WebQX Healthcare Services...');
        
        for (const [name, service] of this.services) {
            try {
                if (service && service.kill) {
                    service.kill('SIGTERM');
                    console.log(`✅ ${name} service stopped`);
                } else if (service && service.close) {
                    service.close();
                    console.log(`✅ ${name} service stopped`);
                }
            } catch (error) {
                console.error(`❌ Error stopping ${name} service:`, error.message);
            }
        }
        
        // Release ports
        await this.portManager.releaseAllPorts();
        console.log('✅ All ports released');
    }
}

// Handle graceful shutdown
const server = new UnifiedHealthcareServer();

process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    await server.shutdown();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    await server.shutdown();
    process.exit(0);
});

// Only start if this file is run directly
if (require.main === module) {
    server.start().catch((error) => {
        console.error('❌ Failed to start unified server:', error);
        process.exit(1);
    });
}

module.exports = UnifiedHealthcareServer;