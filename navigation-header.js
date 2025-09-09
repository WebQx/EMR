/**
 * WebQX Universal Navigation Header
 * Provides consistent navigation across all demo pages
 */

function createNavigationHeader() {
    const isGitHubPages = window.location.hostname.includes('github.io');
    const baseUrl = isGitHubPages ? '/webqx' : '';
    
    const headerHTML = `
        <div id="webqx-nav-header" style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 9999;
            background: rgba(26, 26, 46, 0.95);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding: 8px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 14px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        ">
            <div style="display: flex; align-items: center; gap: 20px;">
                <a href="${baseUrl}/" style="
                    display: flex;
                    align-items: center;
                    text-decoration: none;
                    color: white;
                    font-weight: 600;
                    transition: color 0.3s;
                " onmouseover="this.style.color='#4f9cff'" onmouseout="this.style.color='white'">
                    <span style="font-size: 18px; margin-right: 8px;">🏥</span>
                    WebQX™ Demo Hub
                </a>
                
                <div style="height: 20px; width: 1px; background: rgba(255, 255, 255, 0.3);"></div>
                
                <span style="color: #a0a0a0;" id="current-page-indicator">Loading...</span>
            </div>
            
            <div style="display: flex; align-items: center; gap: 15px;">
                <button onclick="toggleQuickMenu()" style="
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    color: white;
                    padding: 6px 12px;
                    border-radius: 15px;
                    cursor: pointer;
                    font-size: 12px;
                    transition: all 0.3s;
                " onmouseover="this.style.background='rgba(255, 255, 255, 0.2)'" 
                   onmouseout="this.style.background='rgba(255, 255, 255, 0.1)'">
                    🚀 Quick Access
                </button>
                
                <a href="${baseUrl}/" style="
                    background: #4f9cff;
                    color: white;
                    padding: 6px 12px;
                    border-radius: 15px;
                    text-decoration: none;
                    font-size: 12px;
                    font-weight: 500;
                    transition: all 0.3s;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                " onmouseover="this.style.background='#3d7ce6'" onmouseout="this.style.background='#4f9cff'">
                    <span>🏠</span> Home
                </a>
            </div>
        </div>
        
        <!-- Quick Access Menu -->
        <div id="quick-access-menu" style="
            position: fixed;
            top: 60px;
            right: 20px;
            background: rgba(26, 26, 46, 0.98);
            backdrop-filter: blur(15px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            padding: 15px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
            z-index: 9998;
            display: none;
            min-width: 250px;
            max-height: 80vh;
            overflow-y: auto;
        ">
            <div style="color: white; font-weight: 600; margin-bottom: 12px; font-size: 13px;">
                🚀 Quick Navigation
            </div>
            
            <div style="display: grid; gap: 8px;">
                <a href="${baseUrl}/provider/" class="quick-nav-item">
                    👨‍⚕️ Provider Portal
                </a>
                <a href="${baseUrl}/telehealth-realtime-demo.html" class="quick-nav-item">
                    🎥 Real-Time Telehealth
                </a>
                <a href="${baseUrl}/demo-fhir-r4-appointment-booking.html" class="quick-nav-item">
                    📅 FHIR Appointments
                </a>
                <a href="${baseUrl}/whisper-demo.html" class="quick-nav-item">
                    🎤 AI Whisper
                </a>
                <a href="${baseUrl}/demo-lab-results-viewer.html" class="quick-nav-item">
                    🧪 Lab Results
                </a>
                <a href="${baseUrl}/auth/providers/login.html" class="quick-nav-item">
                    🔐 Provider Login
                </a>
                <a href="${baseUrl}/login.html" class="quick-nav-item">
                    👤 Patient Login
                </a>
            </div>
            
            <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 12px 0 8px 0; padding-top: 8px;">
                <div style="color: #a0a0a0; font-size: 11px; margin-bottom: 8px;">
                    📍 Current: <span id="quick-menu-current">Unknown</span>
                </div>
                <button onclick="copyCurrentUrl()" style="
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    color: white;
                    padding: 4px 8px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 11px;
                    width: 100%;
                    transition: all 0.3s;
                " onmouseover="this.style.background='rgba(255, 255, 255, 0.2)'" 
                   onmouseout="this.style.background='rgba(255, 255, 255, 0.1)'">
                    📋 Copy URL
                </button>
            </div>
        </div>
        
        <style>
            .quick-nav-item {
                display: block;
                color: white;
                text-decoration: none;
                padding: 8px 12px;
                border-radius: 8px;
                font-size: 12px;
                transition: all 0.3s;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .quick-nav-item:hover {
                background: rgba(79, 156, 255, 0.3);
                border-color: rgba(79, 156, 255, 0.5);
                transform: translateX(5px);
            }
            
            /* Adjust body padding to accommodate fixed header */
            body {
                padding-top: 60px !important;
            }
        </style>
    `;
    
    // Insert header at the beginning of the body
    document.body.insertAdjacentHTML('afterbegin', headerHTML);
    
    // Update current page indicator
    updateCurrentPageIndicator();
    
    // Click outside to close menu
    document.addEventListener('click', function(e) {
        if (!e.target.closest('#quick-access-menu') && !e.target.closest('button[onclick="toggleQuickMenu()"]')) {
            document.getElementById('quick-access-menu').style.display = 'none';
        }
    });
}

function toggleQuickMenu() {
    const menu = document.getElementById('quick-access-menu');
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    
    if (menu.style.display === 'block') {
        updateQuickMenuCurrent();
    }
}

function updateCurrentPageIndicator() {
    const indicator = document.getElementById('current-page-indicator');
    if (!indicator) return;
    
    const pageTitles = {
        '/': 'Demo Hub',
        '/index.html': 'Demo Hub',
        '/provider/': 'Provider Portal',
        '/provider/index.html': 'Provider Portal',
        '/telehealth-realtime-demo.html': 'Real-Time Telehealth',
        '/telehealth-demo.html': 'Telehealth Demo',
        '/demo-fhir-r4-appointment-booking.html': 'FHIR Appointments',
        '/whisper-demo.html': 'AI Whisper Service',
        '/demo-lab-results-viewer.html': 'Lab Results Viewer',
        '/auth/providers/login.html': 'Provider Login',
        '/login.html': 'Patient Login',
        '/ottehr-demo.html': 'Ottehr Integration',
        '/demo/PharmacyLocator-demo.html': 'Pharmacy Locator'
    };
    
    let currentPath = window.location.pathname;
    
    // Handle GitHub Pages prefix
    if (currentPath.startsWith('/webqx')) {
        currentPath = currentPath.substring(6) || '/';
    }
    
    const pageTitle = pageTitles[currentPath] || 'Demo Page';
    indicator.textContent = pageTitle;
}

function updateQuickMenuCurrent() {
    const currentSpan = document.getElementById('quick-menu-current');
    if (currentSpan) {
        currentSpan.textContent = document.getElementById('current-page-indicator').textContent;
    }
}

function copyCurrentUrl() {
    navigator.clipboard.writeText(window.location.href).then(() => {
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = '✅ Copied!';
        button.style.background = 'rgba(46, 160, 67, 0.3)';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = 'rgba(255, 255, 255, 0.1)';
        }, 2000);
    });
}

// Auto-initialize when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createNavigationHeader);
} else {
    createNavigationHeader();
}

// Add breadcrumb functionality
function addBreadcrumbs() {
    const breadcrumbContainer = document.createElement('div');
    breadcrumbContainer.style.cssText = `
        background: rgba(255, 255, 255, 0.05);
        padding: 8px 20px;
        font-size: 12px;
        color: #a0a0a0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        margin-top: 60px;
    `;
    
    const isGitHubPages = window.location.hostname.includes('github.io');
    const baseUrl = isGitHubPages ? '/webqx' : '';
    let currentPath = window.location.pathname;
    
    if (currentPath.startsWith('/webqx')) {
        currentPath = currentPath.substring(6) || '/';
    }
    
    const pathParts = currentPath.split('/').filter(part => part);
    let breadcrumbHTML = `<a href="${baseUrl}/" style="color: #4f9cff; text-decoration: none;">🏠 Home</a>`;
    
    let buildPath = '';
    pathParts.forEach((part, index) => {
        buildPath += '/' + part;
        const isLast = index === pathParts.length - 1;
        const displayName = part.replace(/[-_]/g, ' ').replace('.html', '').replace(/\b\w/g, l => l.toUpperCase());
        
        if (isLast) {
            breadcrumbHTML += ` > <span style="color: white;">${displayName}</span>`;
        } else {
            breadcrumbHTML += ` > <a href="${baseUrl}${buildPath}" style="color: #4f9cff; text-decoration: none;">${displayName}</a>`;
        }
    });
    
    breadcrumbContainer.innerHTML = breadcrumbHTML;
    document.body.insertBefore(breadcrumbContainer, document.body.firstChild.nextSibling);
}

// Export for use in other scripts
window.WebQxNavigation = {
    createNavigationHeader,
    toggleQuickMenu,
    updateCurrentPageIndicator,
    addBreadcrumbs
};
