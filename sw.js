'use strict';
// This worker owns only the ARCO scope. Learning progress is never stored or erased here.
const ROOT = new URL(self.registration.scope);
const PREFIX = 'arco-app:' + encodeURIComponent(ROOT.pathname) + ':';
const CACHE = PREFIX + 'shell-2.9.3-root-preview-r4';
const HOME = new URL('index.html', ROOT).href;
const ASSETS = [
 'index.html', 'arco-styles-r4.css', 'arco-runtime-r4.js',
 'site.webmanifest', 'favicon.ico',
 'icons/arco-gold-32-r3.png', 'icons/arco-gold-180-r3.png',
 'icons/arco-gold-192-r3.png', 'icons/arco-gold-512-r3.png',
 'icons/arco-gold-maskable-512-r3.png'
];
const STATIC = new Set(ASSETS.filter(name => name !== 'index.html' && name !== 'site.webmanifest'));
const MIME = name => name.endsWith('.css') ? /text\/css/i : name.endsWith('.js') ? /(?:java|ecma)script/i : name.endsWith('.png') ? /image\/png/i : null;
const valid = (response, name) => response.ok && (!MIME(name) || MIME(name).test(response.headers.get('content-type') || ''));

self.addEventListener('install', event => {
 event.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  try {
   // Cache dependencies first and commit the entry page last.
   // A missing script/stylesheet must fail installation instead of caching a broken app.
   for (const name of [...ASSETS.filter(name => name !== 'index.html'), 'index.html']) {
    const response = await fetch(new URL(name, ROOT), {cache: 'reload'});
    if (!valid(response, name)) throw new Error('ARCO asset unavailable: ' + name);
    await cache.put(new URL(name, ROOT).href, response);
   }
  } catch (error) {
   await caches.delete(CACHE);
   throw error;
  }
 })());
 // No skipWaiting and no automatic reload: a quiz or duel must not be interrupted.
});
self.addEventListener('activate', event => {
 event.waitUntil((async () => {
  for (const key of await caches.keys()) {
   if (key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key);
  }
  await self.clients.claim();
 })());
});
self.addEventListener('fetch', event => {
 const request = event.request;
 const url = new URL(request.url);
 if (request.method !== 'GET' || url.origin !== ROOT.origin || !url.pathname.startsWith(ROOT.pathname)) return;
 const name = url.pathname.slice(ROOT.pathname.length);
 if (request.mode === 'navigate' && (name === '' || name === 'index.html')) {
  event.respondWith((async () => {
   const cache = await caches.open(CACHE);
   try {
    const response = await fetch(request, {cache: 'no-cache'});
    if (response.ok && /text\/html/i.test(response.headers.get('content-type') || '')) {
     // The page and dependencies installed together remain the offline fallback.
     // Never replace that fallback with an unverified later deployment.
     return response;
    }
    return (await cache.match(HOME)) || response;
   } catch (_) {
    return (await cache.match(HOME)) || new Response('Reconnect once to open ARCO.', {
     status: 503, headers: {'Content-Type': 'text/plain; charset=utf-8'}
    });
   }
  })());
  return;
 }
 if (STATIC.has(name) && !url.search) {
  event.respondWith((async () => {
   const cache = await caches.open(CACHE);
   const cached = await cache.match(url.href);
   if (cached) return cached;
   const response = await fetch(request);
   if (valid(response, name)) {
    try { await cache.put(url.href, response.clone()); } catch (_) {}
   }
   return response;
  })());
 }
 // Manifest: network. External music/WebRTC and sibling sites: never intercepted.
});
