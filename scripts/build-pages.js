#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Create dist directory
const distDir = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

console.log('Building static site for GitHub Pages...');

// Detect Railway-backed API/EMR endpoints provided via CI environment or local config/pages-runtime.json
let RUNTIME_API_BASE = process.env.RAILWAY_PUBLIC_API_BASE || '';
let RUNTIME_EMR_BASE = process.env.RAILWAY_PUBLIC_EMR_BASE || '';
if (!RUNTIME_API_BASE) {
    try {
        const json = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'pages-runtime.json'), 'utf8'));
        RUNTIME_API_BASE = json.apiBase || '';
        RUNTIME_EMR_BASE = json.emrBase || '';
        if (RUNTIME_API_BASE) console.log('Using runtime config from config/pages-runtime.json');
    } catch (_) {}
}
const USING_RUNTIME_CONFIG = Boolean(RUNTIME_API_BASE);

// Build the React portal (Vite) if its package.json exists
try {
    const portalPkg = path.join(__dirname, '..', 'portal', 'package.json');
    if (fs.existsSync(portalPkg)) {
        console.log('Detected portal app. Building with Vite...');
        const { execSync } = require('child_process');
        execSync('npm run portal:build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    } else {
        console.log('Portal app not found, skipping portal build.');
    }
} catch (err) {
    console.warn('Portal build failed (continuing without portal):', err.message);
}

// HTML files to copy
const htmlFiles = [
    'index.html',
    'login.html',
    'demo.html',
    'demo-fhir-r4-appointment-booking.html',
    'demo-lab-results-simple.html',
    'demo-lab-results-viewer.html',
    'header-demo.html',
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
        // Fallback: certain demos live under archive/demos
        const altPath = path.join(__dirname, '..', 'archive', 'demos', file);
        if (fs.existsSync(altPath)) {
            fs.copyFileSync(altPath, destPath);
            console.log(`Copied (from archive/demos): ${file}`);
        } else {
            console.warn(`File not found: ${file}`);
        }
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
        // Generate an index.html stub if none exists to support portal placement cards
        const indexPath = path.join(destDir, 'index.html');
        if (!fs.existsSync(indexPath)) {
            const title = dirName.replace(/[-_]/g, ' ');
            const stub = `<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"UTF-8\"/><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"/><title>${title} • WebQX</title><style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;margin:0;padding:40px;background:#f5f7fb;color:#1a202c}h1{font-size:1.6rem;margin:0 0 1rem;background:linear-gradient(135deg,#2563eb,#4f46e5);-webkit-background-clip:text;color:transparent}a{color:#2563eb;text-decoration:none}a:hover{text-decoration:underline}footer{margin-top:3rem;font-size:.65rem;color:#64748b}</style></head><body><h1>${title} Section</h1><p>No dedicated landing page was found for <code>${dirName}/</code>. This stub was auto-generated during the GitHub Pages build so navigation cards remain functional.</p><p><a href=\"../index.html\">← Back to Root</a> • <a href=\"../portal/\">Portal Dashboard</a></p><footer>Auto-generated stub • ${new Date().toISOString()}</footer></body></html>`;
            fs.writeFileSync(indexPath, stub);
            console.log(`Created stub index.html for ${dirName}`);
        }
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

// If Railway endpoints are provided, generate a tiny runtime config consumed by webqx-remote-config.js
if (USING_RUNTIME_CONFIG) {
    const runtimeCfg = `// Generated by build-pages.js (GitHub Actions)
window.WEBQX_PROD_API = ${JSON.stringify(RUNTIME_API_BASE)};
window.WEBQX_PROD_EMR = ${JSON.stringify(RUNTIME_EMR_BASE || RUNTIME_API_BASE.replace('api.', 'emr.'))};
window.WEBQX_FORCE_ENV = 'remote';
console.log('🔧 Runtime config injected for Railway:', window.WEBQX_PROD_API, '→ EMR:', window.WEBQX_PROD_EMR);
`;
    fs.writeFileSync(path.join(distDir, 'runtime-config.js'), runtimeCfg);
    console.log('Created: runtime-config.js');
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
            const inject = [];
            // For standalone demo HTMLs, keep mock API to make them functional on Pages
            inject.push('    <script src="api-mock.js"></script>');
            inject.push('    <script src="github-pages-integration-patch.js"></script>');
            content = content.replace('</head>', inject.join('\n') + '\n</head>');
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

// Copy portal dist output if built, but place at root (unified SPA)
const portalDist = path.join(__dirname, '..', 'portal', 'dist');
if (fs.existsSync(portalDist)) {
    // Copy all portal build artifacts into root dist (overwriting any existing index.html with SPA version)
    copyDirectoryRecursive(portalDist, distDir);
    console.log('Unified: portal dist merged into dist/ root');

    // Backwards compatibility: create /portal/ redirect that points to root index with hash
    const legacyPortalDir = path.join(distDir, 'portal');
    if (!fs.existsSync(legacyPortalDir)) fs.mkdirSync(legacyPortalDir, { recursive: true });
    const redirectHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta http-equiv="refresh" content="0; url=../index.html#portal"/><title>Redirecting…</title><script>window.location.replace('../index.html#'+(window.location.hash?window.location.hash.substring(1):'portal'));</script><style>body{font-family:system-ui,Segoe UI,Roboto,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f5f7fb;color:#334155}</style></head><body><p>Redirecting to unified portal…</p></body></html>`;
    fs.writeFileSync(path.join(legacyPortalDir, 'index.html'), redirectHtml);
    fs.writeFileSync(path.join(legacyPortalDir, '404.html'), redirectHtml);
    console.log('Created legacy /portal redirect (index.html & 404.html)');

    // Inject runtime scripts into SPA index.html
    const spaIndex = path.join(distDir, 'index.html');
    if (fs.existsSync(spaIndex)) {
        let html = fs.readFileSync(spaIndex, 'utf8');
        if (html.includes('</head>')) {
            const tags = [];
            // Load runtime-config first (if present), then remote-config, then small integration patch.
            if (USING_RUNTIME_CONFIG) tags.push('  <script src="./runtime-config.js"></script>');
            // Ensure remote config is available to the SPA at runtime
            tags.push('  <script src="./webqx-remote-config.js"></script>');
                        // Route relative /api and /fhir calls to Railway from Pages
                        if (fs.existsSync(path.join(__dirname, '..', 'integrations', 'pages-spa-api-proxy.js'))) {
                                fs.copyFileSync(
                                    path.join(__dirname, '..', 'integrations', 'pages-spa-api-proxy.js'),
                                    path.join(distDir, 'pages-spa-api-proxy.js')
                                );
                                tags.push('  <script src="./pages-spa-api-proxy.js"></script>');
                        }
            // Keep small integrations helper (does not mock fetch)
            if (fs.existsSync(path.join(distDir, 'github-pages-integration-patch.js'))) {
                tags.push('  <script src="./github-pages-integration-patch.js"></script>');
            }
            // Avoid adding mock API to SPA when we expect a real Railway backend
            if (!USING_RUNTIME_CONFIG && !html.includes('api-mock.js') && fs.existsSync(path.join(distDir, 'api-mock.js'))) {
                tags.push('  <script src="./api-mock.js"></script>');
            }
            // Only insert if not already present
            const marker = '<!-- webqx-runtime-injected -->';
            if (!html.includes(marker)) {
                html = html.replace('</head>', tags.join('\n') + '\n  ' + marker + '\n</head>');
                fs.writeFileSync(spaIndex, html);
                console.log('Injected runtime config scripts into SPA index.html');
            }
        }
    }
}

// Create .nojekyll file to ensure GitHub Pages serves all files
fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
console.log('Created: .nojekyll');

// Create SPA 404 fallback to support deep links under GitHub Pages (/EMR/whatever -> index.html)
try {
    const indexPath = path.join(distDir, 'index.html');
    const fallbackPath = path.join(distDir, '404.html');
    if (fs.existsSync(indexPath) && !fs.existsSync(fallbackPath)) {
        const indexHtml = fs.readFileSync(indexPath);
        fs.writeFileSync(fallbackPath, indexHtml);
        console.log('Created: 404.html SPA fallback');
    }
} catch (e) {
    console.warn('Could not create 404.html fallback:', e.message);
}

console.log('\\nBuild complete! The static site is ready in the dist/ directory.');
console.log('You can now commit and push to trigger GitHub Pages deployment.');
