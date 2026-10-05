// ========================================
// SERVICE WORKER - service_worker.js
// ========================================

const CACHE_NAME = 'attendance-tracker-v1';

// Files to cache for offline use (Using RELATIVE paths)
const urlsToCache = [
    './',
    './index.html',
    './subjects.html',
    './calendar.html',
    './attendance.html',
    './report.html',
    './holidays.html',
    './login.html',
    './signup.html',
    './manifest.json',
    './css/style.css',
    './js/app.js',
    './js/attendance.js',
    './js/subjects.js',
    './js/calendar.js',
    './js/report.js',
    './js/holidays.js',
    './js/auth.js'
];

// Install Service Worker
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('📦 Cache opened, adding files...');
                return cache.addAll(urlsToCache);
            })
            .then(function() {
                console.log('✅ All files cached!');
                return self.skipWaiting();
            })
            .catch(function(error) {
                console.error('❌ Cache failed:', error);
            })
    );
});

// Activate Service Worker
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
        .then(function() {
            console.log('✅ Service Worker activated!');
            return self.clients.claim();
        })
    );
});

// Fetch from cache first, then network
self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                
                // Clone the request
                const fetchRequest = event.request.clone();
                
                return fetch(fetchRequest)
                    .then(function(response) {
                        // Check if valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Clone the response
                        const responseToCache = response.clone();
                        
                        caches.open(CACHE_NAME)
                            .then(function(cache) {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch(function() {
                        // Return offline page if network fails
                        return caches.match('./index.html');
                    });
            })
    );
});

// Handle push notifications
self.addEventListener('push', function(event) {
    const options = {
        body: event.data ? event.data.text() : 'Don\'t forget to mark your attendance!',
        icon: './icon-192.png',
        badge: './icon-192.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'open',
                title: '📚 Open App'
            },
            {
                action: 'dismiss',
                title: '✖ Dismiss'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('📚 Attendance Tracker', options)
    );
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    
    if (event.action === 'dismiss') {
        return;
    }
    
    event.waitUntil(
        clients.openWindow('./')
    );
});