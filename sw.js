// App-shell cache only. This app has no offline data mode - every read/write goes
// through Firebase (auth, Firestore) - so there's nothing useful to cache cross-origin.
// This just makes the shell itself (the page, manifest, icons) load instantly and
// installable, matching what "Add to Home Screen" needs.
const CACHE = 'tt-shell-v1';
const SHELL = ['./', './index.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // let Firebase/gstatic requests go straight to network
  e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request)));
});
