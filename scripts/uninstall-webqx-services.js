// WebQx Healthcare Platform - Windows Service Uninstaller
// Removes Windows services created by install-webqx-services.js

const Service = require('node-windows').Service;
const path = require('path');

const WEBQX_HOME = path.join(__dirname, '..');

// Service configurations (same as installer)
const services = [
    {
        name: 'WebQx Main Application',
        script: path.join(WEBQX_HOME, 'server.js')
    },
    {
        name: 'WebQx Frontend Server',
        script: path.join(WEBQX_HOME, 'static-server.js')
    },
    {
        name: 'WebQx Authentication Backend',
        script: path.join(WEBQX_HOME, 'django-auth-backend', 'auth-server-social.js')
    }
];

function uninstallServices() {
    console.log('========================================');
    console.log('WebQx Healthcare Platform - Service Removal');
    console.log('========================================');
    console.log('Removing Windows services...\n');

    services.forEach((serviceConfig, index) => {
        console.log(`[${index + 1}/${services.length}] Uninstalling: ${serviceConfig.name}`);
        
        // Create the service object
        const svc = new Service({
            name: serviceConfig.name,
            script: serviceConfig.script
        });

        // Listen for service events
        svc.on('uninstall', () => {
            console.log(`✅ ${serviceConfig.name} uninstalled successfully`);
        });

        svc.on('doesnotexist', () => {
            console.log(`⚠️  ${serviceConfig.name} was not installed`);
        });

        svc.on('error', (err) => {
            console.log(`❌ Error uninstalling ${serviceConfig.name}:`, err);
        });

        // Uninstall the service
        svc.uninstall();
    });

    setTimeout(() => {
        console.log('\n========================================');
        console.log('WebQx Services Removal Complete!');
        console.log('========================================');
        console.log('\nServices removed:');
        services.forEach(service => {
            console.log(`• ${service.name}`);
        });
        
        console.log('\nWebQx Healthcare Platform services have been removed from Windows.');
        console.log('You can still run the platform manually using:');
        console.log('• start-webqx-services.bat');
        console.log('• Start-WebQxServices.ps1');
        console.log('');
        console.log('To reinstall services, run: node install-webqx-services.js');
        
    }, 5000); // Wait 5 seconds for all services to process
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
    console.log('Then run: node uninstall-webqx-services.js');
    process.exit(1);
}

console.log('✅ Administrator privileges confirmed');
console.log('');

uninstallServices();
