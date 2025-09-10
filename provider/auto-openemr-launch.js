/**
 * WebQX™ - Automatic OpenEMR Launch Integration
 * Seamless access to official OpenEMR demo with auto-credential filling
 * Supports all user roles: Admin, Physician, Clinician, Accountant, Receptionist, Patients
 */

class AutoOpenEMRLauncher {
    constructor() {
        this.demoServers = [
            {
                name: 'Main Demo',
                url: 'https://demo.openemr.io/openemr',
                portalUrl: 'https://demo.openemr.io/openemr/portal',
                status: 'active'
            },
            {
                name: 'Alternate Demo',
                url: 'https://demo.openemr.io/a/openemr',
                portalUrl: 'https://demo.openemr.io/a/openemr/portal',
                status: 'active'
            },
            {
                name: 'Another Alternate Demo',
                url: 'https://demo.openemr.io/b/openemr',
                portalUrl: 'https://demo.openemr.io/b/openemr/portal',
                status: 'active'
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
                    <small>${availableServers.length}/${this.demoServers.length} demo servers available</small>
                `;
            } else {
                statusElement.innerHTML = '<span class="status-error">⚠️ Demo servers temporarily unavailable</span>';
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

        if (quickAdminBtn) quickAdminBtn.addEventListener('click', () => this.launchOpenEMR('admin'));
        if (quickPhysicianBtn) quickPhysicianBtn.addEventListener('click', () => this.launchOpenEMR('physician'));
        if (quickPatientBtn) quickPatientBtn.addEventListener('click', () => this.launchPatientPortal('phil'));
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
                <strong>URL:</strong> <a href="${this.currentServer.url}" target="_blank">${this.currentServer.url}</a><br>
                <strong>Portal URL:</strong> <a href="${this.currentServer.portalUrl}" target="_blank">${this.currentServer.portalUrl}</a>
            `;
        }
    }

    launchOpenEMR(role) {
        const credential = this.credentials[role];
        if (!credential) {
            alert('Invalid role selected');
            return;
        }

        // Create auto-login URL with form submission
        const autoLoginHtml = this.createAutoLoginPage(
            this.currentServer.url,
            credential.username,
            credential.password,
            credential.role
        );

        // Open in new window/tab
        const newWindow = window.open('', '_blank');
        newWindow.document.write(autoLoginHtml);
        newWindow.document.close();

        // Update launch status
        this.updateLaunchStatus(`Launching OpenEMR as ${credential.role}...`);
    }

    launchPatientPortal(patientKey) {
        const patient = this.patientCredentials[patientKey];
        if (!patient) {
            alert('Invalid patient selected');
            return;
        }

        // Create auto-login for patient portal
        const autoLoginHtml = this.createPatientAutoLoginPage(
            this.currentServer.portalUrl,
            patient.username,
            patient.password
        );

        // Open in new window/tab
        const newWindow = window.open('', '_blank');
        newWindow.document.write(autoLoginHtml);
        newWindow.document.close();

        // Update launch status
        this.updateLaunchStatus(`Launching Patient Portal for ${patient.username}...`);
    }

    createAutoLoginPage(url, username, password, role) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Launching OpenEMR - ${role}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #0f766e 0%, #0891b2 100%);
            color: white;
            text-align: center;
            padding: 50px;
        }
        .loader {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #0891b2;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .launch-info {
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 10px;
            margin: 20px auto;
            max-width: 500px;
        }
        code {
            background: rgba(0,0,0,0.3);
            padding: 2px 6px;
            border-radius: 3px;
        }
    </style>
</head>
<body>
    <h1>🚀 Launching OpenEMR</h1>
    <div class="loader"></div>
    <div class="launch-info">
        <h3>Connecting as: ${role}</h3>
        <p>Username: <code>${username}</code></p>
        <p>Server: <code>${url}</code></p>
        <p>Auto-filling credentials and logging in...</p>
    </div>
    
    <form id="loginForm" method="POST" action="${url}/interface/login/login.php?site=default" style="display: none;">
        <input type="hidden" name="authUser" value="${username}">
        <input type="hidden" name="clearPass" value="${password}">
        <input type="hidden" name="languageChoice" value="1">
    </form>
    
    <script>
        // Auto-submit the form after a brief delay
        setTimeout(() => {
            document.getElementById('loginForm').submit();
        }, 2000);
        
        // Fallback: redirect directly if form submission fails
        setTimeout(() => {
            window.location.href = '${url}';
        }, 5000);
    </script>
</body>
</html>`;
    }

    createPatientAutoLoginPage(portalUrl, username, password) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Launching Patient Portal - ${username}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #0f766e 0%, #0891b2 100%);
            color: white;
            text-align: center;
            padding: 50px;
        }
        .loader {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #0891b2;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .launch-info {
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 10px;
            margin: 20px auto;
            max-width: 500px;
        }
        code {
            background: rgba(0,0,0,0.3);
            padding: 2px 6px;
            border-radius: 3px;
        }
    </style>
</head>
<body>
    <h1>🏥 Launching Patient Portal</h1>
    <div class="loader"></div>
    <div class="launch-info">
        <h3>Patient: ${username}</h3>
        <p>Username: <code>${username}</code></p>
        <p>Portal: <code>${portalUrl}</code></p>
        <p>Auto-filling credentials and logging in...</p>
    </div>
    
    <form id="portalForm" method="POST" action="${portalUrl}/index.php?site=default" style="display: none;">
        <input type="hidden" name="authUser" value="${username}">
        <input type="hidden" name="clearPass" value="${password}">
        <input type="hidden" name="languageChoice" value="1">
    </form>
    
    <script>
        // Auto-submit the portal form
        setTimeout(() => {
            document.getElementById('portalForm').submit();
        }, 2000);
        
        // Fallback: redirect to portal directly
        setTimeout(() => {
            window.location.href = '${portalUrl}';
        }, 5000);
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
            totalRoles: Object.keys(this.credentials).length,
            totalPatients: Object.keys(this.patientCredentials).length,
            resetTime: '8:00 AM UTC (daily reset)'
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
