/**
 * WebQX Universal Navigation Hub
 * One script to include all navigation features
 */

(function() {
    'use strict';
    
    // Configuration
    const config = {
        enableBreadcrumbs: true,
        enableBackToHome: true,
        enableKeyboardShortcuts: true,
        enableContextMenu: true,
        enableAnalytics: true
    };
    
    // Initialize all navigation components
    function initializeNavigation() {
        console.log('🧭 Initializing WebQX Navigation Hub...');
        
        // Load and initialize components based on page context
        loadNavigationComponents();
        
        // Set up global navigation features
        setupGlobalFeatures();
        
        // Add exit intent detection
        setupExitIntentDetection();
        
        console.log('✅ WebQX Navigation Hub initialized successfully');
    }
    
    function loadNavigationComponents() {
        // Create a floating navigation pill
        createNavigationPill();
        
        // Add session breadcrumbs (tracks user journey)
        createSessionBreadcrumbs();
        
        // Add search functionality
        createGlobalSearch();
    }
    
    function createNavigationPill() {
        const isGitHubPages = window.location.hostname.includes('github.io');
        const baseUrl = isGitHubPages ? '/webqx' : '';
        
        // Don't show on home page
        let currentPath = window.location.pathname;
        if (currentPath.startsWith('/webqx')) {
            currentPath = currentPath.substring(6) || '/';
        }
        
        if (currentPath === '/' || currentPath === '/index.html') {
            return;
        }
        
        const pillHTML = `
            <div id="navigation-pill" style="
                position: fixed;
                top: 50%;
                left: 20px;
                transform: translateY(-50%);
                z-index: 9999;
                background: rgba(26, 26, 46, 0.95);
                backdrop-filter: blur(15px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 25px;
                padding: 12px 8px;
                display: flex;
                flex-direction: column;
                gap: 8px;
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
                transition: all 0.3s ease;
                width: 48px;
            " onmouseover="expandNavigationPill()" onmouseleave="collapseNavigationPill()">
                
                <!-- Home Button -->
                <a href="${baseUrl}/" class="nav-pill-item" title="WebQX Demo Hub" data-tooltip="Home">
                    🏠
                </a>
                
                <!-- Back Button -->
                <button onclick="window.history.back()" class="nav-pill-item" title="Go Back" data-tooltip="Back">
                    ⬅️
                </button>
                
                <!-- Divider -->
                <div style="height: 1px; background: rgba(255, 255, 255, 0.2); margin: 4px 0;"></div>
                
                <!-- Quick Access -->
                <a href="${baseUrl}/provider/" class="nav-pill-item" title="Provider Portal" data-tooltip="Provider">
                    👨‍⚕️
                </a>
                
                <a href="${baseUrl}/telehealth-realtime-demo.html" class="nav-pill-item" title="Real-Time Telehealth" data-tooltip="Telehealth">
                    🎥
                </a>
                
                <a href="${baseUrl}/demo-fhir-r4-appointment-booking.html" class="nav-pill-item" title="FHIR Appointments" data-tooltip="Appointments">
                    📅
                </a>
                
                <!-- Divider -->
                <div style="height: 1px; background: rgba(255, 255, 255, 0.2); margin: 4px 0;"></div>
                
                <!-- Help -->
                <button onclick="showNavigationHelp()" class="nav-pill-item" title="Navigation Help" data-tooltip="Help">
                    ❓
                </button>
                
                <!-- Search -->
                <button onclick="toggleGlobalSearch()" class="nav-pill-item" title="Search Demos" data-tooltip="Search">
                    🔍
                </button>
            </div>
            
            <style>
                .nav-pill-item {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 32px;
                    height: 32px;
                    border-radius: 16px;
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                    text-decoration: none;
                    border: none;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.3s ease;
                    position: relative;
                }
                
                .nav-pill-item:hover {
                    background: rgba(79, 156, 255, 0.6);
                    transform: scale(1.1);
                    box-shadow: 0 4px 15px rgba(79, 156, 255, 0.4);
                }
                
                .nav-pill-item::after {
                    content: attr(data-tooltip);
                    position: absolute;
                    left: 45px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: rgba(0, 0, 0, 0.9);
                    color: white;
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 11px;
                    white-space: nowrap;
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.3s;
                    z-index: 10001;
                }
                
                .nav-pill-item:hover::after {
                    opacity: 1;
                }
            </style>
        `;
        
        document.body.insertAdjacentHTML('beforeend', pillHTML);
    }
    
    function expandNavigationPill() {
        const pill = document.getElementById('navigation-pill');
        if (pill) {
            pill.style.width = '56px';
            pill.style.padding = '16px 12px';
        }
    }
    
    function collapseNavigationPill() {
        const pill = document.getElementById('navigation-pill');
        if (pill) {
            pill.style.width = '48px';
            pill.style.padding = '12px 8px';
        }
    }
    
    function createSessionBreadcrumbs() {
        // Track user journey through demo
        let sessionPath = JSON.parse(sessionStorage.getItem('webqx_session_path') || '[]');
        
        const currentPage = {
            url: window.location.href,
            title: document.title,
            timestamp: new Date().toISOString(),
            path: window.location.pathname
        };
        
        // Add current page to session path
        sessionPath.push(currentPage);
        
        // Keep only last 10 pages
        if (sessionPath.length > 10) {
            sessionPath = sessionPath.slice(-10);
        }
        
        sessionStorage.setItem('webqx_session_path', JSON.stringify(sessionPath));
        
        // Create session trail indicator
        if (sessionPath.length > 1) {
            createSessionTrail(sessionPath);
        }
    }
    
    function createSessionTrail(sessionPath) {
        const trailHTML = `
            <div id="session-trail" style="
                position: fixed;
                bottom: 20px;
                left: 20px;
                background: rgba(26, 26, 46, 0.95);
                backdrop-filter: blur(15px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 12px;
                padding: 8px 12px;
                max-width: 300px;
                z-index: 9998;
                font-size: 11px;
                color: white;
            ">
                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                    <span>🛤️</span>
                    <strong>Your Journey (${sessionPath.length} pages)</strong>
                    <button onclick="clearSessionTrail()" style="
                        background: none;
                        border: none;
                        color: #999;
                        cursor: pointer;
                        font-size: 10px;
                        margin-left: auto;
                    ">Clear</button>
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                    ${sessionPath.slice(-5).map((page, index) => {
                        const isLast = index === sessionPath.slice(-5).length - 1;
                        const pageName = page.title.split(' - ')[0].split('™')[0].replace('WebQX', '').trim();
                        return `
                            <span style="
                                background: ${isLast ? 'rgba(79, 156, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
                                padding: 2px 6px;
                                border-radius: 8px;
                                font-size: 10px;
                                border: 1px solid ${isLast ? 'rgba(79, 156, 255, 0.5)' : 'rgba(255, 255, 255, 0.2)'};
                            ">
                                ${pageName || 'Demo'}
                            </span>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        
        // Remove existing trail
        const existingTrail = document.getElementById('session-trail');
        if (existingTrail) {
            existingTrail.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', trailHTML);
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            const trail = document.getElementById('session-trail');
            if (trail) {
                trail.style.opacity = '0.5';
                trail.style.transform = 'translateY(10px)';
            }
        }, 10000);
    }
    
    function createGlobalSearch() {
        const searchHTML = `
            <div id="global-search" style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(26, 26, 46, 0.98);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 16px;
                padding: 24px;
                width: 90%;
                max-width: 500px;
                z-index: 10000;
                display: none;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
            ">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                    <h3 style="margin: 0; color: white; font-size: 16px;">🔍 Search WebQX Demos</h3>
                    <button onclick="toggleGlobalSearch()" style="
                        background: none;
                        border: none;
                        color: #999;
                        cursor: pointer;
                        font-size: 18px;
                    ">✕</button>
                </div>
                
                <input type="text" id="search-input" placeholder="Search for demos, features, or pages..." style="
                    width: 100%;
                    padding: 12px 16px;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    border-radius: 10px;
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                    font-size: 14px;
                    margin-bottom: 16px;
                " />
                
                <div id="search-results" style="
                    max-height: 300px;
                    overflow-y: auto;
                    color: white;
                ">
                    <!-- Search results will appear here -->
                </div>
            </div>
            
            <div id="search-overlay" style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                z-index: 9999;
                display: none;
            " onclick="toggleGlobalSearch()"></div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', searchHTML);
        
        // Set up search functionality
        setupSearchFunctionality();
    }
    
    function setupSearchFunctionality() {
        const demoPages = [
            { title: 'Provider Portal', url: '/provider/', description: 'Complete provider dashboard and management', icon: '👨‍⚕️' },
            { title: 'Real-Time Telehealth', url: '/telehealth-realtime-demo.html', description: 'Live provider-patient interaction demo', icon: '🎥' },
            { title: 'FHIR Appointments', url: '/demo-fhir-r4-appointment-booking.html', description: 'Standards-compliant appointment booking', icon: '📅' },
            { title: 'AI Whisper Service', url: '/whisper-demo.html', description: 'Speech-to-text for medical documentation', icon: '🎤' },
            { title: 'Lab Results Viewer', url: '/demo-lab-results-viewer.html', description: 'Interactive lab results with charts', icon: '🧪' },
            { title: 'Provider Login', url: '/auth/providers/login.html', description: 'Secure provider authentication', icon: '🔐' },
            { title: 'Patient Login', url: '/login.html', description: 'Patient portal access', icon: '👤' },
            { title: 'Pharmacy Locator', url: '/demo/PharmacyLocator-demo.html', description: 'Find nearby pharmacies', icon: '💊' },
            { title: 'Telehealth Demo', url: '/telehealth-demo.html', description: 'Complete telehealth solution', icon: '📹' }
        ];
        
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                const query = this.value.toLowerCase();
                const results = demoPages.filter(page => 
                    page.title.toLowerCase().includes(query) ||
                    page.description.toLowerCase().includes(query)
                );
                
                displaySearchResults(results);
            });
            
            searchInput.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    toggleGlobalSearch();
                }
            });
        }
    }
    
    function displaySearchResults(results) {
        const container = document.getElementById('search-results');
        if (!container) return;
        
        const isGitHubPages = window.location.hostname.includes('github.io');
        const baseUrl = isGitHubPages ? '/webqx' : '';
        
        if (results.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">No demos found</div>';
            return;
        }
        
        container.innerHTML = results.map(result => `
            <a href="${baseUrl}${result.url}" style="
                display: block;
                padding: 12px;
                border-radius: 8px;
                background: rgba(255, 255, 255, 0.05);
                margin-bottom: 8px;
                text-decoration: none;
                color: white;
                transition: all 0.3s;
                border: 1px solid rgba(255, 255, 255, 0.1);
            " onmouseover="this.style.background='rgba(79, 156, 255, 0.2)'"
               onmouseout="this.style.background='rgba(255, 255, 255, 0.05)'">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 20px;">${result.icon}</span>
                    <div>
                        <div style="font-weight: 600; margin-bottom: 2px;">${result.title}</div>
                        <div style="font-size: 12px; color: #b0b0b0;">${result.description}</div>
                    </div>
                </div>
            </a>
        `).join('');
    }
    
    function setupGlobalFeatures() {
        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            // Ctrl+K or Cmd+K for search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                toggleGlobalSearch();
            }
            
            // Alt+H for home
            if (e.altKey && e.key === 'h') {
                e.preventDefault();
                const isGitHubPages = window.location.hostname.includes('github.io');
                const baseUrl = isGitHubPages ? '/webqx' : '';
                window.location.href = baseUrl + '/';
            }
            
            // Escape to close overlays
            if (e.key === 'Escape') {
                const search = document.getElementById('global-search');
                if (search && search.style.display === 'block') {
                    toggleGlobalSearch();
                }
            }
        });
        
        // Add visual feedback for navigation
        addNavigationFeedback();
    }
    
    function addNavigationFeedback() {
        // Create loading indicator for page transitions
        const style = document.createElement('style');
        style.textContent = `
            .webqx-loading {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: linear-gradient(90deg, transparent, #4f9cff, transparent);
                z-index: 10001;
                animation: loading 1.5s infinite;
            }
            
            @keyframes loading {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
        `;
        document.head.appendChild(style);
    }
    
    function setupExitIntentDetection() {
        let hasShownExitIntent = false;
        
        document.addEventListener('mouseleave', function(e) {
            if (e.clientY <= 0 && !hasShownExitIntent) {
                hasShownExitIntent = true;
                showExitIntentModal();
            }
        });
    }
    
    function showExitIntentModal() {
        const isGitHubPages = window.location.hostname.includes('github.io');
        const baseUrl = isGitHubPages ? '/webqx' : '';
        
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(26, 26, 46, 0.98);
            backdrop-filter: blur(15px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            padding: 20px;
            z-index: 10002;
            color: white;
            max-width: 300px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
        `;
        
        modal.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                <span style="font-size: 20px;">👋</span>
                <strong>Leaving WebQX Demo?</strong>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: none;
                    border: none;
                    color: #999;
                    cursor: pointer;
                    margin-left: auto;
                ">✕</button>
            </div>
            <p style="margin: 0 0 15px 0; font-size: 13px; color: #e0e0e0;">
                Before you go, check out these popular demos:
            </p>
            <div style="display: grid; gap: 8px;">
                <a href="${baseUrl}/telehealth-realtime-demo.html" style="
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 6px;
                    text-decoration: none;
                    color: white;
                    font-size: 12px;
                " onmouseover="this.style.background='rgba(79, 156, 255, 0.3)'"
                   onmouseout="this.style.background='rgba(255, 255, 255, 0.1)'">
                    🎥 Real-Time Telehealth
                </a>
                <a href="${baseUrl}/provider/" style="
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 6px;
                    text-decoration: none;
                    color: white;
                    font-size: 12px;
                " onmouseover="this.style.background='rgba(79, 156, 255, 0.3)'"
                   onmouseout="this.style.background='rgba(255, 255, 255, 0.1)'">
                    👨‍⚕️ Provider Portal
                </a>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (modal.parentElement) {
                modal.remove();
            }
        }, 10000);
    }
    
    // Global functions
    window.toggleGlobalSearch = function() {
        const search = document.getElementById('global-search');
        const overlay = document.getElementById('search-overlay');
        const input = document.getElementById('search-input');
        
        if (search && overlay) {
            const isVisible = search.style.display === 'block';
            search.style.display = isVisible ? 'none' : 'block';
            overlay.style.display = isVisible ? 'none' : 'block';
            
            if (!isVisible && input) {
                setTimeout(() => input.focus(), 100);
            }
        }
    };
    
    window.showNavigationHelp = function() {
        alert(`🧭 WebQX Navigation Help\n\n` +
              `Keyboard Shortcuts:\n` +
              `• Ctrl+K (Cmd+K): Open search\n` +
              `• Alt+H: Go to home\n` +
              `• Escape: Close overlays\n\n` +
              `Navigation Features:\n` +
              `• Left panel: Quick navigation\n` +
              `• Session trail: Track your journey\n` +
              `• Search: Find any demo quickly\n` +
              `• Breadcrumbs: See your current location`);
    };
    
    window.clearSessionTrail = function() {
        sessionStorage.removeItem('webqx_session_path');
        const trail = document.getElementById('session-trail');
        if (trail) {
            trail.remove();
        }
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeNavigation);
    } else {
        initializeNavigation();
    }
    
})();
