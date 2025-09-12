#!/usr/bin/env node

const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');

const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());

// Remote start endpoint that actually starts the unified server
app.post('/api/remote-start', (req, res) => {
    console.log('🚀 Remote start triggered from:', req.ip);
    
    // Start the unified server in the background
    const command = 'cd /workspaces/webqx && nohup node unified-server.js > unified-server.log 2>&1 &';
    
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error('❌ Failed to start server:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to start WebQX server',
                error: error.message
            });
        }
        
        console.log('✅ Unified server start command executed');
        res.json({
            success: true,
            message: 'WebQX unified server started',
            status: 'starting',
            expectedPorts: [3000, 3001, 3002, 3003],
            checkAfter: '15 seconds'
        });
    });
});

// Server status endpoint
app.get('/api/server-status', (req, res) => {
    exec('netstat -tlpn | grep -E ":(3000|3001|3002|3003)\\s"', (error, stdout, stderr) => {
        const runningPorts = [];
        
        if (!error && stdout) {
            const lines = stdout.trim().split('\n');
            lines.forEach(line => {
                if (line.includes(':3000')) runningPorts.push(3000);
                if (line.includes(':3001')) runningPorts.push(3001);
                if (line.includes(':3002')) runningPorts.push(3002);
                if (line.includes(':3003')) runningPorts.push(3003);
            });
        }

        const allRunning = runningPorts.length === 4;
        
        res.json({
            success: true,
            status: allRunning ? 'running' : (runningPorts.length > 0 ? 'partial' : 'stopped'),
            runningPorts: runningPorts,
            expectedPorts: [3000, 3001, 3002, 3003],
            allServicesRunning: allRunning
        });
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'WebQX Remote Trigger API healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Root endpoint for testing
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'WebQX Remote Trigger API',
        endpoints: [
            'POST /api/remote-start',
            'GET /api/server-status',
            'GET /health'
        ],
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎯 WebQX Simple Remote Trigger running on port ${PORT}`);
    console.log('📡 Endpoints: POST /api/remote-start, GET /api/server-status');
    console.log('✅ Ready to start WebQX services!');
});