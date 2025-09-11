// api-gateway-proxy.js - Enhanced backend with API Gateway features
const express = require('express');
const cors = require('cors');
const cluster = require('cluster');
const os = require('os');

const app = express();

// 📊 API Gateway Features
class WebQxAPIGateway {
    constructor() {
        this.upstreamServers = [
            'http://localhost:3001',
            'http://localhost:3002',
            'http://localhost:3003'
        ];
        this.currentServer = 0;
        this.healthChecks = new Map();
    }

    // Load Balancer - Round Robin
    getNextServer() {
        const server = this.upstreamServers[this.currentServer];
        this.currentServer = (this.currentServer + 1) % this.upstreamServers.length;
        return server;
    }

    // Health Check Mechanism
    async performHealthCheck(serverUrl) {
        try {
            const response = await fetch(`${serverUrl}/health/`);
            const isHealthy = response.ok;
            this.healthChecks.set(serverUrl, {
                status: isHealthy ? 'healthy' : 'unhealthy',
                lastCheck: new Date(),
                responseTime: response.headers.get('x-response-time') || 'N/A'
            });
            return isHealthy;
        } catch (error) {
            this.healthChecks.set(serverUrl, {
                status: 'unhealthy',
                lastCheck: new Date(),
                error: error.message
            });
            return false;
        }
    }

    // Circuit Breaker Pattern
    async getHealthyServer() {
        for (const server of this.upstreamServers) {
            if (await this.performHealthCheck(server)) {
                return server;
            }
        }
        throw new Error('No healthy servers available');
    }
}

const gateway = new WebQxAPIGateway();

// 🌐 CORS for GitHub Pages
const corsOptions = {
    origin: [
        'https://yourusername.github.io',
        'https://webqx.github.io',
        'http://localhost:3000',
        'http://localhost:8080'
    ],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// 🔄 Request Logging (API Gateway Style)
app.use((req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
    });
    
    next();
});

// 🔄 Proxy Middleware for API requests
app.use('/api/', async (req, res, next) => {
    try {
        const targetServer = await gateway.getHealthyServer();
        console.log(`Routing request to: ${targetServer}`);
        
        // Forward request to backend
        const proxyUrl = `${targetServer}${req.originalUrl}`;
        const response = await fetch(proxyUrl, {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': req.headers.authorization || '',
                'X-Forwarded-For': req.ip,
                'X-Forwarded-Proto': req.protocol
            },
            body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
        });

        // Forward response back to client
        const data = await response.text();
        res.status(response.status);
        
        // Set response headers
        res.set('Content-Type', response.headers.get('content-type') || 'application/json');
        res.send(data);
        
    } catch (error) {
        console.error('Gateway error:', error);
        res.status(503).json({
            error: 'Service temporarily unavailable',
            message: 'Backend servers are currently down',
            retryAfter: 60
        });
    }
});

// 🔐 OAuth proxy routes
app.get('/auth/google', (req, res) => {
    const targetServer = gateway.getNextServer();
    res.redirect(`${targetServer}/auth/google`);
});

app.get('/auth/microsoft', (req, res) => {
    const targetServer = gateway.getNextServer();
    res.redirect(`${targetServer}/auth/microsoft`);
});

// 📊 API Gateway Dashboard
app.get('/gateway/status', (req, res) => {
    res.json({
        status: 'operational',
        timestamp: new Date().toISOString(),
        upstreamServers: gateway.upstreamServers,
        healthChecks: Object.fromEntries(gateway.healthChecks),
        currentLoad: {
            memoryUsage: process.memoryUsage(),
            uptime: process.uptime()
        }
    });
});

// 💓 Health check with detailed metrics
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'webqx-api-gateway',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        features: {
            loadBalancing: true,
            healthChecks: true,
            cors: true,
            proxyRouting: true
        }
    });
});

// 🚀 Start API Gateway
function startGateway() {
    const PORT = process.env.GATEWAY_PORT || 3000;
    
    app.listen(PORT, () => {
        console.log(`🌐 WebQx API Gateway running on port ${PORT}`);
        console.log(`📊 Dashboard: http://localhost:${PORT}/gateway/status`);
        console.log(`💓 Health: http://localhost:${PORT}/health`);
        console.log(`🔄 Proxying to backends: ${gateway.upstreamServers.join(', ')}`);
        
        // Start health checks
        setInterval(() => {
            gateway.upstreamServers.forEach(server => {
                gateway.performHealthCheck(server);
            });
        }, 30000); // Check every 30 seconds
    });
}

// 🔧 Cluster Mode for High Availability
if (cluster.isMaster) {
    const numCPUs = Math.min(os.cpus().length, 4); // Limit to 4 workers
    console.log(`🚀 Starting ${numCPUs} API Gateway workers...`);
    
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
    
    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died. Restarting...`);
        cluster.fork();
    });
} else {
    startGateway();
}

module.exports = app;