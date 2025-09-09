/**
 * WebQX Back-to-Home Component
 * Floating action button for easy navigation back to home
 */

function createBackToHomeButton() {
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
    
    const buttonHTML = `
        <div id="back-to-home-fab" style="
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            align-items: flex-end;
        ">
            <!-- Main Home Button -->
            <a href="${baseUrl}/" style="
                display: flex;
                align-items: center;
                justify-content: center;
                width: 56px;
                height: 56px;
                background: linear-gradient(135deg, #4f9cff 0%, #667eea 100%);
                color: white;
                border-radius: 50%;
                text-decoration: none;
                font-size: 24px;
                box-shadow: 0 8px 25px rgba(79, 156, 255, 0.4);
                transition: all 0.3s ease;
                backdrop-filter: blur(10px);
                border: 2px solid rgba(255, 255, 255, 0.2);
            " 
            onmouseover="this.style.transform='scale(1.1) rotate(5deg)'; this.style.boxShadow='0 12px 30px rgba(79, 156, 255, 0.6)'"
            onmouseout="this.style.transform='scale(1) rotate(0deg)'; this.style.boxShadow='0 8px 25px rgba(79, 156, 255, 0.4)'"
            title="Back to WebQX Demo Hub">
                🏠
            </a>
            
            <!-- Expandable Menu -->
            <div id="fab-menu" style="
                display: none;
                flex-direction: column;
                gap: 8px;
                align-items: flex-end;
                animation: fadeInUp 0.3s ease;
            ">
                <a href="${baseUrl}/provider/" class="fab-menu-item" title="Provider Portal">
                    👨‍⚕️
                </a>
                <a href="${baseUrl}/telehealth-realtime-demo.html" class="fab-menu-item" title="Real-Time Telehealth">
                    🎥
                </a>
                <a href="${baseUrl}/demo-fhir-r4-appointment-booking.html" class="fab-menu-item" title="FHIR Appointments">
                    📅
                </a>
                <a href="${baseUrl}/whisper-demo.html" class="fab-menu-item" title="AI Whisper">
                    🎤
                </a>
            </div>
            
            <!-- Menu Toggle Button -->
            <button id="fab-toggle" onclick="toggleFabMenu()" style="
                width: 40px;
                height: 40px;
                background: rgba(26, 26, 46, 0.9);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                cursor: pointer;
                font-size: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                backdrop-filter: blur(10px);
            "
            onmouseover="this.style.background='rgba(79, 156, 255, 0.8)'; this.style.transform='scale(1.1)'"
            onmouseout="this.style.background='rgba(26, 26, 46, 0.9)'; this.style.transform='scale(1)'"
            title="Quick Navigation Menu">
                ⚡
            </button>
        </div>
        
        <style>
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .fab-menu-item {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 44px;
                height: 44px;
                background: rgba(255, 255, 255, 0.95);
                color: #333;
                border-radius: 50%;
                text-decoration: none;
                font-size: 18px;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                transition: all 0.3s ease;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.8);
            }
            
            .fab-menu-item:hover {
                transform: scale(1.1) translateX(-5px);
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
                background: #4f9cff;
                color: white;
            }
        </style>
    `;
    
    document.body.insertAdjacentHTML('beforeend', buttonHTML);
}

function toggleFabMenu() {
    const menu = document.getElementById('fab-menu');
    const toggle = document.getElementById('fab-toggle');
    
    if (menu.style.display === 'none' || !menu.style.display) {
        menu.style.display = 'flex';
        toggle.textContent = '✕';
        toggle.style.transform = 'rotate(180deg)';
    } else {
        menu.style.display = 'none';
        toggle.textContent = '⚡';
        toggle.style.transform = 'rotate(0deg)';
    }
}

// Auto-close menu when clicking elsewhere
document.addEventListener('click', function(e) {
    if (!e.target.closest('#back-to-home-fab')) {
        const menu = document.getElementById('fab-menu');
        const toggle = document.getElementById('fab-toggle');
        if (menu) {
            menu.style.display = 'none';
        }
        if (toggle) {
            toggle.textContent = '⚡';
            toggle.style.transform = 'rotate(0deg)';
        }
    }
});

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createBackToHomeButton);
} else {
    createBackToHomeButton();
}
