#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Create dist directory
const distDir = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

console.log('Building static site for GitHub Pages...');

// HTML files to copy
const htmlFiles = [
    'index.html',
    'login.html',
    'demo.html',
    'demo-fhir-r4-appointment-booking.html',
    'demo-lab-results-simple.html',
    'demo-lab-results-viewer.html',
    'header-demo.html',
    'ottehr-demo.html',
    'ottehr-keycloak-demo.html',
    'telehealth_demo.html',
    'telehealth-demo.html',
    'telehealth-session-demo.html',
    'whisper-demo.html',
    'whisper-openemr-demo.html'
];

// Copy HTML files
htmlFiles.forEach(file => {
    const srcPath = path.join(__dirname, '..', file);
    const destPath = path.join(distDir, file);
    
    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`Copied: ${file}`);
    } else {
        console.warn(`File not found: ${file}`);
    }
});

// Copy directories with HTML files
const directoriesToCopy = [
    'demo',
    'provider',
    'patient-portal',
    'auth',
    'modules',
    'admin-console'
];

directoriesToCopy.forEach(dirName => {
    const srcDir = path.join(__dirname, '..', dirName);
    const destDir = path.join(distDir, dirName);
    
    if (fs.existsSync(srcDir)) {
        copyDirectoryRecursive(srcDir, destDir);
        console.log(`Copied directory: ${dirName}`);
    } else {
        console.log(`Directory not found: ${dirName}`);
    }
});

// Function to copy directory recursively
function copyDirectoryRecursive(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
    const items = fs.readdirSync(src);
    
    items.forEach(item => {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);
        const stat = fs.statSync(srcPath);
        
        if (stat.isDirectory()) {
            // Skip node_modules, .git, and other build directories
            if (!['node_modules', '.git', '__tests__', 'test', 'tests', '.vscode'].includes(item)) {
                copyDirectoryRecursive(srcPath, destPath);
            }
        } else if (stat.isFile()) {
            // Copy HTML, CSS, JS, and other web assets
            const ext = path.extname(item).toLowerCase();
            if (['.html', '.css', '.js', '.json', '.md', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.ico'].includes(ext)) {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    });
}

// Copy demo directory if it exists
const demoDir = path.join(__dirname, '..', 'demo');
if (fs.existsSync(demoDir)) {
    const demoDest = path.join(distDir, 'demo');
    if (!fs.existsSync(demoDest)) {
        fs.mkdirSync(demoDest, { recursive: true });
    }
    
    const demoFiles = fs.readdirSync(demoDir);
    demoFiles.forEach(file => {
        if (file.endsWith('.html') || file.endsWith('.js') || file.endsWith('.css')) {
            fs.copyFileSync(
                path.join(demoDir, file),
                path.join(demoDest, file)
            );
            console.log(`Copied demo: ${file}`);
        }
    });
}

// Copy standalone JS files (not server files or tests)
const rootFiles = fs.readdirSync(path.join(__dirname, '..'));
rootFiles.forEach(file => {
    if (file.endsWith('.js') && 
        !file.includes('server') && 
        !file.includes('lambda') && 
        !file.includes('test') &&
        !file.startsWith('jest')) {
        
        const srcPath = path.join(__dirname, '..', file);
        const destPath = path.join(distDir, file);
        fs.copyFileSync(srcPath, destPath);
        console.log(`Copied JS: ${file}`);
    }
});

// Copy CSS files if any exist
rootFiles.forEach(file => {
    if (file.endsWith('.css')) {
        const srcPath = path.join(__dirname, '..', file);
        const destPath = path.join(distDir, file);
        fs.copyFileSync(srcPath, destPath);
        console.log(`Copied CSS: ${file}`);
    }
});

// Create mock API script for GitHub Pages
const mockApiScript = `
// Mock API endpoints for GitHub Pages static deployment
window.mockAPI = {
    '/health': {
        status: 'healthy',
        fhir: 'connected',
        timestamp: new Date().toISOString()
    },
    '/dev/token': {
        access_token: 'demo-token-' + Math.random().toString(36).substr(2, 9)
    },
    '/fhir/Patient': {
        entry: [{
            resource: {
                id: 'demo-patient-1',
                name: [{
                    given: ['John'],
                    family: 'Doe'
                }],
                birthDate: '1980-01-15',
                gender: 'male',
                telecom: [{
                    system: 'email',
                    value: 'john.doe@example.com'
                }],
                identifier: [{
                    value: 'P001234567'
                }]
            }
        }]
    },
    '/fhir/Appointment': {
        entry: [{
            resource: {
                id: 'demo-appointment-1',
                status: 'booked',
                start: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                description: 'Annual Physical Examination',
                participant: [{
                    actor: {
                        display: 'Dr. Sarah Johnson'
                    }
                }]
            }
        }]
    },
    '/api/auth/profile': {
        success: false,
        message: 'Demo mode - authentication disabled'
    }
};

// Override fetch for demo endpoints
const originalFetch = window.fetch;
window.fetch = function(url, options) {
    // Handle relative URLs
    const fullUrl = url.startsWith('/') ? url : '/' + url;
    
    if (window.mockAPI[fullUrl]) {
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(window.mockAPI[fullUrl])
        });
    }
    
    // For authentication endpoints, return demo data
    if (fullUrl.includes('/api/auth/') || fullUrl.includes('/login')) {
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
                success: true,
                user: {
                    id: 'demo-user-1',
                    name: 'Demo User',
                    email: 'demo@webqx.com',
                    accountStatus: 'Active'
                },
                token: 'demo-token-12345'
            })
        });
    }
    
    // For other URLs, try original fetch but handle errors gracefully
    return originalFetch.apply(this, arguments).catch(error => {
        console.warn('Fetch failed, using mock data:', error);
        return {
            ok: false,
            json: () => Promise.resolve({error: 'Service unavailable in demo mode'})
        };
    });
};

// Set up demo authentication for GitHub Pages
if (typeof localStorage !== 'undefined') {
    localStorage.setItem('authToken', 'demo-token-12345');
    localStorage.setItem('user', JSON.stringify({
        id: 'demo-user-1',
        name: 'Demo User',
        email: 'demo@webqx.com',
        accountStatus: 'Active'
    }));
}

// GitHub Pages specific: Handle routing for login
if (window.location.pathname === '/login' || window.location.pathname === '/webqx/login') {
    window.location.href = window.location.href.replace(/\\/login$/, '/login.html');
}
`;

fs.writeFileSync(path.join(distDir, 'api-mock.js'), mockApiScript);
console.log('Created: api-mock.js');

// Copy GitHub Pages integration patch
const integrationPatchSrc = path.join(__dirname, '..', 'integrations', 'github-pages-integration-patch.js');
if (fs.existsSync(integrationPatchSrc)) {
    const integrationPatchDest = path.join(distDir, 'github-pages-integration-patch.js');
    fs.copyFileSync(integrationPatchSrc, integrationPatchDest);
    console.log('Copied: github-pages-integration-patch.js');
}

// Copy service worker
const swSrc = path.join(__dirname, '..', 'webqx-sw.js');
if (fs.existsSync(swSrc)) {
    const swDest = path.join(distDir, 'webqx-sw.js');
    fs.copyFileSync(swSrc, swDest);
    console.log('Copied: webqx-sw.js');
}

// Update HTML files to include mock API and integration patch
htmlFiles.forEach(file => {
    const filePath = path.join(distDir, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Add mock API script and integration patch before closing head tag
        if (content.includes('</head>') && !content.includes('api-mock.js')) {
            content = content.replace('</head>', 
                '    <script src="api-mock.js"></script>\n' +
                '    <script src="github-pages-integration-patch.js"></script>\n' +
                '</head>');
            fs.writeFileSync(filePath, content);
            console.log(`Updated: ${file} with mock API and integration patch`);
        }
    }
});

// Create README for GitHub Pages
const readmeContent = `# WebQX Healthcare Platform - GitHub Pages Demo

This is a static demo deployment of the WebQX Healthcare Platform.

## Available Demos:
- [Main Patient Portal](index.html)
- [Login Demo](login.html)
- [Telehealth Demo](telehealth-demo.html)
- [Whisper Demo](whisper-demo.html)
- [FHIR Appointment Booking](demo-fhir-r4-appointment-booking.html)
- [Lab Results Viewer](demo-lab-results-viewer.html)
- [OpenEMR Integration](whisper-openemr-demo.html)
- [Ottehr Integration](ottehr-demo.html)

## Features Demonstrated:
- Patient portal interface
- Appointment scheduling
- Lab results viewing
- Telehealth integration
- Multi-language support
- FHIR R4 compatibility
- Mock authentication system

Note: This is a static demo with mock data for demonstration purposes.
The full platform includes backend services, real authentication, and database integration.

## Local Development:
\`\`\`bash
npm install
npm run build:pages
\`\`\`

## Live Demo:
Visit the GitHub Pages deployment to see the platform in action.
`;

fs.writeFileSync(path.join(distDir, 'README.md'), readmeContent);
console.log('Created: README.md');

// Create .nojekyll file to ensure GitHub Pages serves all files
fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
console.log('Created: .nojekyll');

console.log('\\nBuild complete! The static site is ready in the dist/ directory.');
console.log('You can now commit and push to trigger GitHub Pages deployment.');
