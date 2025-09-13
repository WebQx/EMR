#!/usr/bin/env node

/**
 * WebQX Remote Trigger API Server
 * Handles GitHub Pages integration and remote server management
 */

const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const app = express();
const PORT = 8080;

// Middleware
app.use(cors({
    origin: ['https://webqx.github.io', 'http://localhost:3000', 'http://localhost:8085'],
    credentials: true
}));
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} from ${req.ip}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'WebQX Remote Trigger API',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

// Server status endpoint
app.get('/api/server-status', (req, res) => {
    exec('curl -s http://localhost:8085/webqx-api.php?action=status', (error, stdout, stderr) => {
        if (error) {
            res.json({
                status: 'offline',
                message: 'WebQX EMR server not responding',
                error: error.message,
                timestamp: new Date().toISOString()
            });
            return;
        }

        try {
            const emrStatus = JSON.parse(stdout);
            res.json({
                status: 'online',
                emr_status: emrStatus,
                remote_api: 'operational',
                timestamp: new Date().toISOString()
            });
        } catch (parseError) {
            res.json({
                status: 'partial',
                message: 'EMR responding but format unexpected',
                raw_response: stdout,
                timestamp: new Date().toISOString()
            });
        }
    });
});

// Remote start endpoint
app.post('/api/remote-start', (req, res) => {
    console.log('Remote start request received from GitHub Pages');
    
    // Check if services are already running
    exec('docker ps --filter "name=webqx" --format "table {{.Names}}\\t{{.Status}}"', (error, stdout, stderr) => {
        if (error) {
            res.json({
                success: false,
                message: 'Error checking Docker containers',
                error: error.message,
                timestamp: new Date().toISOString()
            });
            return;
        }

        const containers = stdout.trim().split('\n').slice(1); // Remove header
        const runningContainers = containers.filter(line => line.includes('Up'));
        
        res.json({
            success: true,
            message: 'WebQX services status checked',
            services: {
                docker_containers: runningContainers.length,
                containers: containers,
                emr_url: 'http://localhost:8085',
                api_url: 'http://localhost:8085/webqx-api.php'
            },
            timestamp: new Date().toISOString()
        });
    });
});

// EMR proxy endpoint
app.get('/api/emr-status', (req, res) => {
    exec('curl -s http://localhost:8085/webqx-api.php?action=health', (error, stdout, stderr) => {
        if (error) {
            res.json({
                status: 'error',
                message: 'Cannot connect to WebQX EMR',
                timestamp: new Date().toISOString()
            });
            return;
        }

        try {
            const healthData = JSON.parse(stdout);
            res.json({
                status: 'success',
                emr_health: healthData,
                timestamp: new Date().toISOString()
            });
        } catch (parseError) {
            res.json({
                status: 'warning',
                message: 'EMR responded but data format unexpected',
                raw_response: stdout,
                timestamp: new Date().toISOString()
            });
        }
    });
});

// Community stats endpoint
app.get('/api/community-stats', (req, res) => {
    exec('curl -s http://localhost:8085/webqx-api.php?action=community-stats', (error, stdout, stderr) => {
        if (error) {
            res.json({
                status: 'error',
                message: 'Cannot retrieve community stats',
                timestamp: new Date().toISOString()
            });
            return;
        }

        try {
            const statsData = JSON.parse(stdout);
            res.json({
                status: 'success',
                community_stats: statsData,
                timestamp: new Date().toISOString()
            });
        } catch (parseError) {
            res.json({
                status: 'error',
                message: 'Invalid community stats response',
                timestamp: new Date().toISOString()
            });
        }
    });
});

// GitHub Pages sync endpoint
app.post('/api/github-sync', (req, res) => {
    const { action, data } = req.body;
    
    console.log(`GitHub sync request: ${action}`, data);
    
    res.json({
        success: true,
        message: `GitHub sync action '${action}' received`,
        action: action,
        data: data,
        emr_integration: 'active',
        timestamp: new Date().toISOString()
    });
});

// Error handling
app.use((error, req, res, next) => {
    console.error('API Error:', error);
    res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        status: 'not_found',
        message: `Endpoint ${req.method} ${req.path} not found`,
        available_endpoints: [
            'GET /health',
            'GET /api/server-status',
            'POST /api/remote-start',
            'GET /api/emr-status',
            'GET /api/community-stats',
            'POST /api/github-sync'
        ],
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 WebQX Remote Trigger API running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 GitHub Pages integration ready`);
    console.log(`🏥 EMR integration: http://localhost:8085`);
    console.log(`⏰ Started at ${new Date().toISOString()}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 WebQX Remote Trigger API shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n🛑 WebQX Remote Trigger API interrupted, shutting down...');
    process.exit(0);
});