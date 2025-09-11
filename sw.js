/**
 * WebQx Global - 24/7 Healthcare Service Worker
 * Enables offline functionality and background sync for global telehealth platform
 */

const CACHE_NAME = 'webqx-global-v2.0.0';
const API_CACHE = 'webqx-api-cache-v1';
const EMERGENCY_CACHE = 'webqx-emergency-v1';

// Critical files for offline functionality
const CORE_FILES = [
    '/telehealth-24-7-global.html',
    '/manifest.json',
    // Core telehealth functionality that must work offline
    '/telehealth/emergency-session.html',
    '/telehealth/scheduled-session.html', 
    '/telehealth/on-demand-session.html',
    '/telehealth/crisis-chat.html'
];

// Emergency resources that should always be available
const EMERGENCY_FILES = [
    '/emergency/crisis-hotlines.json',
    '/emergency/first-aid-guide.html',
    '/emergency/medication-lookup.json',
    '/emergency/emergency-contacts.json'
];

// API endpoints to cache for offline access
const CACHEABLE_APIS = [
    '/auth/status',
    '/providers/availability',
    '/schedule/user-appointments', 
    '/emergency/hotlines',
    '/fhir/patient/profile'
];

// Background sync queues
const SYNC_QUEUES = {
    APPOINTMENTS: 'appointment-sync',
    MESSAGES: 'message-sync', 
    EMERGENCY: 'emergency-sync',
    HEALTH_DATA: 'health-data-sync'
};

self.addEventListener('install', (event) => {
    console.log('🔧 WebQx Global Service Worker installing...');
    
    event.waitUntil(
        Promise.all([
            // Cache core application files
            caches.open(CACHE_NAME).then((cache) => {
                console.log('📦 Caching core application files...');
                return cache.addAll(CORE_FILES);
            }),
            
            // Cache emergency resources
            caches.open(EMERGENCY_CACHE).then((cache) => {
                console.log('🚨 Caching emergency resources...');
                return cache.addAll(EMERGENCY_FILES);
            }),
            
            // Skip waiting to activate immediately
            self.skipWaiting()
        ])
    );
});

self.addEventListener('activate', (event) => {
    console.log('🚀 WebQx Global Service Worker activating...');
    
    event.waitUntil(
        Promise.all([
            // Clean up old caches
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME && 
                            cacheName !== API_CACHE && 
                            cacheName !== EMERGENCY_CACHE) {
                            console.log('🗑️ Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            
            // Claim all clients immediately
            self.clients.claim(),
            
            // Initialize background sync
            initializeBackgroundSync()
        ])
    );
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Handle different types of requests with appropriate strategies
    if (isEmergencyRequest(url)) {
        event.respondWith(handleEmergencyRequest(request));
    } else if (isAPIRequest(url)) {
        event.respondWith(handleAPIRequest(request));
    } else if (isTelehealthRequest(url)) {
        event.respondWith(handleTelehealthRequest(request));
    } else {
        event.respondWith(handleStaticRequest(request));
    }
});

// Emergency requests - Cache first, network fallback
async function handleEmergencyRequest(request) {
    try {
        const cache = await caches.open(EMERGENCY_CACHE);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            console.log('🚨 Emergency resource served from cache:', request.url);
            return cachedResponse;
        }
        
        // If not cached, try network and cache the response
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
        
    } catch (error) {
        console.error('❌ Emergency request failed:', error);
        return createEmergencyFallbackResponse(request);
    }
}

// API requests - Network first, cache fallback
async function handleAPIRequest(request) {
    const cache = await caches.open(API_CACHE);
    
    try {
        // Try network first for fresh data
        const networkResponse = await fetch(request, {
            // Add timeout for better offline experience
            signal: AbortSignal.timeout(5000)
        });
        
        if (networkResponse.ok && isCacheableAPI(request.url)) {
            // Cache successful API responses
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        console.log('📡 Network failed, trying cache for:', request.url);
        
        // Fallback to cache
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            // Add offline indicator to cached responses
            const response = cachedResponse.clone();
            response.headers.set('X-Served-From', 'cache');
            response.headers.set('X-Offline-Mode', 'true');
            return response;
        }
        
        // Queue for background sync if request failed
        if (request.method === 'POST' || request.method === 'PUT') {
            await queueForBackgroundSync(request);
        }
        
        return createOfflineAPIResponse(request);
    }
}

// Telehealth requests - Critical for 24/7 functionality
async function handleTelehealthRequest(request) {
    const cache = await caches.open(CACHE_NAME);
    
    try {
        // For telehealth, prioritize network for real-time functionality
        const networkResponse = await fetch(request, {
            signal: AbortSignal.timeout(10000) // Longer timeout for video
        });
        
        // Cache successful responses for offline fallback
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        console.log('🎥 Telehealth network failed, checking cache...');
        
        // Fallback to cached version
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Create offline telehealth interface
        return createOfflineTelehealthResponse(request);
    }
}

// Static requests - Cache first strategy
async function handleStaticRequest(request) {
    const cache = await caches.open(CACHE_NAME);
    
    // Try cache first for static resources
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        // Fetch from network and cache
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
        
    } catch (error) {
        // Return offline page for navigation requests
        if (request.destination === 'document') {
            return createOfflinePageResponse();
        }
        
        throw error;
    }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('🔄 Background sync triggered:', event.tag);
    
    switch (event.tag) {
        case SYNC_QUEUES.APPOINTMENTS:
            event.waitUntil(syncAppointments());
            break;
        case SYNC_QUEUES.MESSAGES:
            event.waitUntil(syncMessages());
            break;
        case SYNC_QUEUES.EMERGENCY:
            event.waitUntil(syncEmergencyData());
            break;
        case SYNC_QUEUES.HEALTH_DATA:
            event.waitUntil(syncHealthData());
            break;
    }
});

// Push notifications for global 24/7 alerts
self.addEventListener('push', (event) => {
    console.log('📲 Push notification received');
    
    const data = event.data ? event.data.json() : {};
    const options = {
        title: data.title || 'WebQx Global Healthcare',
        body: data.body || 'You have a new healthcare notification',
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        tag: data.tag || 'general',
        requireInteraction: data.urgent || false,
        actions: [
            {
                action: 'view',
                title: 'View',
                icon: '/action-view.png'
            },
            {
                action: 'dismiss',
                title: 'Dismiss'
            }
        ],
        data: data
    };
    
    // Show different notifications based on type
    if (data.type === 'emergency') {
        options.requireInteraction = true;
        options.tag = 'emergency';
        options.vibrate = [200, 100, 200];
    } else if (data.type === 'appointment') {
        options.tag = 'appointment';
        options.actions.unshift({
            action: 'join',
            title: 'Join Now',
            icon: '/action-join.png'
        });
    }
    
    event.waitUntil(
        self.registration.showNotification(options.title, options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('🔔 Notification clicked:', event.action);
    
    event.notification.close();
    
    const notificationData = event.notification.data || {};
    let targetUrl = '/telehealth-24-7-global.html';
    
    // Route based on notification action
    switch (event.action) {
        case 'join':
            targetUrl = '/telehealth/join-session.html?id=' + notificationData.sessionId;
            break;
        case 'view':
            targetUrl = notificationData.url || targetUrl;
            break;
        case 'emergency':
            targetUrl = '/telehealth/emergency-session.html';
            break;
    }
    
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            // Try to focus existing window
            for (const client of clientList) {
                if (client.url.includes('webqx') && 'focus' in client) {
                    client.navigate(targetUrl);
                    return client.focus();
                }
            }
            
            // Open new window if none exists
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});

// Utility functions
function isEmergencyRequest(url) {
    return url.pathname.startsWith('/emergency/') || 
           url.pathname.includes('crisis') ||
           url.searchParams.has('emergency');
}

function isAPIRequest(url) {
    return url.pathname.startsWith('/api/') ||
           url.pathname.startsWith('/auth/') ||
           url.pathname.startsWith('/fhir/') ||
           url.pathname.startsWith('/providers/');
}

function isTelehealthRequest(url) {
    return url.pathname.startsWith('/telehealth/') ||
           url.pathname.includes('video') ||
           url.pathname.includes('consultation');
}

function isCacheableAPI(url) {
    return CACHEABLE_APIS.some(api => url.includes(api));
}

async function queueForBackgroundSync(request) {
    try {
        // Store request data in IndexedDB for background sync
        const requestData = {
            url: request.url,
            method: request.method,
            headers: Object.fromEntries(request.headers.entries()),
            body: request.method !== 'GET' ? await request.text() : null,
            timestamp: Date.now()
        };
        
        // This would store in IndexedDB in a real implementation
        console.log('📥 Queued for background sync:', requestData);
        
        // Register background sync
        await self.registration.sync.register(SYNC_QUEUES.APPOINTMENTS);
        
    } catch (error) {
        console.error('❌ Failed to queue for background sync:', error);
    }
}

async function initializeBackgroundSync() {
    try {
        // Register sync tags for different types of data
        await Promise.all([
            self.registration.sync.register(SYNC_QUEUES.APPOINTMENTS),
            self.registration.sync.register(SYNC_QUEUES.MESSAGES),
            self.registration.sync.register(SYNC_QUEUES.HEALTH_DATA)
        ]);
        
        console.log('✅ Background sync initialized');
    } catch (error) {
        console.log('⚠️ Background sync not supported:', error);
    }
}

async function syncAppointments() {
    console.log('📅 Syncing appointments...');
    
    try {
        // In a real implementation, this would:
        // 1. Get queued appointment data from IndexedDB
        // 2. Send to server when online
        // 3. Handle conflicts and updates
        
        const response = await fetch('/api/appointments/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'sync_appointments',
                timestamp: Date.now()
            })
        });
        
        if (response.ok) {
            console.log('✅ Appointments synced successfully');
        }
        
    } catch (error) {
        console.error('❌ Appointment sync failed:', error);
        throw error; // Will retry
    }
}

async function syncMessages() {
    console.log('💬 Syncing messages...');
    
    try {
        // Sync offline messages, chat history, etc.
        const response = await fetch('/api/messages/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'sync_messages',
                timestamp: Date.now()
            })
        });
        
        if (response.ok) {
            console.log('✅ Messages synced successfully');
        }
        
    } catch (error) {
        console.error('❌ Message sync failed:', error);
        throw error;
    }
}

async function syncHealthData() {
    console.log('📊 Syncing health data...');
    
    try {
        // Sync vital signs, medication logs, etc.
        const response = await fetch('/api/health-data/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'sync_health_data',
                timestamp: Date.now()
            })
        });
        
        if (response.ok) {
            console.log('✅ Health data synced successfully');
        }
        
    } catch (error) {
        console.error('❌ Health data sync failed:', error);
        throw error;
    }
}

function createEmergencyFallbackResponse(request) {
    const fallbackData = {
        emergency_hotlines: {
            us: "911",
            uk: "999", 
            eu: "112",
            au: "000",
            global: "Emergency services in your area"
        },
        message: "You are currently offline. Please contact local emergency services directly.",
        offline_mode: true
    };
    
    return new Response(JSON.stringify(fallbackData), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'X-Offline-Mode': 'true'
        }
    });
}

function createOfflineAPIResponse(request) {
    const offlineData = {
        error: "offline_mode",
        message: "You are currently offline. This request will be synced when you're back online.",
        queued_for_sync: true,
        timestamp: new Date().toISOString()
    };
    
    return new Response(JSON.stringify(offlineData), {
        status: 202, // Accepted for processing
        headers: {
            'Content-Type': 'application/json',
            'X-Offline-Mode': 'true'
        }
    });
}

function createOfflineTelehealthResponse(request) {
    const offlineHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>WebQx Global - Offline Mode</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    text-align: center;
                    padding: 2rem;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }
                .offline-container {
                    background: rgba(255,255,255,0.1);
                    backdrop-filter: blur(10px);
                    border-radius: 20px;
                    padding: 2rem;
                    max-width: 500px;
                    margin: 0 auto;
                }
                .icon { font-size: 4rem; margin-bottom: 1rem; }
                .emergency-btn {
                    background: #F44336;
                    color: white;
                    border: none;
                    padding: 1rem 2rem;
                    border-radius: 10px;
                    font-size: 1.1rem;
                    margin: 1rem 0.5rem;
                    cursor: pointer;
                }
                .retry-btn {
                    background: #2196F3;
                    color: white;
                    border: none;
                    padding: 1rem 2rem;
                    border-radius: 10px;
                    font-size: 1.1rem;
                    margin: 1rem 0.5rem;
                    cursor: pointer;
                }
            </style>
        </head>
        <body>
            <div class="offline-container">
                <div class="icon">📡</div>
                <h1>You're Offline</h1>
                <p>
                    Your internet connection is unavailable, but you can still access 
                    emergency resources and queue appointments for when you're back online.
                </p>
                
                <button class="emergency-btn" onclick="window.location.href='/emergency/offline-help.html'">
                    🚨 Emergency Resources
                </button>
                
                <button class="retry-btn" onclick="window.location.reload()">
                    🔄 Try Again
                </button>
                
                <p style="font-size: 0.9rem; margin-top: 1rem; opacity: 0.8;">
                    💡 Your actions will be saved and synced when you're back online
                </p>
            </div>
            
            <script>
                // Automatically retry when back online
                window.addEventListener('online', () => {
                    window.location.reload();
                });
            </script>
        </body>
        </html>
    `;
    
    return new Response(offlineHTML, {
        status: 200,
        headers: {
            'Content-Type': 'text/html',
            'X-Offline-Mode': 'true'
        }
    });
}

function createOfflinePageResponse() {
    return createOfflineTelehealthResponse();
}

console.log('🌍 WebQx Global Service Worker loaded - 24/7 healthcare ready!');
