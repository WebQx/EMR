/**
 * OpenEMR Configuration for WebQX™ Provider Portal
 * 
 * Configure your OpenEMR instance details here or use environment variables
 */

window.openEMRConfig = {
    // OpenEMR Instance Configuration
    baseUrl: process.env.OPENEMR_BASE_URL || 'https://demo.openemr.io',
    
    // OAuth2 Client Configuration
    clientId: process.env.OPENEMR_CLIENT_ID || 'webqx-provider-portal',
    clientSecret: process.env.OPENEMR_CLIENT_SECRET || '', // For server-side flows
    
    // API Configuration
    apiVersion: '7.0.2',
    
    // FHIR Configuration
    fhir: {
        enabled: true,
        version: 'R4',
        baseUrl: null // Will auto-detect: {baseUrl}/apis/default/fhir
    },
    
    // OAuth2 Scopes
    scopes: [
        'openid',
        'fhirUser',
        'patient/Patient.read',
        'patient/Patient.write',
        'patient/Appointment.read',
        'patient/Appointment.write',
        'patient/Encounter.read',
        'patient/Encounter.write',
        'patient/Observation.read',
        'patient/DocumentReference.read',
        'user/Practitioner.read'
    ],
    
    // Security Settings
    security: {
        verifySSL: true,
        enablePKCE: true,
        timeout: 30000
    },
    
    // Launch Settings
    launch: {
        defaultMode: 'window', // 'window', 'modal', 'embed', 'redirect'
        autoClose: true,
        enableDebug: false
    },
    
    // Integration Features
    features: {
        enableAudit: true,
        enableSync: true,
        syncInterval: 15,
        enableNotifications: true
    }
};

// Development/Demo Configuration Override
if (window.location.hostname.includes('localhost') || 
    window.location.hostname.includes('github.io')) {
    
    // Override for demo/development
    window.openEMRConfig = {
        ...window.openEMRConfig,
        baseUrl: 'https://demo.openemr.io',
        security: {
            ...window.openEMRConfig.security,
            verifySSL: false // For demo environments
        },
        launch: {
            ...window.openEMRConfig.launch,
            enableDebug: true
        }
    };
}

// Environment-specific configurations
const envConfigs = {
    production: {
        baseUrl: 'https://openemr.yourorganization.com',
        security: {
            verifySSL: true,
            enablePKCE: true,
            timeout: 30000
        }
    },
    
    staging: {
        baseUrl: 'https://staging-openemr.yourorganization.com',
        security: {
            verifySSL: true,
            enablePKCE: true,
            timeout: 45000
        },
        launch: {
            enableDebug: true
        }
    },
    
    development: {
        baseUrl: 'https://dev-openemr.yourorganization.com',
        security: {
            verifySSL: false,
            enablePKCE: true,
            timeout: 60000
        },
        launch: {
            enableDebug: true
        }
    }
};

// Apply environment-specific config if available
const environment = process.env.NODE_ENV || 'development';
if (envConfigs[environment]) {
    window.openEMRConfig = {
        ...window.openEMRConfig,
        ...envConfigs[environment]
    };
}

// Export for CommonJS/Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.openEMRConfig;
}
