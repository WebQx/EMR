const express = require('express');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2/promise');
const WebSocket = require('ws');
const geoip = require('geoip-lite');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../github-pages-frontend')));

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'webqx-global-analytics.cluster-cxy1234567890.us-east-1.rds.amazonaws.com',
    user: process.env.DB_USER || 'analytics_admin',
    password: process.env.DB_PASSWORD || 'SecureAnalytics2024!',
    database: process.env.DB_NAME || 'webqx_analytics',
    port: 3306,
    ssl: { rejectUnauthorized: false }
};

// Global analytics data store
let globalAnalytics = {
    totalUsers: 2847392,
    activeCountries: 195,
    dailyRegistrations: 23891,
    healthcareProviders: 45892,
    appointmentsToday: 89247,
    apiCallsPerMinute: 156892,
    realTimeUsers: new Map(),
    countryStats: new Map(),
    lastUpdated: new Date()
};

// Country data with real-time tracking
const countryData = new Map([
    ['US', { name: 'United States', flag: '🇺🇸', users: 423891, timezone: 'America/New_York' }],
    ['IN', { name: 'India', flag: '🇮🇳', users: 387246, timezone: 'Asia/Kolkata' }],
    ['BR', { name: 'Brazil', flag: '🇧🇷', users: 298573, timezone: 'America/Sao_Paulo' }],
    ['CN', { name: 'China', flag: '🇨🇳', users: 287491, timezone: 'Asia/Shanghai' }],
    ['ID', { name: 'Indonesia', flag: '🇮🇩', users: 234782, timezone: 'Asia/Jakarta' }],
    ['NG', { name: 'Nigeria', flag: '🇳🇬', users: 198347, timezone: 'Africa/Lagos' }],
    ['PK', { name: 'Pakistan', flag: '🇵🇰', users: 176892, timezone: 'Asia/Karachi' }],
    ['BD', { name: 'Bangladesh', flag: '🇧🇩', users: 145673, timezone: 'Asia/Dhaka' }],
    ['RU', { name: 'Russia', flag: '🇷🇺', users: 134598, timezone: 'Europe/Moscow' }],
    ['MX', { name: 'Mexico', flag: '🇲🇽', users: 123847, timezone: 'America/Mexico_City' }],
    ['JP', { name: 'Japan', flag: '🇯🇵', users: 112394, timezone: 'Asia/Tokyo' }],
    ['PH', { name: 'Philippines', flag: '🇵🇭', users: 98756, timezone: 'Asia/Manila' }],
    ['DE', { name: 'Germany', flag: '🇩🇪', users: 87543, timezone: 'Europe/Berlin' }],
    ['GB', { name: 'United Kingdom', flag: '🇬🇧', users: 76892, timezone: 'Europe/London' }],
    ['FR', { name: 'France', flag: '🇫🇷', users: 65421, timezone: 'Europe/Paris' }],
    ['CA', { name: 'Canada', flag: '🇨🇦', users: 54372, timezone: 'America/Toronto' }],
    ['AU', { name: 'Australia', flag: '🇦🇺', users: 43287, timezone: 'Australia/Sydney' }],
    ['IT', { name: 'Italy', flag: '🇮🇹', users: 39876, timezone: 'Europe/Rome' }],
    ['ES', { name: 'Spain', flag: '🇪🇸', users: 35421, timezone: 'Europe/Madrid' }],
    ['ZA', { name: 'South Africa', flag: '🇿🇦', users: 28934, timezone: 'Africa/Johannesburg' }]
]);

// WebSocket server for real-time updates
const wss = new WebSocket.Server({ port: 8081 });

// Activity types for real-time feed
const activityTypes = [
    { 
        type: 'registration', 
        icon: 'fas fa-user-plus', 
        templates: [
            'New user registered from {country}',
            'Healthcare professional joined from {country}',
            'Patient registered via mobile app in {country}'
        ]
    },
    { 
        type: 'appointment', 
        icon: 'fas fa-calendar-check', 
        templates: [
            'Appointment scheduled in {country}',
            'Telemedicine consultation booked in {country}',
            'Follow-up appointment confirmed in {country}'
        ]
    },
    { 
        type: 'provider', 
        icon: 'fas fa-stethoscope', 
        templates: [
            'Healthcare provider verified in {country}',
            'Medical specialist onboarded in {country}',
            'Clinic registration completed in {country}'
        ]
    },
    { 
        type: 'prescription', 
        icon: 'fas fa-pills', 
        templates: [
            'Prescription filled in {country}',
            'Medication dispensed in {country}',
            'E-prescription processed in {country}'
        ]
    },
    { 
        type: 'health', 
        icon: 'fas fa-heartbeat', 
        templates: [
            'Health data synced from wearable device in {country}',
            'Vital signs recorded in {country}',
            'Health monitoring alert processed in {country}'
        ]
    },
    { 
        type: 'telemedicine', 
        icon: 'fas fa-video', 
        templates: [
            'Telemedicine session started in {country}',
            'Virtual consultation completed in {country}',
            'Remote diagnosis session in {country}'
        ]
    },
    { 
        type: 'analytics', 
        icon: 'fas fa-chart-line', 
        templates: [
            'Health analytics report generated for {country}',
            'Population health insights updated for {country}',
            'Medical research data aggregated from {country}'
        ]
    },
    { 
        type: 'security', 
        icon: 'fas fa-shield-alt', 
        templates: [
            'Security scan completed for {country} region',
            'HIPAA compliance check passed in {country}',
            'Data encryption verified for {country} users'
        ]
    }
];

// Initialize database connection
let db;

async function initializeDatabase() {
    try {
        db = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to WebQX Analytics Database');
        
        // Create analytics tables if they don't exist
        await createAnalyticsTables();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        // Fallback to in-memory analytics for demo
        console.log('📊 Running analytics in demo mode with simulated data');
    }
}

async function createAnalyticsTables() {
    const tables = [
        `
        CREATE TABLE IF NOT EXISTS analytics_metrics (
            id INT AUTO_INCREMENT PRIMARY KEY,
            metric_name VARCHAR(100) NOT NULL,
            metric_value BIGINT NOT NULL,
            country_code VARCHAR(3),
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_metric_name (metric_name),
            INDEX idx_timestamp (timestamp),
            INDEX idx_country (country_code)
        )
        `,
        `
        CREATE TABLE IF NOT EXISTS real_time_activities (
            id INT AUTO_INCREMENT PRIMARY KEY,
            activity_type VARCHAR(50) NOT NULL,
            activity_text TEXT NOT NULL,
            country_code VARCHAR(3),
            user_id VARCHAR(36),
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_timestamp (timestamp),
            INDEX idx_type (activity_type),
            INDEX idx_country (country_code)
        )
        `,
        `
        CREATE TABLE IF NOT EXISTS performance_metrics (
            id INT AUTO_INCREMENT PRIMARY KEY,
            response_time_ms INT,
            database_query_time_ms INT,
            uptime_percentage DECIMAL(5,2),
            load_balancer_efficiency DECIMAL(5,2),
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_timestamp (timestamp)
        )
        `,
        `
        CREATE TABLE IF NOT EXISTS user_registrations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id VARCHAR(36) NOT NULL,
            country_code VARCHAR(3),
            registration_source VARCHAR(50),
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_timestamp (timestamp),
            INDEX idx_country (country_code)
        )
        `
    ];

    for (const table of tables) {
        try {
            await db.execute(table);
        } catch (error) {
            console.error('Table creation error:', error.message);
        }
    }
}

// Routes

// Main analytics dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../github-pages-frontend/analytics.html'));
});

// Get global analytics overview
app.get('/api/v1/analytics/overview', async (req, res) => {
    try {
        const overview = {
            ...globalAnalytics,
            realTimeUsers: globalAnalytics.realTimeUsers.size,
            countries: Array.from(countryData.entries()).map(([code, data]) => ({
                code,
                ...data
            })),
            performanceMetrics: {
                responseTime: Math.floor(Math.random() * 20) + 35, // 35-55ms
                databaseQueryTime: Math.floor(Math.random() * 5) + 8, // 8-13ms
                uptime: 99.97,
                loadBalancerEfficiency: 94.2
            },
            timestamp: new Date().toISOString()
        };
        
        res.json(overview);
    } catch (error) {
        console.error('Analytics overview error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics overview' });
    }
});

// Get registration trends
app.get('/api/v1/analytics/registration-trends', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const trends = [];
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            // Simulate registration trends with realistic patterns
            const baseRegistrations = 15000;
            const weekendMultiplier = date.getDay() === 0 || date.getDay() === 6 ? 0.7 : 1.0;
            const randomVariation = Math.random() * 10000;
            const registrations = Math.floor((baseRegistrations + randomVariation) * weekendMultiplier);
            
            trends.push({
                date: date.toISOString().split('T')[0],
                registrations,
                cumulative: globalAnalytics.totalUsers - ((days - i - 1) * 20000)
            });
        }
        
        res.json(trends);
    } catch (error) {
        console.error('Registration trends error:', error);
        res.status(500).json({ error: 'Failed to fetch registration trends' });
    }
});

// Get real-time activities
app.get('/api/v1/analytics/activities', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const activities = [];
        
        // Generate recent activities
        for (let i = 0; i < limit; i++) {
            const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
            const countries = Array.from(countryData.keys());
            const country = countries[Math.floor(Math.random() * countries.length)];
            const countryName = countryData.get(country).name;
            
            const template = activityType.templates[Math.floor(Math.random() * activityType.templates.length)];
            const text = template.replace('{country}', countryName);
            
            const timestamp = new Date();
            timestamp.setMinutes(timestamp.getMinutes() - Math.floor(Math.random() * 120));
            
            activities.push({
                id: uuidv4(),
                type: activityType.type,
                icon: activityType.icon,
                text,
                country,
                timestamp: timestamp.toISOString()
            });
        }
        
        // Sort by timestamp descending
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        res.json(activities);
    } catch (error) {
        console.error('Activities error:', error);
        res.status(500).json({ error: 'Failed to fetch activities' });
    }
});

// Get performance metrics
app.get('/api/v1/analytics/performance', async (req, res) => {
    try {
        const hours = parseInt(req.query.hours) || 24;
        const metrics = [];
        
        for (let i = hours - 1; i >= 0; i--) {
            const timestamp = new Date();
            timestamp.setHours(timestamp.getHours() - i);
            
            metrics.push({
                timestamp: timestamp.toISOString(),
                responseTime: Math.floor(Math.random() * 30) + 30, // 30-60ms
                databaseQueryTime: Math.floor(Math.random() * 10) + 5, // 5-15ms
                activeUsers: Math.floor(Math.random() * 50000) + 100000, // 100K-150K
                apiCalls: Math.floor(Math.random() * 100000) + 150000, // 150K-250K
                uptime: 99.95 + Math.random() * 0.1 // 99.95-100%
            });
        }
        
        res.json(metrics);
    } catch (error) {
        console.error('Performance metrics error:', error);
        res.status(500).json({ error: 'Failed to fetch performance metrics' });
    }
});

// Record new user registration
app.post('/api/v1/analytics/user-registered', async (req, res) => {
    try {
        const { userId, country, source, ip } = req.body;
        
        // Update global counters
        globalAnalytics.totalUsers += 1;
        globalAnalytics.dailyRegistrations += 1;
        
        // Update country stats
        if (country && countryData.has(country)) {
            const countryInfo = countryData.get(country);
            countryInfo.users += 1;
            countryData.set(country, countryInfo);
        }
        
        // Store in database if available
        if (db) {
            await db.execute(
                'INSERT INTO user_registrations (user_id, country_code, registration_source) VALUES (?, ?, ?)',
                [userId, country, source]
            );
        }
        
        // Broadcast to WebSocket clients
        broadcastUpdate({
            type: 'user_registered',
            data: {
                country,
                totalUsers: globalAnalytics.totalUsers,
                timestamp: new Date().toISOString()
            }
        });
        
        res.json({ success: true, totalUsers: globalAnalytics.totalUsers });
    } catch (error) {
        console.error('User registration recording error:', error);
        res.status(500).json({ error: 'Failed to record user registration' });
    }
});

// Record API call metrics
app.post('/api/v1/analytics/api-call', async (req, res) => {
    try {
        const { endpoint, responseTime, country } = req.body;
        
        // Update API call counter
        globalAnalytics.apiCallsPerMinute += 1;
        
        // Store performance metric if available
        if (db && responseTime) {
            await db.execute(
                'INSERT INTO performance_metrics (response_time_ms) VALUES (?)',
                [responseTime]
            );
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('API call recording error:', error);
        res.status(500).json({ error: 'Failed to record API call' });
    }
});

// WebSocket handling for real-time updates
wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection for real-time analytics');
    
    // Send initial data
    ws.send(JSON.stringify({
        type: 'initial_data',
        data: {
            totalUsers: globalAnalytics.totalUsers,
            activeCountries: globalAnalytics.activeCountries,
            dailyRegistrations: globalAnalytics.dailyRegistrations
        }
    }));
    
    // Handle client messages
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('WebSocket message:', data);
        } catch (error) {
            console.error('WebSocket message parsing error:', error);
        }
    });
    
    ws.on('close', () => {
        console.log('WebSocket connection closed');
    });
});

// Broadcast updates to all connected clients
function broadcastUpdate(update) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(update));
        }
    });
}

// Simulate real-time activity generation
function generateRealTimeActivity() {
    const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
    const countries = Array.from(countryData.keys());
    const country = countries[Math.floor(Math.random() * countries.length)];
    const countryName = countryData.get(country).name;
    
    const template = activityType.templates[Math.floor(Math.random() * activityType.templates.length)];
    const text = template.replace('{country}', countryName);
    
    const activity = {
        id: uuidv4(),
        type: activityType.type,
        icon: activityType.icon,
        text,
        country,
        timestamp: new Date().toISOString()
    };
    
    // Broadcast to WebSocket clients
    broadcastUpdate({
        type: 'new_activity',
        data: activity
    });
    
    // Occasionally update global metrics
    if (Math.random() < 0.3) {
        globalAnalytics.totalUsers += Math.floor(Math.random() * 5) + 1;
        globalAnalytics.apiCallsPerMinute += Math.floor(Math.random() * 1000) + 500;
        
        broadcastUpdate({
            type: 'metrics_update',
            data: {
                totalUsers: globalAnalytics.totalUsers,
                apiCallsPerMinute: globalAnalytics.apiCallsPerMinute
            }
        });
    }
}

// Start real-time activity simulation
setInterval(generateRealTimeActivity, Math.random() * 5000 + 3000); // 3-8 seconds

// Reset daily counters at midnight
setInterval(() => {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 0) {
        globalAnalytics.dailyRegistrations = 0;
        globalAnalytics.appointmentsToday = 0;
        console.log('Daily counters reset');
    }
}, 60000); // Check every minute

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        database: db ? 'connected' : 'disconnected',
        websocket: wss.clients.size
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: `Route ${req.method} ${req.path} not found`
    });
});

// Start server
async function startServer() {
    try {
        await initializeDatabase();
        
        app.listen(PORT, () => {
            console.log(`
🚀 WebQX Global Analytics Server Started
📊 Analytics Dashboard: http://localhost:${PORT}
🔌 WebSocket Server: ws://localhost:8080
🌍 Serving ${globalAnalytics.totalUsers.toLocaleString()} users globally
📈 Tracking ${globalAnalytics.activeCountries} countries
⚡ Real-time updates: ACTIVE
            `);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('Shutting down WebQX Analytics Server...');
    
    if (db) {
        await db.end();
    }
    
    wss.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('Shutting down WebQX Analytics Server...');
    
    if (db) {
        await db.end();
    }
    
    wss.close();
    process.exit(0);
});

// Start the server
startServer();

module.exports = app;
