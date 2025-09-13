/**
 * WebQX Enhanced Breadcrumb Navigation
 * Provides clear navigation path and context awareness
 */

function createEnhancedBreadcrumbs() {
    const isGitHubPages = window.location.hostname.includes('github.io');
    const baseUrl = isGitHubPages ? '/webqx' : '';
    let currentPath = window.location.pathname;
    
    // Handle GitHub Pages prefix
    if (currentPath.startsWith('/webqx')) {
        currentPath = currentPath.substring(6) || '/';
    }
    
    // Don't show breadcrumbs on home page
    if (currentPath === '/' || currentPath === '/index.html') {
        return;
    }
    
    const breadcrumbMappings = {
        '/provider/': { title: 'Provider Portal', parent: '/', icon: '👨‍⚕️' },
        '/provider/index.html': { title: 'Provider Portal', parent: '/', icon: '👨‍⚕️' },
        '/telehealth-realtime-demo.html': { title: 'Real-Time Telehealth', parent: '/', icon: '🎥' },
        '/telehealth-demo.html': { title: 'Telehealth Demo', parent: '/', icon: '📹' },
        '/demo-fhir-r4-appointment-booking.html': { title: 'FHIR Appointments', parent: '/', icon: '📅' },
        '/whisper-demo.html': { title: 'AI Whisper Service', parent: '/', icon: '🎤' },
        '/demo-lab-results-viewer.html': { title: 'Lab Results Viewer', parent: '/', icon: '🧪' },
        '/auth/providers/login.html': { title: 'Provider Login', parent: '/auth/', icon: '🔐' },
        '/login.html': { title: 'Patient Login', parent: '/', icon: '👤' },
        '/ottehr-demo.html': { title: 'Ottehr Integration', parent: '/', icon: '🏥' },
        '/demo/PharmacyLocator-demo.html': { title: 'Pharmacy Locator', parent: '/demo/', icon: '💊' },
        '/patient-portal/telehealth-session.html': { title: 'Telehealth Session', parent: '/patient-portal/', icon: '🎥' }
    };
    
    const currentPage = breadcrumbMappings[currentPath];
    if (!currentPage) return;
    
    const breadcrumbHTML = `
        <div id="enhanced-breadcrumbs" style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 9998;
            background: rgba(26, 26, 46, 0.95);
            backdrop-filter: blur(15px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding: 8px 20px;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 13px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        ">
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 8px; color: #e0e0e0;">
                    <a href="${baseUrl}/" style="
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        color: #4f9cff;
                        text-decoration: none;
                        padding: 4px 8px;
                        border-radius: 8px;
                        transition: all 0.3s;
                    " onmouseover="this.style.background='rgba(79, 156, 255, 0.2)'"
                       onmouseout="this.style.background='transparent'">
                        <span>🏠</span>
                        <span>WebQX Hub</span>
                    </a>
                    
                    <span style="color: #666;">›</span>
                    
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span>${currentPage.icon}</span>
                        <span style="color: white; font-weight: 500;">${currentPage.title}</span>
                    </div>
                </div>
                
                <div style="display: flex; align-items: center; gap: 12px;">
                    <!-- Context Actions -->
                    <button onclick="showPageInfo()" style="
                        background: rgba(255, 255, 255, 0.1);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        color: white;
                        padding: 4px 8px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 11px;
                        transition: all 0.3s;
                    " onmouseover="this.style.background='rgba(255, 255, 255, 0.2)'"
                       onmouseout="this.style.background='rgba(255, 255, 255, 0.1)'"
                       title="Page Information">
                        ℹ️ Info
                    </button>
                    
                    <button onclick="toggleHelpPanel()" style="
                        background: rgba(255, 255, 255, 0.1);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        color: white;
                        padding: 4px 8px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 11px;
                        transition: all 0.3s;
                    " onmouseover="this.style.background='rgba(255, 255, 255, 0.2)'"
                       onmouseout="this.style.background='rgba(255, 255, 255, 0.1)'"
                       title="Help & Navigation Tips">
                        ❓ Help
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Help Panel -->
        <div id="help-panel" style="
            position: fixed;
            top: 50px;
            right: 20px;
            width: 320px;
            background: rgba(26, 26, 46, 0.98);
            backdrop-filter: blur(15px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
            z-index: 9997;
            display: none;
            color: white;
            font-size: 13px;
            max-height: 80vh;
            overflow-y: auto;
        ">
            <div style="display: flex; align-items: center; justify-content: between; margin-bottom: 15px;">
                <h3 style="margin: 0; color: #4f9cff; font-size: 14px; font-weight: 600;">
                    🧭 Navigation Help
                </h3>
                <button onclick="toggleHelpPanel()" style="
                    background: none;
                    border: none;
                    color: #999;
                    cursor: pointer;
                    font-size: 16px;
                    float: right;
                    margin-top: -5px;
                ">✕</button>
            </div>
            
            <div style="margin-bottom: 15px;">
                <h4 style="margin: 0 0 8px 0; color: #e0e0e0; font-size: 12px;">Quick Navigation:</h4>
                <div style="display: grid; gap: 6px;">
                    <div style="padding: 6px; background: rgba(255, 255, 255, 0.05); border-radius: 6px;">
                        🏠 <strong>Home:</strong> Click the WebQX Hub link or home button
                    </div>
                    <div style="padding: 6px; background: rgba(255, 255, 255, 0.05); border-radius: 6px;">
                        ⚡ <strong>Quick Menu:</strong> Use the floating action button (bottom right)
                    </div>
                    <div style="padding: 6px; background: rgba(255, 255, 255, 0.05); border-radius: 6px;">
                        🔙 <strong>Browser Back:</strong> Use browser back button to return
                    </div>
                </div>
            </div>
            
            <div style="margin-bottom: 15px;">
                <h4 style="margin: 0 0 8px 0; color: #e0e0e0; font-size: 12px;">Current Page:</h4>
                <div style="padding: 10px; background: rgba(79, 156, 255, 0.1); border-radius: 8px; border: 1px solid rgba(79, 156, 255, 0.3);">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                        <span style="font-size: 16px;">${currentPage.icon}</span>
                        <strong>${currentPage.title}</strong>
                    </div>
                    <div style="font-size: 11px; color: #b0b0b0;">
                        Path: ${currentPath}
                    </div>
                </div>
            </div>
            
            <div>
                <h4 style="margin: 0 0 8px 0; color: #e0e0e0; font-size: 12px;">Keyboard Shortcuts:</h4>
                <div style="display: grid; gap: 4px; font-size: 11px;">
                    <div><code style="background: rgba(255,255,255,0.1); padding: 2px 4px; border-radius: 3px;">Alt + H</code> → Home</div>
                    <div><code style="background: rgba(255,255,255,0.1); padding: 2px 4px; border-radius: 3px;">Alt + B</code> → Back</div>
                    <div><code style="background: rgba(255,255,255,0.1); padding: 2px 4px; border-radius: 3px;">Alt + ?</code> → Help</div>
                </div>
            </div>
        </div>
        
        <style>
            /* Adjust body padding to accommodate breadcrumbs */
            body {
                padding-top: 42px !important;
            }
        </style>
    `;
    
    document.body.insertAdjacentHTML('afterbegin', breadcrumbHTML);
    
    // Add keyboard shortcuts
    setupKeyboardShortcuts();
}

function showPageInfo() {
    const isGitHubPages = window.location.hostname.includes('github.io');
    const info = {
        url: window.location.href,
        title: document.title,
        lastModified: document.lastModified,
        referrer: document.referrer || 'Direct access',
        userAgent: navigator.userAgent.substring(0, 50) + '...',
        environment: isGitHubPages ? 'GitHub Pages' : 'Local Development'
    };
    
    alert(`📋 Page Information:\n\n` +
          `Title: ${info.title}\n` +
          `URL: ${info.url}\n` +
          `Environment: ${info.environment}\n` +
          `Last Modified: ${info.lastModified}\n` +
          `Referrer: ${info.referrer}`);
}

function toggleHelpPanel() {
    const panel = document.getElementById('help-panel');
    if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        if (e.altKey) {
            const isGitHubPages = window.location.hostname.includes('github.io');
            const baseUrl = isGitHubPages ? '/webqx' : '';
            
            switch(e.key.toLowerCase()) {
                case 'h':
                    e.preventDefault();
                    window.location.href = baseUrl + '/';
                    break;
                case 'b':
                    e.preventDefault();
                    window.history.back();
                    break;
                case '?':
                    e.preventDefault();
                    toggleHelpPanel();
                    break;
            }
        }
    });
}

// Close help panel when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('#help-panel') && !e.target.closest('button[onclick="toggleHelpPanel()"]')) {
        const panel = document.getElementById('help-panel');
        if (panel) {
            panel.style.display = 'none';
        }
    }
});

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createEnhancedBreadcrumbs);
} else {
    createEnhancedBreadcrumbs();
}
