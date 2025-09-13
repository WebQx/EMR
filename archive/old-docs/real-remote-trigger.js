#!/usr/bin/env node

/**
 * WebQX Real Remote Trigger Server
 * Actually starts the unified server when triggered from GitHub Pages
 */

const express = require('express');
const cors = require('cors');
const { spawn, exec } = require('child_process');
const path = require('path');

const app = express();
const PORT = 8080;

// Enable CORS for GitHub Pages
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Origin']
}));

app.use(express.json());

// Track server process
let unifiedServerProcess = null;
let serverStatus = 'stopped';

// Real remote start endpoint
app.post('/api/remote-start', async (req, res) => {
    console.log('🚀 Real remote start triggered from:', req.ip);
    console.log('📋 Request body:', req.body);
    
    try {
        // Check if server is already running
        if (unifiedServerProcess && !unifiedServerProcess.killed) {
            console.log('⚠️ Server already running');
            return res.json({
                success: true,
                message: 'WebQX server already running',
                status: 'running',
                ports: {
                    main: 3000,
                    auth: 3001,
                    openemr: 3002,
                    telehealth: 3003
                }
            });
        }

        // Start the unified server
        console.log('🔥 Starting WebQX Unified Server...');
        serverStatus = 'starting';
        
        const serverPath = '/workspaces/webqx/unified-server.js';
        console.log('📂 Server path:', serverPath);
        
        unifiedServerProcess = spawn('node', [serverPath], {
            cwd: '/workspaces/webqx',
            detached: false,
            stdio: ['pipe', 'pipe', 'pipe']
        });

        // Handle server output
        unifiedServerProcess.stdout.on('data', (data) => {
            const output = data.toString();
            console.log('📤 Server:', output.trim());
            
            // Check for successful startup messages
            if (output.includes('All WebQX Healthcare Services are running')) {
                serverStatus = 'running';
                console.log('✅ All services confirmed running');
            }
        });

        unifiedServerProcess.stderr.on('data', (data) => {
            console.error('❌ Server Error:', data.toString().trim());
        });

        unifiedServerProcess.on('error', (error) => {
            console.error('💥 Failed to start server:', error);
            serverStatus = 'error';
        });

        unifiedServerProcess.on('exit', (code, signal) => {
            console.log(`🔚 Server process exited with code ${code}, signal ${signal}`);
            serverStatus = 'stopped';
            unifiedServerProcess = null;
        });

        // Wait a moment for initial startup
        await new Promise(resolve => setTimeout(resolve, 2000));

        res.json({
            success: true,
            message: 'WebQX unified server start initiated',
            status: 'starting',
            processId: unifiedServerProcess.pid,
            expectedPorts: {
                main: 3000,
                auth: 3001,
                openemr: 3002,
                telehealth: 3003
            },
            checkStatusAfter: '10 seconds'
        });

    } catch (error) {
        console.error('💥 Remote start failed:', error);
        serverStatus = 'error';
        res.status(500).json({
            success: false,
            message: 'Failed to start WebQX server',
            error: error.message,
            status: 'error'
        });
    }
});

// Real server status endpoint
app.get('/api/server-status', (req, res) => {
    console.log('📊 Status check from:', req.ip);
    
    // Check actual port status
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

        const allPortsRunning = runningPorts.length === 4;
        const actualStatus = allPortsRunning ? 'running' : (runningPorts.length > 0 ? 'partial' : 'stopped');

        res.json({
            success: true,
            status: actualStatus,
            serverStatus: serverStatus,
            runningPorts: runningPorts,
            expectedPorts: [3000, 3001, 3002, 3003],
            allServicesRunning: allPortsRunning,
            processRunning: unifiedServerProcess && !unifiedServerProcess.killed,
            processId: unifiedServerProcess ? unifiedServerProcess.pid : null,
            timestamp: new Date().toISOString()
        });
    });
});

// Stop server endpoint
app.post('/api/remote-stop', (req, res) => {
    console.log('🛑 Remote stop triggered from:', req.ip);
    
    if (unifiedServerProcess && !unifiedServerProcess.killed) {
        unifiedServerProcess.kill('SIGTERM');
        setTimeout(() => {
            if (unifiedServerProcess && !unifiedServerProcess.killed) {
                unifiedServerProcess.kill('SIGKILL');
            }
        }, 5000);
        
        serverStatus = 'stopping';
        res.json({
            success: true,
            message: 'WebQX server stop initiated',
            status: 'stopping'
        });
    } else {
        res.json({
            success: true,
            message: 'WebQX server already stopped',
            status: 'stopped'
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Remote trigger API healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Start the trigger server
app.listen(PORT, '0.0.0.0', () => {
    console.log('🎯 WebQX Real Remote Trigger Server running on port', PORT);
    console.log('🌐 Server binding: 0.0.0.0:' + PORT);
    console.log('📡 Available endpoints:');
    console.log('  POST http://10.0.2.148:8080/api/remote-start   - Start unified server');
    console.log('  GET  http://10.0.2.148:8080/api/server-status  - Check server status');
    console.log('  POST http://10.0.2.148:8080/api/remote-stop    - Stop unified server');
    console.log('  GET  http://10.0.2.148:8080/health             - Health check');
    console.log('');
    console.log('✅ Ready to receive GitHub Pages triggers and start WebQX services!');
});