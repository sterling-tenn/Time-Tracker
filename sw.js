// App-shell cache only. This app has no offline data mode - every read/write goes
// through Firebase (auth, Firestore) - so there's nothing useful to cache cross-origin.
// This just makes the shell itself (the page, manifest, icons) load instantly and
// installable, matching what "Add to Home Screen" needs.
const CACHE = 'tt-shell-v2';
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

// Network-first, falling back to cache only when offline. A standalone/home-screen PWA
// can stay open for weeks without ever re-checking sw.js for updates, so a cache-first
// strategy here would mean it keeps serving whatever index.html happened to be cached
// on install - forever, even after real code changes ship. Network-first means an
// online launch always gets the latest shell; the cache is just the offline fallback,
// and it's kept fresh by writing every successful network response into it.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // let Firebase/gstatic requests go straight to network
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
