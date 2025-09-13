const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Enable CORS for all routes
app.use(cors());

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// Default route to serve index-clean.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index-clean.html'));
});

// Specific route for login
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login-clean.html'));
});

const HOST = process.env.HOST || 'localhost';

app.listen(PORT, HOST, () => {
    console.log(`
🌐 WebQx Static File Server Started
📍 Host: ${HOST}
📍 Port: ${PORT}
📍 Homepage: http://${HOST}:${PORT}
🔐 Login Page: http://${HOST}:${PORT}/login-clean.html
📱 All Pages: http://${HOST}:${PORT}/[filename].html

🔗 Backend Authentication Server: http://${HOST}:3001
✅ Ready for ${HOST === '0.0.0.0' ? 'external' : 'local'} access!
    `);
});
