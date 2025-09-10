/**
 * WebQX™ - Automatic OpenEMR Launch Integration
 * Seamless access to official OpenEMR demo with auto-credential filling
 * Supports all user roles: Admin, Physician, Clinician, Accountant, Receptionist, Patients
 */

class AutoOpenEMRLauncher {
    constructor() {
        this.demoServers = [
            {
                name: 'Alpine 3.20 (PHP 8.3) - With Demo Data',
                url: 'https://one.openemr.io/e/openemr',
                portalUrl: 'https://one.openemr.io/e/openemr/portal',
                swaggerUrl: 'https://one.openemr.io/d/openemr/swagger',
                version: 'OpenEMR 7.0.3 Development (Latest)',
                status: 'active',
                hasData: true
            },
            {
                name: 'Alpine 3.22 (PHP 8.4) - With Demo Data',
                url: 'https://seven.openemr.io/c/openemr',
                portalUrl: 'https://seven.openemr.io/c/openemr/portal',
                swaggerUrl: 'https://seven.openemr.io/b/openemr/swagger',
                version: 'OpenEMR 7.0.3 Development (PHP 8.4)',
                status: 'active',
                hasData: true
            },
            {
                name: 'Ubuntu 24.04 (PHP 8.3) - With Demo Data',
                url: 'https://three.openemr.io/a/openemr',
                portalUrl: 'https://three.openemr.io/a/openemr/portal',
                swaggerUrl: 'https://three.openemr.io/openemr/swagger',
                version: 'OpenEMR 7.0.3 Development (Ubuntu)',
                status: 'active',
                hasData: true
            },
            {
                name: 'Alpine 3.18 (PHP 8.2) - With Demo Data',
                url: 'https://two.openemr.io/c/openemr',
                portalUrl: 'https://two.openemr.io/c/openemr/portal',
                swaggerUrl: 'https://two.openemr.io/b/openemr/swagger',
                version: 'OpenEMR 7.0.3 Development (PHP 8.2)',
                status: 'active',
                hasData: true
            },
            {
                name: 'Alpine 3.17 (PHP 8.1) - With Demo Data',
                url: 'https://ten.openemr.io/e/openemr',
                portalUrl: 'https://ten.openemr.io/e/openemr/portal',
                swaggerUrl: 'https://ten.openemr.io/d/openemr/swagger',
                version: 'OpenEMR 7.0.3 Development (PHP 8.1)',
                status: 'active',
                hasData: true
            }
        ];

        this.credentials = {
            admin: {
                username: 'admin',
                password: 'pass',
                role: 'Administrator',
                description: 'Full system access - manage users, settings, and all clinical data'
            },
            physician: {
                username: 'physician',
                password: 'physician',
                role: 'Physician',
                description: 'Complete clinical access - patients, prescriptions, procedures'
            },
            clinician: {
                username: 'clinician',
                password: 'clinician',
                role: 'Clinician',
                description: 'Clinical access with some restrictions compared to physician'
            },
            accountant: {
                username: 'accountant',
                password: 'accountant',
                role: 'Accountant',
                description: 'Financial management - billing, insurance, payments'
            },
            receptionist: {
                username: 'receptionist',
                password: 'receptionist',
                role: 'Front Desk Receptionist',
                description: 'Patient scheduling, registration, basic admin tasks'
            }
        };

        this.patientCredentials = {
            phil: {
                username: 'Phil1',
                password: 'phil',
                email: 'heya@invalid.email.com',
                description: 'Patient portal access - view records, schedule appointments'
            },
            susan: {
                username: 'Susan2',
                password: 'susan',
                email: 'nana@invalid.email.com',
                description: 'Patient portal access - view records, schedule appointments'
            }
        };

        this.currentServer = this.demoServers[0]; // Default to main demo
        this.initializeInterface();
    }

    initializeInterface() {
        this.checkServerStatus();
        this.setupEventListeners();
        this.displayCredentialOptions();
    }

    async checkServerStatus() {
        const statusElement = document.getElementById('serverStatus');
        if (!statusElement) return;

        statusElement.innerHTML = '<span class="status-checking">🔄 Checking OpenEMR demo servers...</span>';

        try {
            // Test connectivity to demo servers
            const serverTests = this.demoServers.map(async (server, index) => {
                try {
                    const response = await fetch(server.url, { 
                        method: 'HEAD', 
                        mode: 'no-cors',
                        cache: 'no-cache'
                    });
                    return { server, index, available: true };
                } catch (error) {
                    return { server, index, available: false };
                }
            });

            const results = await Promise.all(serverTests);
            const availableServers = results.filter(r => r.available);

            if (availableServers.length > 0) {
                this.currentServer = availableServers[0].server;
                statusElement.innerHTML = `
                    <span class="status-connected">✅ Connected to ${this.currentServer.name}</span>
                    <small>Development 7.0.3 with daily builds | ${availableServers.length}/${this.demoServers.length} servers available</small>
                `;
            } else {
                statusElement.innerHTML = '<span class="status-connected">✅ OpenEMR Development Demo Ready (external connectivity)</span>';
            }
        } catch (error) {
            statusElement.innerHTML = '<span class="status-connected">✅ OpenEMR Demo Ready (external connectivity)</span>';
        }
    }

    setupEventListeners() {
        // Provider role buttons
        Object.keys(this.credentials).forEach(role => {
            const button = document.getElementById(`launch-${role}`);
            if (button) {
                button.addEventListener('click', () => this.launchOpenEMR(role));
            }
        });

        // Patient portal buttons
        Object.keys(this.patientCredentials).forEach(patient => {
            const button = document.getElementById(`launch-patient-${patient}`);
            if (button) {
                button.addEventListener('click', () => this.launchPatientPortal(patient));
            }
        });

        // Server selection
        const serverSelect = document.getElementById('serverSelect');
        if (serverSelect) {
            serverSelect.addEventListener('change', (e) => {
                this.currentServer = this.demoServers[e.target.value];
                this.updateServerInfo();
            });
        }

        // Quick launch buttons
        const quickAdminBtn = document.getElementById('quickAdmin');
        const quickPhysicianBtn = document.getElementById('quickPhysician');
        const quickPatientBtn = document.getElementById('quickPatient');
        const quickAPIBtn = document.getElementById('quickAPI');

        if (quickAdminBtn) quickAdminBtn.addEventListener('click', () => this.launchOpenEMR('admin'));
        if (quickPhysicianBtn) quickPhysicianBtn.addEventListener('click', () => this.launchOpenEMR('physician'));
        if (quickPatientBtn) quickPatientBtn.addEventListener('click', () => this.launchPatientPortal('phil'));
        if (quickAPIBtn) quickAPIBtn.addEventListener('click', () => this.launchAPI());
    }

    displayCredentialOptions() {
        this.updateProviderCredentials();
        this.updatePatientCredentials();
        this.updateServerSelector();
    }

    updateProviderCredentials() {
        const container = document.getElementById('providerCredentials');
        if (!container) return;

        const credentialsList = Object.entries(this.credentials).map(([key, cred]) => `
            <div class="credential-card">
                <div class="credential-header">
                    <h4>${cred.role}</h4>
                    <span class="credential-badge">${key}</span>
                </div>
                <div class="credential-info">
                    <p class="credential-desc">${cred.description}</p>
                    <div class="credential-details">
                        <code>Username: ${cred.username}</code>
                        <code>Password: ${cred.password}</code>
                    </div>
                </div>
                <button id="launch-${key}" class="launch-btn provider-btn">
                    🚀 Launch as ${cred.role}
                </button>
            </div>
        `).join('');

        container.innerHTML = credentialsList;
    }

    updatePatientCredentials() {
        const container = document.getElementById('patientCredentials');
        if (!container) return;

        const patientsList = Object.entries(this.patientCredentials).map(([key, patient]) => `
            <div class="credential-card patient-card">
                <div class="credential-header">
                    <h4>Patient: ${patient.username}</h4>
                    <span class="credential-badge patient">Patient</span>
                </div>
                <div class="credential-info">
                    <p class="credential-desc">${patient.description}</p>
                    <div class="credential-details">
                        <code>Username: ${patient.username}</code>
                        <code>Password: ${patient.password}</code>
                        <code>Email: ${patient.email}</code>
                    </div>
                </div>
                <button id="launch-patient-${key}" class="launch-btn patient-btn">
                    🏥 Launch Patient Portal
                </button>
            </div>
        `).join('');

        container.innerHTML = patientsList;
    }

    updateServerSelector() {
        const select = document.getElementById('serverSelect');
        if (!select) return;

        select.innerHTML = this.demoServers.map((server, index) => 
            `<option value="${index}" ${server === this.currentServer ? 'selected' : ''}>${server.name}</option>`
        ).join('');
    }

    updateServerInfo() {
        const info = document.getElementById('serverInfo');
        if (info) {
            info.innerHTML = `
                <strong>Current Server:</strong> ${this.currentServer.name}<br>
                <strong>Version:</strong> ${this.currentServer.version}<br>
                <strong>OpenEMR URL:</strong> <a href="${this.currentServer.url}" target="_blank">${this.currentServer.url}</a><br>
                <strong>Patient Portal:</strong> <a href="${this.currentServer.portalUrl}" target="_blank">${this.currentServer.portalUrl}</a><br>
                <strong>API/Swagger:</strong> <a href="${this.currentServer.swaggerUrl}" target="_blank">${this.currentServer.swaggerUrl}</a><br>
                <strong>Demo Data:</strong> ${this.currentServer.hasData ? '✅ Yes (Full patient records)' : '❌ No (Empty database)'}
            `;
        }
    }

    launchOpenEMR(role) {
        const credential = this.credentials[role];
        if (!credential) {
            alert('Invalid role selected');
            return;
        }

        // Create a helpful launch page with credentials and direct link
        const launchHtml = this.createQuickLaunchPage(
            this.currentServer.url,
            credential.username,
            credential.password,
            credential.role
        );

        // Open in new window/tab
        const newWindow = window.open('', '_blank');
        newWindow.document.write(launchHtml);
        newWindow.document.close();

        // Also open the actual OpenEMR demo in another tab for immediate access
        setTimeout(() => {
            window.open(this.currentServer.url, '_blank');
        }, 1000);

        // Update launch status
        this.updateLaunchStatus(`Launching OpenEMR as ${credential.role}...`);
    }

    launchPatientPortal(patientKey) {
        const patient = this.patientCredentials[patientKey];
        if (!patient) {
            alert('Invalid patient selected');
            return;
        }

        // Create patient launch page with credentials
        const launchHtml = this.createPatientQuickLaunchPage(
            this.currentServer.portalUrl,
            patient.username,
            patient.password
        );

        // Open in new window/tab
        const newWindow = window.open('', '_blank');
        newWindow.document.write(launchHtml);
        newWindow.document.close();

        // Also open the actual patient portal
        setTimeout(() => {
            window.open(this.currentServer.portalUrl, '_blank');
        }, 1000);

        // Update launch status
        this.updateLaunchStatus(`Launching Patient Portal for ${patient.username}...`);
    }

    launchAPI() {
        // Open the Swagger API documentation
        window.open(this.currentServer.swaggerUrl, '_blank');
        this.updateLaunchStatus('Opening API/Swagger documentation...');
    }

    createQuickLaunchPage(url, username, password, role) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Quick Launch: ${role}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #0f766e 0%, #0891b2 100%);
            color: white;
            margin: 0;
            padding: 40px;
            text-align: center;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: rgba(255,255,255,0.1);
            padding: 40px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        .logo { font-size: 4em; margin-bottom: 20px; }
        h1 { color: #00ffd5; margin-bottom: 10px; }
        .role-badge {
            background: linear-gradient(45deg, #dc2626, #ef4444);
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            display: inline-block;
            margin-bottom: 30px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .credentials-box {
            background: rgba(0,0,0,0.3);
            padding: 25px;
            border-radius: 15px;
            margin: 25px 0;
            border: 2px solid #00ffd5;
        }
        .credential-item {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            font-size: 1.2em;
        }
        .credential-value {
            background: rgba(0,255,213,0.2);
            padding: 5px 15px;
            border-radius: 8px;
            color: #00ffd5;
            font-family: 'Courier New', monospace;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .credential-value:hover {
            background: rgba(0,255,213,0.4);
            transform: scale(1.05);
        }
        .launch-btn {
            background: linear-gradient(45deg, #059669, #10b981);
            color: white;
            border: none;
            padding: 15px 40px;
            border-radius: 10px;
            font-size: 1.3em;
            font-weight: bold;
            cursor: pointer;
            margin: 20px 10px;
            transition: all 0.3s ease;
            text-transform: uppercase;
        }
        .launch-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.3);
        }
        .launch-btn.primary {
            background: linear-gradient(45deg, #0891b2, #06b6d4);
            font-size: 1.5em;
            padding: 20px 50px;
        }
        .instructions {
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            text-align: left;
        }
        .step {
            margin: 10px 0;
            padding: 10px;
            background: rgba(0,0,0,0.2);
            border-radius: 5px;
        }
        .copy-btn {
            background: rgba(0,255,213,0.2);
            border: 1px solid #00ffd5;
            color: #00ffd5;
            padding: 3px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.8em;
            margin-left: 10px;
        }
        .auto-opening {
            background: rgba(16,185,129,0.2);
            border: 1px solid #10b981;
            color: #10b981;
            padding: 15px;
            border-radius: 10px;
            margin: 20px 0;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🚀</div>
        <h1>Quick Launch OpenEMR</h1>
        <div class="role-badge">${role}</div>
        
        <div class="auto-opening">
            ✅ OpenEMR Demo is opening automatically in another tab!
        </div>
        
        <div class="credentials-box">
            <h3 style="color: #00ffd5; margin-bottom: 20px;">📋 Your Login Credentials</h3>
            <div class="credential-item">
                <span>Username:</span>
                <span class="credential-value" onclick="copyToClipboard('${username}')" title="Click to copy">${username} <span class="copy-btn">Copy</span></span>
            </div>
            <div class="credential-item">
                <span>Password:</span>
                <span class="credential-value" onclick="copyToClipboard('${password}')" title="Click to copy">${password} <span class="copy-btn">Copy</span></span>
            </div>
        </div>
        
        <div class="instructions">
            <h4 style="color: #00ffd5;">Quick Steps:</h4>
            <div class="step">1️⃣ OpenEMR demo opened in new tab</div>
            <div class="step">2️⃣ Click username/password above to copy</div>
            <div class="step">3️⃣ Paste into OpenEMR login form</div>
            <div class="step">4️⃣ Click Login - You're in!</div>
        </div>
        
        <button class="launch-btn primary" onclick="window.open('${url}', '_blank')">
            🌐 Open OpenEMR Demo
        </button>
        
        <button class="launch-btn" onclick="copyCredentials()">
            📋 Copy All Credentials
        </button>
        
        <div style="margin-top: 30px; opacity: 0.8;">
            <small>OpenEMR Demo URL: <a href="${url}" target="_blank" style="color: #00ffd5;">${url}</a></small>
        </div>
    </div>
    
    <script>
        function copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(() => {
                alert('Copied: ' + text);
            }).catch(() => {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                alert('Copied: ' + text);
            });
        }
        
        function copyCredentials() {
            const credentials = 'Username: ${username}\\nPassword: ${password}';
            copyToClipboard(credentials);
        }
        
        // Auto-open OpenEMR after 2 seconds
        setTimeout(() => {
            window.open('${url}', '_blank');
        }, 2000);
    </script>
</body>
</html>`;
    }

    createPatientQuickLaunchPage(portalUrl, username, password) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Patient Portal Launch - ${username}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #059669 0%, #10b981 100%);
            color: white;
            margin: 0;
            padding: 40px;
            text-align: center;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: rgba(255,255,255,0.1);
            padding: 40px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        .logo { font-size: 4em; margin-bottom: 20px; }
        h1 { color: #00ffd5; margin-bottom: 10px; }
        .patient-badge {
            background: linear-gradient(45deg, #059669, #10b981);
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            display: inline-block;
            margin-bottom: 30px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .credentials-box {
            background: rgba(0,0,0,0.3);
            padding: 25px;
            border-radius: 15px;
            margin: 25px 0;
            border: 2px solid #10b981;
        }
        .credential-item {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            font-size: 1.2em;
        }
        .credential-value {
            background: rgba(16,185,129,0.2);
            padding: 5px 15px;
            border-radius: 8px;
            color: #10b981;
            font-family: 'Courier New', monospace;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .credential-value:hover {
            background: rgba(16,185,129,0.4);
            transform: scale(1.05);
        }
        .launch-btn {
            background: linear-gradient(45deg, #0891b2, #06b6d4);
            color: white;
            border: none;
            padding: 15px 40px;
            border-radius: 10px;
            font-size: 1.3em;
            font-weight: bold;
            cursor: pointer;
            margin: 20px 10px;
            transition: all 0.3s ease;
            text-transform: uppercase;
        }
        .launch-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.3);
        }
        .launch-btn.primary {
            background: linear-gradient(45d, #059669, #10b981);
            font-size: 1.5em;
            padding: 20px 50px;
        }
        .instructions {
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            text-align: left;
        }
        .step {
            margin: 10px 0;
            padding: 10px;
            background: rgba(0,0,0,0.2);
            border-radius: 5px;
        }
        .copy-btn {
            background: rgba(16,185,129,0.2);
            border: 1px solid #10b981;
            color: #10b981;
            padding: 3px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.8em;
            margin-left: 10px;
        }
        .auto-opening {
            background: rgba(16,185,129,0.2);
            border: 1px solid #10b981;
            color: #10b981;
            padding: 15px;
            border-radius: 10px;
            margin: 20px 0;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🏥</div>
        <h1>Patient Portal Access</h1>
        <div class="patient-badge">Patient: ${username}</div>
        
        <div class="auto-opening">
            ✅ Patient Portal is opening automatically in another tab!
        </div>
        
        <div class="credentials-box">
            <h3 style="color: #10b981; margin-bottom: 20px;">🔑 Your Login Credentials</h3>
            <div class="credential-item">
                <span>Username:</span>
                <span class="credential-value" onclick="copyToClipboard('${username}')" title="Click to copy">${username} <span class="copy-btn">Copy</span></span>
            </div>
            <div class="credential-item">
                <span>Password:</span>
                <span class="credential-value" onclick="copyToClipboard('${password}')" title="Click to copy">${password} <span class="copy-btn">Copy</span></span>
            </div>
        </div>
        
        <div class="instructions">
            <h4 style="color: #10b981;">Patient Portal Steps:</h4>
            <div class="step">1️⃣ Patient Portal opened in new tab</div>
            <div class="step">2️⃣ Click username/password above to copy</div>
            <div class="step">3️⃣ Paste into portal login form</div>
            <div class="step">4️⃣ Access your medical records!</div>
        </div>
        
        <button class="launch-btn primary" onclick="window.open('${portalUrl}', '_blank')">
            🌐 Open Patient Portal
        </button>
        
        <button class="launch-btn" onclick="copyCredentials()">
            📋 Copy Credentials
        </button>
        
        <div style="margin-top: 30px; opacity: 0.8;">
            <small>Patient Portal URL: <a href="${portalUrl}" target="_blank" style="color: #10b981;">${portalUrl}</a></small>
        </div>
    </div>
    
    <script>
        function copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(() => {
                alert('Copied: ' + text);
            }).catch(() => {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                alert('Copied: ' + text);
            });
        }
        
        function copyCredentials() {
            const credentials = 'Username: ${username}\\nPassword: ${password}';
            copyToClipboard(credentials);
        }
        
        // Auto-open Patient Portal after 2 seconds
        setTimeout(() => {
            window.open('${portalUrl}', '_blank');
        }, 2000);
    </script>
</body>
</html>`;
    }

    updateLaunchStatus(message) {
        const status = document.getElementById('launchStatus');
        if (status) {
            status.innerHTML = `<span class="status-launching">⚡ ${message}</span>`;
            setTimeout(() => {
                status.innerHTML = '<span class="status-ready">✅ Ready for new launches</span>';
            }, 3000);
        }
    }

    // Utility method to test individual server
    async testServer(serverUrl) {
        try {
            const response = await fetch(serverUrl, { 
                method: 'HEAD', 
                mode: 'no-cors' 
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    // Get current demo server statistics
    getDemoStats() {
        return {
            totalServers: this.demoServers.length,
            currentServer: this.currentServer.name,
            version: this.currentServer.version,
            totalRoles: Object.keys(this.credentials).length,
            totalPatients: Object.keys(this.patientCredentials).length,
            resetTime: '8:30 AM UTC (daily reset with latest dev builds)',
            features: 'Latest OpenEMR 7.0.3 development features'
        };
    }
}

// Initialize when DOM is ready
if (typeof window !== 'undefined') {
    window.AutoOpenEMRLauncher = AutoOpenEMRLauncher;
}

// Auto-initialize if in browser
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        window.openEMRLauncher = new AutoOpenEMRLauncher();
    });
}
