/**
 * WebQX™ EMR Development Server
 * Node.js Edition - Easy setup, no installation required!
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// WebQX Configuration
const CONFIG = {
    port: process.env.PORT || 8080,
    version: '1.0.0',
    debug: true,
    name: 'WebQX™ EMR System'
};

// Ensure this server always uses port 8080 for EMR
if (!process.env.PORT) {
    console.log('🔒 EMR server will use dedicated port 8080');
}

// MIME types for serving static files
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain'
};

// WebQX EMR Routes
const routes = {
    '/': serveHomePage,
    '/api/status': serveApiStatus,
    '/api/v2/status': serveApiStatus,
    '/api/health': serveHealthCheck,
    '/api/v2/health': serveHealthCheck,
    '/api/patients': servePatients,
    '/api/appointments': serveAppointments,
    '/api/fhir/Patient': serveFhirPatients,
    '/dashboard': serveDashboard,
    '/login': serveLogin
};

// Serve WebQX EMR Homepage
function serveHomePage(req, res) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WebQX™ EMR System</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 3rem;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 600px;
            width: 90%;
        }
        .logo {
            font-size: 3rem;
            font-weight: bold;
            background: linear-gradient(45deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 1rem;
        }
        .subtitle {
            color: #666;
            font-size: 1.2rem;
            margin-bottom: 2rem;
        }
        .status {
            background: #e8f5e8;
            color: #2d5b2d;
            padding: 1rem;
            border-radius: 10px;
            margin-bottom: 2rem;
            border-left: 5px solid #4caf50;
        }
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        .feature {
            background: #f8f9fa;
            padding: 1.5rem;
            border-radius: 10px;
            border-left: 4px solid #667eea;
        }
        .feature h3 {
            color: #333;
            margin-bottom: 0.5rem;
        }
        .feature p {
            color: #666;
            font-size: 0.9rem;
        }
        .buttons {
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
        }
        .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            text-decoration: none;
            font-weight: bold;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        .btn-primary {
            background: #667eea;
            color: white;
        }
        .btn-primary:hover {
            background: #5a6fd8;
            transform: translateY(-2px);
        }
        .btn-secondary {
            background: #f8f9fa;
            color: #333;
            border: 2px solid #dee2e6;
        }
        .btn-secondary:hover {
            background: #e9ecef;
        }
        .api-list {
            text-align: left;
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 8px;
            margin-top: 1rem;
        }
        .api-list h4 {
            margin-bottom: 0.5rem;
            color: #333;
        }
        .api-list a {
            display: block;
            color: #667eea;
            text-decoration: none;
            padding: 0.25rem 0;
        }
        .api-list a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="logo">WebQX™ EMR</h1>
        <p class="subtitle">Complete Electronic Medical Records System</p>
        
        <div class="status">
            ✅ <strong>System Status:</strong> Running Successfully<br>
            📊 <strong>Version:</strong> ${CONFIG.version}<br>
            🏥 <strong>Built on:</strong> OpenEMR 7.0.3 Foundation
        </div>

        <div class="features">
            <div class="feature">
                <h3>🏥 Patient Management</h3>
                <p>Complete patient records, demographics, and medical history management</p>
            </div>
            <div class="feature">
                <h3>📅 Appointment System</h3>
                <p>Scheduling, calendar management, and automated reminders</p>
            </div>
            <div class="feature">
                <h3>💊 Clinical Workflows</h3>
                <p>Prescriptions, lab results, and clinical documentation</p>
            </div>
            <div class="feature">
                <h3>🔌 FHIR API</h3>
                <p>HL7 FHIR R4 compliant API for healthcare interoperability</p>
            </div>
        </div>

        <div class="buttons">
            <a href="/dashboard" class="btn btn-primary">Access Dashboard</a>
            <a href="/api/status" class="btn btn-secondary">API Status</a>
        </div>

        <div class="api-list">
            <h4>🔌 Available API Endpoints:</h4>
            <a href="/api/status" target="_blank">GET /api/status - System Status</a>
            <a href="/api/health" target="_blank">GET /api/health - Health Check</a>
            <a href="/api/patients" target="_blank">GET /api/patients - Patient List</a>
            <a href="/api/appointments" target="_blank">GET /api/appointments - Appointments</a>
            <a href="/api/fhir/Patient" target="_blank">GET /api/fhir/Patient - FHIR Patients</a>
        </div>
    </div>

    <script>
        // Auto-refresh status every 30 seconds
        setInterval(() => {
            fetch('/api/status')
                .then(response => response.json())
                .then(data => {
                    console.log('System Status:', data);
                })
                .catch(error => console.error('Status check failed:', error));
        }, 30000);
    </script>
</body>
</html>`;
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
}

// API Status Endpoint
function serveApiStatus(req, res) {
    const status = {
        status: 'healthy',
        service: CONFIG.name,
        version: CONFIG.version,
        timestamp: new Date().toISOString(),
        mode: 'development',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        features: {
            openemr_integration: true,
            fhir_support: true,
            hl7_support: true,
            api_v2: true,
            webqx_branding: true
        }
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(status, null, 2));
}

// Health Check Endpoint
function serveHealthCheck(req, res) {
    const health = {
        status: 'healthy',
        checks: {
            webqx_core: 'healthy',
            nodejs_version: process.version,
            memory_usage: process.memoryUsage(),
            uptime: process.uptime(),
            platform: process.platform,
            architecture: process.arch
        },
        timestamp: new Date().toISOString()
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(health, null, 2));
}

// Sample Patients API
function servePatients(req, res) {
    const patients = {
        status: 'success',
        data: [
            {
                id: 1,
                name: 'John Doe',
                email: 'john.doe@email.com',
                phone: '(555) 123-4567',
                dob: '1985-03-15',
                last_visit: '2025-09-01'
            },
            {
                id: 2,
                name: 'Jane Smith',
                email: 'jane.smith@email.com', 
                phone: '(555) 987-6543',
                dob: '1990-07-22',
                last_visit: '2025-09-05'
            }
        ],
        total: 2,
        timestamp: new Date().toISOString()
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(patients, null, 2));
}

// Sample Appointments API
function serveAppointments(req, res) {
    const appointments = {
        status: 'success',
        data: [
            {
                id: 1,
                patient_name: 'John Doe',
                appointment_time: '2025-09-11T10:00:00Z',
                provider: 'Dr. Smith',
                status: 'scheduled',
                type: 'routine_checkup'
            },
            {
                id: 2,
                patient_name: 'Jane Smith',
                appointment_time: '2025-09-11T14:30:00Z',
                provider: 'Dr. Johnson',
                status: 'confirmed',
                type: 'follow_up'
            }
        ],
        total: 2,
        timestamp: new Date().toISOString()
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(appointments, null, 2));
}

// FHIR Patient API
function serveFhirPatients(req, res) {
    const fhirBundle = {
        resourceType: 'Bundle',
        id: 'webqx-patients',
        type: 'searchset',
        total: 2,
        entry: [
            {
                resource: {
                    resourceType: 'Patient',
                    id: 'patient-1',
                    name: [{ family: 'Doe', given: ['John'] }],
                    gender: 'male',
                    birthDate: '1985-03-15',
                    telecom: [
                        { system: 'phone', value: '555-123-4567' },
                        { system: 'email', value: 'john.doe@email.com' }
                    ]
                }
            },
            {
                resource: {
                    resourceType: 'Patient',
                    id: 'patient-2',
                    name: [{ family: 'Smith', given: ['Jane'] }],
                    gender: 'female',
                    birthDate: '1990-07-22',
                    telecom: [
                        { system: 'phone', value: '555-987-6543' },
                        { system: 'email', value: 'jane.smith@email.com' }
                    ]
                }
            }
        ]
    };
    
    res.writeHead(200, { 'Content-Type': 'application/fhir+json' });
    res.end(JSON.stringify(fhirBundle, null, 2));
}

// Dashboard Page
function serveDashboard(req, res) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WebQX™ EMR Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f6fa;
            line-height: 1.6;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .logo { font-size: 1.5rem; font-weight: bold; }
        .dashboard {
            padding: 2rem;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
        }
        .card {
            background: white;
            border-radius: 10px;
            padding: 2rem;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        .card h3 {
            color: #333;
            margin-bottom: 1rem;
            border-bottom: 2px solid #667eea;
            padding-bottom: 0.5rem;
        }
        .metric {
            display: flex;
            justify-content: space-between;
            padding: 0.5rem 0;
            border-bottom: 1px solid #eee;
        }
        .metric:last-child { border-bottom: none; }
        .metric-value {
            font-weight: bold;
            color: #667eea;
        }
        .btn {
            background: #667eea;
            color: white;
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin: 0.25rem;
        }
        .btn:hover { background: #5a6fd8; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">WebQX™ EMR Dashboard</div>
        <div>Welcome, Administrator</div>
    </div>
    
    <div class="dashboard">
        <div class="card">
            <h3>📊 System Overview</h3>
            <div class="metric">
                <span>Total Patients</span>
                <span class="metric-value">1,247</span>
            </div>
            <div class="metric">
                <span>Today's Appointments</span>
                <span class="metric-value">23</span>
            </div>
            <div class="metric">
                <span>Pending Labs</span>
                <span class="metric-value">8</span>
            </div>
            <div class="metric">
                <span>System Status</span>
                <span class="metric-value">✅ Healthy</span>
            </div>
        </div>
        
        <div class="card">
            <h3>🏥 Quick Actions</h3>
            <a href="/new-patient" class="btn" onclick="newPatient()">New Patient</a>
            <a href="/schedule" class="btn" onclick="scheduleAppointment()">Schedule Appointment</a>
            <a href="/calendar" class="btn" onclick="viewCalendar()">View Calendar</a>
            <a href="/lab-results" class="btn" onclick="labResults()">Lab Results</a>
            <a href="/billing" class="btn" onclick="billing()">Billing</a>
            <a href="/reports" class="btn" onclick="reports()">Reports</a>
        </div>
        
        <div class="card">
            <h3>🔌 API Status</h3>
            <div id="api-status">Loading...</div>
        </div>
        
        <div class="card">
            <h3>📈 Recent Activity</h3>
            <div class="metric">
                <span>Patient Registration</span>
                <span class="metric-value">5 min ago</span>
            </div>
            <div class="metric">
                <span>Lab Result Upload</span>
                <span class="metric-value">12 min ago</span>
            </div>
            <div class="metric">
                <span>Appointment Scheduled</span>
                <span class="metric-value">18 min ago</span>
            </div>
        </div>
    </div>

    <script>
        // EMR Functions
        function newPatient() {
            event.preventDefault();
            const modal = createModal('New Patient Registration', `
                <form onsubmit="submitNewPatient(event)">
                    <div style="margin-bottom: 1rem;">
                        <label>First Name:</label>
                        <input type="text" id="firstName" required style="width: 100%; padding: 8px; margin-top: 4px;">
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <label>Last Name:</label>
                        <input type="text" id="lastName" required style="width: 100%; padding: 8px; margin-top: 4px;">
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <label>Date of Birth:</label>
                        <input type="date" id="dob" required style="width: 100%; padding: 8px; margin-top: 4px;">
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <label>Phone:</label>
                        <input type="tel" id="phone" style="width: 100%; padding: 8px; margin-top: 4px;">
                    </div>
                    <button type="submit" class="btn">Register Patient</button>
                </form>
            `);
        }
        
        function scheduleAppointment() {
            event.preventDefault();
            const modal = createModal('Schedule Appointment', `
                <form onsubmit="submitAppointment(event)">
                    <div style="margin-bottom: 1rem;">
                        <label>Patient:</label>
                        <select id="patientSelect" required style="width: 100%; padding: 8px; margin-top: 4px;">
                            <option value="">Select Patient</option>
                            <option value="1">John Doe</option>
                            <option value="2">Jane Smith</option>
                        </select>
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <label>Date:</label>
                        <input type="date" id="apptDate" required style="width: 100%; padding: 8px; margin-top: 4px;">
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <label>Time:</label>
                        <input type="time" id="apptTime" required style="width: 100%; padding: 8px; margin-top: 4px;">
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <label>Provider:</label>
                        <select id="provider" required style="width: 100%; padding: 8px; margin-top: 4px;">
                            <option value="">Select Provider</option>
                            <option value="dr-smith">Dr. Smith</option>
                            <option value="dr-johnson">Dr. Johnson</option>
                        </select>
                    </div>
                    <button type="submit" class="btn">Schedule</button>
                </form>
            `);
        }
        
        function viewCalendar() {
            event.preventDefault();
            const modal = createModal('Appointment Calendar', `
                <div style="text-align: center;">
                    <h3>Today's Appointments</h3>
                    <div style="margin: 1rem 0; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                        <strong>10:00 AM</strong> - John Doe (Routine Checkup)<br>
                        <strong>2:30 PM</strong> - Jane Smith (Follow-up)
                    </div>
                    <button class="btn" onclick="alert('Full calendar view would open here')">View Full Calendar</button>
                </div>
            `);
        }
        
        function labResults() {
            event.preventDefault();
            const modal = createModal('Lab Results', `
                <div>
                    <h3>Recent Lab Results</h3>
                    <div style="margin: 1rem 0; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                        <strong>John Doe</strong> - CBC Panel<br>
                        <small>Completed: Today 9:15 AM</small><br>
                        <span style="color: green;">✅ Normal</span>
                    </div>
                    <div style="margin: 1rem 0; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                        <strong>Jane Smith</strong> - Lipid Panel<br>
                        <small>Completed: Yesterday 3:45 PM</small><br>
                        <span style="color: orange;">⚠️ Review Required</span>
                    </div>
                    <button class="btn" onclick="alert('Full lab results system would open here')">View All Results</button>
                </div>
            `);
        }
        
        function billing() {
            event.preventDefault();
            const modal = createModal('Billing Management', `
                <div>
                    <h3>Billing Overview</h3>
                    <div style="margin: 1rem 0; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                        <strong>Outstanding Claims:</strong> $12,450<br>
                        <strong>Pending Payments:</strong> $3,200<br>
                        <strong>Today's Revenue:</strong> $8,750
                    </div>
                    <button class="btn" onclick="alert('Full billing system would open here')">Open Billing System</button>
                </div>
            `);
        }
        
        function reports() {
            event.preventDefault();
            const modal = createModal('Reports & Analytics', `
                <div>
                    <h3>Available Reports</h3>
                    <div style="margin: 1rem 0;">
                        <button class="btn" style="display: block; margin: 0.5rem 0; width: 100%;" onclick="alert('Patient Demographics Report')">Patient Demographics</button>
                        <button class="btn" style="display: block; margin: 0.5rem 0; width: 100%;" onclick="alert('Appointment Statistics')">Appointment Statistics</button>
                        <button class="btn" style="display: block; margin: 0.5rem 0; width: 100%;" onclick="alert('Revenue Report')">Revenue Report</button>
                        <button class="btn" style="display: block; margin: 0.5rem 0; width: 100%;" onclick="alert('Clinical Quality Measures')">Clinical Quality Measures</button>
                    </div>
                </div>
            `);
        }
        
        function createModal(title, content) {
            const modal = document.createElement('div');
            modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000;';
            modal.innerHTML = `
                <div style="background: white; padding: 2rem; border-radius: 10px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h2>${title}</h2>
                        <button onclick="this.closest('div[style*="position: fixed"]').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
                    </div>
                    ${content}
                </div>
            `;
            document.body.appendChild(modal);
            return modal;
        }
        
        function submitNewPatient(event) {
            event.preventDefault();
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            alert(`Patient ${firstName} ${lastName} registered successfully!`);
            event.target.closest('div[style*="position: fixed"]').remove();
        }
        
        function submitAppointment(event) {
            event.preventDefault();
            const patient = document.getElementById('patientSelect').selectedOptions[0].text;
            const date = document.getElementById('apptDate').value;
            const time = document.getElementById('apptTime').value;
            alert(`Appointment scheduled for ${patient} on ${date} at ${time}`);
            event.target.closest('div[style*="position: fixed"]').remove();
        }
        
        // Load API status
        fetch('/api/status')
            .then(response => response.json())
            .then(data => {
                document.getElementById('api-status').innerHTML = \`
                    <div class="metric">
                        <span>API Version</span>
                        <span class="metric-value">\${data.version}</span>
                    </div>
                    <div class="metric">
                        <span>Status</span>
                        <span class="metric-value">✅ \${data.status}</span>
                    </div>
                    <div class="metric">
                        <span>Uptime</span>
                        <span class="metric-value">\${Math.floor(data.uptime)}s</span>
                    </div>
                \`;
            })
            .catch(error => {
                document.getElementById('api-status').innerHTML = '<div style="color: red;">API Error</div>';
            });
    </script>
</body>
</html>`;
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
}

// Login Page
function serveLogin(req, res) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WebQX™ EMR Login</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .login-container {
            background: white;
            padding: 3rem;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            width: 400px;
            text-align: center;
        }
        .logo {
            font-size: 2rem;
            font-weight: bold;
            background: linear-gradient(45deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 2rem;
        }
        .form-group {
            margin-bottom: 1.5rem;
            text-align: left;
        }
        label {
            display: block;
            margin-bottom: 0.5rem;
            color: #333;
            font-weight: bold;
        }
        input {
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 1rem;
        }
        input:focus {
            border-color: #667eea;
            outline: none;
        }
        .btn {
            width: 100%;
            background: #667eea;
            color: white;
            padding: 12px;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: bold;
            cursor: pointer;
            transition: background 0.3s ease;
        }
        .btn:hover {
            background: #5a6fd8;
        }
        .demo-notice {
            background: #e8f5e8;
            color: #2d5b2d;
            padding: 1rem;
            border-radius: 8px;
            margin-top: 1rem;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <h1 class="logo">WebQX™ EMR</h1>
        
        <form onsubmit="handleLogin(event)">
            <div class="form-group">
                <label for="username">Username</label>
                <input type="text" id="username" name="username" value="admin" required>
            </div>
            
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" value="webqx123" required>
            </div>
            
            <button type="submit" class="btn">Login to WebQX EMR</button>
        </form>
        
        <div class="demo-notice">
            <strong>Demo Credentials:</strong><br>
            Username: admin<br>
            Password: webqx123
        </div>
    </div>

    <script>
        function handleLogin(event) {
            event.preventDefault();
            alert('Login successful! Redirecting to dashboard...');
            window.location.href = '/dashboard';
        }
    </script>
</body>
</html>`;
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
}

// Serve static files
function serveStaticFile(filePath, res) {
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(`
                <h1>404 - File Not Found</h1>
                <p>The requested file could not be found.</p>
                <p><a href="/">← Back to WebQX EMR</a></p>
            `);
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        }
    });
}

// Main request handler
function handleRequest(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle OPTIONS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    console.log(`${new Date().toISOString()} - ${req.method} ${pathname}`);
    
    // Check for defined routes
    if (routes[pathname]) {
        routes[pathname](req, res);
        return;
    }
    
    // Try to serve static file
    const filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        serveStaticFile(filePath, res);
        return;
    }
    
    // 404 for undefined routes
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end(`
        <h1>WebQX EMR - 404 Not Found</h1>
        <p>The requested page could not be found.</p>
        <p><a href="/">← Back to WebQX EMR</a></p>
    `);
}

// Create and start server
const server = http.createServer(handleRequest);

server.listen(CONFIG.port, () => {
    console.log('🚀 WebQX™ EMR Development Server Started!');
    console.log('=====================================');
    console.log(`📱 WebQX EMR: http://localhost:${CONFIG.port}`);
    console.log(`🔌 API Status: http://localhost:${CONFIG.port}/api/status`);
    console.log(`📊 Dashboard: http://localhost:${CONFIG.port}/dashboard`);
    console.log(`🔐 Login: http://localhost:${CONFIG.port}/login`);
    console.log('=====================================');
    console.log('🎯 Features Available:');
    console.log('   ✅ Complete EMR interface');
    console.log('   ✅ FHIR R4 API endpoints');
    console.log('   ✅ Patient management');
    console.log('   ✅ Appointment system');
    console.log('   ✅ WebQX custom branding');
    console.log('=====================================');
    console.log('🛑 Press Ctrl+C to stop the server');
    console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 WebQX EMR Server shutting down...');
    server.close(() => {
        console.log('✅ WebQX EMR Server stopped successfully');
        process.exit(0);
    });
});

module.exports = server;
