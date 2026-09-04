// ══════════════════════════════════════════
//  SERVICE WORKER — Sinai Field PWA
//  Caches static assets ONLY. Firebase / Firestore traffic is never cached,
//  or the app would happily show yesterday's readings as today's.
// ══════════════════════════════════════════

// Bump this on EVERY release or nobody sees the change. It is the single most
// common cause of "my fix isn't showing up".
const CACHE_NAME = 'sinai-field-v11';

const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.png',
  './icon-192.png',
  './html2canvas.min.js',
  // The Firebase SDK is served from here rather than gstatic. A service worker
  // cannot cache a cross-origin CDN script, so on a cold offline start the SDK
  // would never load and `firebase is not defined` would kill the whole boot.
  './firebase-app-compat.js',
  './firebase-firestore-compat.js',
  './firebase-auth-compat.js'
];

// Live data and auth traffic — never intercepted.
const NO_CACHE_DOMAINS = [
  'firestore.googleapis.com',
  'www.googleapis.com',
  'securetoken.googleapis.com',
  'identitytoolkit.googleapis.com',
  'firebase.googleapis.com',
  'firebaseinstallations.googleapis.com',
  'www.gstatic.com'
];

// Install — pre-cache, one asset at a time.
// cache.addAll() is atomic: a single 404 (a renamed icon, a missing file)
// rejects the whole batch and leaves the cache EMPTY, so the app silently
// loses offline support with nothing but a console warning. One-by-one means
// a bad entry costs only that entry.
self.addEventListener('install', function(event){
  console.log('[SW] installing', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return Promise.all(STATIC_ASSETS.map(function(url){
        return cache.add(url).catch(function(err){ console.warn('[SW] could not cache', url, err); });
      }));
    })
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE_NAME; })
                            .map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

// Network-first, cache as fallback: readings must be fresh when there is a
// connection, and the app must still open when there is not.
self.addEventListener('fetch', function(event){
  const url = new URL(event.request.url);

  if(NO_CACHE_DOMAINS.some(function(d){ return url.hostname.includes(d); })) return;
  if(event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request).then(function(response){
      if(response && response.status === 200){
        const clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, clone); });
      }
      return response;
    }).catch(function(){
      return caches.match(event.request);
    })
  );
});

self.addEventListener('message', function(event){
  if(event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
