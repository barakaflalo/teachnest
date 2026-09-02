/* המורה שלי AI — Service Worker */
const VERSION = 'morehai-v1.0.1';
const APP_CACHE = 'app-' + VERSION;
const SHELL = ['./', './index.html', './manifest.json', './privacy_policy.html', './appnest-assistant.js', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(APP_CACHE).then(c => c.addAll(SHELL).catch(()=>{})));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k.startsWith('app-') && k !== APP_CACHE).map(k => caches.delete(k)))
  ).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = e.request.url;
  // never cache AI / cross-origin API calls — always straight to network
  if (/generativelanguage|api\.anthropic|api\.openai|localhost:11434|127\.0\.0\.1|:1234/.test(url)) return;
  // pass-through for other cross-origin (CDN libs) — don't intercept
  if (new URL(url).origin !== self.location.origin) return;
  // app shell: network-first so updates win online, fall back to cache offline
  e.respondWith(
    fetch(e.request).then(r => {
      const copy = r.clone();
      caches.open(APP_CACHE).then(c => c.put(e.request, copy).catch(()=>{}));
      return r;
    }).catch(() => caches.match(e.request).then(m => m || caches.match('./index.html')))
  );
});
