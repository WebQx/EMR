// WebQx Healthcare Platform - Windows Service Installer
// Creates Windows services for automatic startup and management

const Service = require('node-windows').Service;
const path = require('path');

const WEBQX_HOME = path.join(__dirname, '..');

// Service configurations
const services = [
    {
        name: 'WebQx Authentication Backend',
        description: 'WebQx Healthcare Platform - Authentication and OAuth2 Backend Service',
        script: path.join(WEBQX_HOME, 'django-auth-backend', 'auth-server-social.js'),
        env: {
            NODE_ENV: 'production',
            PORT: '3001'
        }
    },
    {
        name: 'WebQx Frontend Server',
        description: 'WebQx Healthcare Platform - Frontend Static File Server',
        script: path.join(WEBQX_HOME, 'static-server.js'),
        env: {
            NODE_ENV: 'production',
            PORT: '3000'
        }
    },
    {
        name: 'WebQx Main Application',
        description: 'WebQx Healthcare Platform - Main Application Server with EMR and Telehealth',
        script: path.join(WEBQX_HOME, 'server.js'),
        env: {
            NODE_ENV: 'production',
            PORT: '8080'
        }
    }
];

function installServices() {
    console.log('========================================');
    console.log('WebQx Healthcare Platform - Service Installation');
    console.log('========================================');
    console.log('Installing Windows services for automatic startup...\n');

    services.forEach((serviceConfig, index) => {
        console.log(`[${index + 1}/${services.length}] Installing: ${serviceConfig.name}`);
        
        // Create the service object
        const svc = new Service({
            name: serviceConfig.name,
            description: serviceConfig.description,
            script: serviceConfig.script,
            nodeOptions: [
                '--max-old-space-size=4096'
            ],
            env: serviceConfig.env,
            wait: 2,
            grow: 0.5,
            maxRestarts: 10
        });

        // Listen for service events
        svc.on('install', () => {
            console.log(`✅ ${serviceConfig.name} installed successfully`);
            console.log(`   Script: ${serviceConfig.script}`);
            console.log(`   Status: Service created and ready to start`);
            
            // Start the service
            svc.start();
        });

        svc.on('start', () => {
            console.log(`🚀 ${serviceConfig.name} started successfully`);
        });

        svc.on('alreadyinstalled', () => {
            console.log(`⚠️  ${serviceConfig.name} is already installed`);
            console.log(`   Use uninstall script first if you want to reinstall`);
        });

        svc.on('error', (err) => {
            console.log(`❌ Error installing ${serviceConfig.name}:`, err);
        });

        // Install the service
        svc.install();
    });

    setTimeout(() => {
        console.log('\n========================================');
        console.log('WebQx Services Installation Complete!');
        console.log('========================================');
        console.log('\nServices installed:');
        services.forEach(service => {
            console.log(`• ${service.name}`);
        });
        
        console.log('\nService Management:');
        console.log('• View services: services.msc');
        console.log('• Start all: net start "WebQx Authentication Backend" && net start "WebQx Frontend Server" && net start "WebQx Main Application"');
        console.log('• Stop all: net stop "WebQx Main Application" && net stop "WebQx Frontend Server" && net stop "WebQx Authentication Backend"');
        console.log('• Uninstall: node uninstall-webqx-services.js');
        
        console.log('\nAccess Points (after services start):');
        console.log('• EMR Platform: http://localhost:3000/index-clean.html');
        console.log('• Login Portal: http://localhost:3000/login-clean.html');
        console.log('• Patient Portal: http://localhost:3000/patient-portal/');
        console.log('• Provider Portal: http://localhost:3000/provider/');
        console.log('• Telehealth: http://localhost:3000/telehealth/');
        console.log('• Admin Console: http://localhost:3000/admin-console/');
        console.log('• API Backend: http://localhost:3001');
        
        console.log('\n✅ WebQx Healthcare Platform will now start automatically with Windows!');
    }, 10000); // Wait 10 seconds for all services to process
}

// Check if running as administrator
function isAdmin() {
    try {
        const { execSync } = require('child_process');
        execSync('net session', { stdio: 'pipe' });
        return true;
    } catch {
        return false;
    }
}

// Main execution
if (!isAdmin()) {
    console.log('❌ ERROR: Administrator privileges required');
    console.log('Right-click Command Prompt and select "Run as administrator"');
    console.log('Then run: node install-webqx-services.js');
    process.exit(1);
}

// Check if required files exist
services.forEach(service => {
    const fs = require('fs');
    if (!fs.existsSync(service.script)) {
        console.log(`❌ ERROR: Required script not found: ${service.script}`);
        process.exit(1);
    }
});

console.log('✅ Administrator privileges confirmed');
console.log('✅ All required scripts found');
console.log('');

installServices();
