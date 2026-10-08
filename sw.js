'use strict';
// Production ARCO only. Never cache music, signaling, personal data or sibling projects.
const ROOT = new URL(self.registration.scope);
const PREFIX = 'arco-app:' + encodeURIComponent(ROOT.pathname) + ':';
const CACHE = PREFIX + 'shell-2.9.1';
const HOME = new URL('index.html', ROOT).href;
const ASSETS = ['index.html', 'site.webmanifest', 'favicon.ico',
 'icons/arco-gold-32-r3.png', 'icons/arco-gold-180-r3.png',
 'icons/arco-gold-192-r3.png', 'icons/arco-gold-512-r3.png',
 'icons/arco-gold-maskable-512-r3.png'];
self.addEventListener('install', event => {
 event.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  for (const name of ASSETS) {
   const response = await fetch(new URL(name, ROOT), {cache: 'reload'});
   if (!response.ok) throw new Error('ARCO asset unavailable: ' + name);
   await cache.put(new URL(name, ROOT).href, response);
  }
 })());
 // No skipWaiting: an update must not interrupt a running quiz or duel.
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
 const request = event.request, url = new URL(request.url);
 if (request.method !== 'GET' || url.origin !== ROOT.origin || !url.pathname.startsWith(ROOT.pathname)) return;
 const relative = url.pathname.slice(ROOT.pathname.length);
 if (request.mode === 'navigate' && (relative === '' || relative === 'index.html')) {
  event.respondWith((async () => {
   const cache = await caches.open(CACHE);
   try {
    const response = await fetch(request, {cache: 'no-cache'});
    if (response.ok && /text\/html/i.test(response.headers.get('content-type') || '')) {
     // A quota failure must never discard a successfully loaded online page.
     try { await cache.put(HOME, response.clone()); } catch (_) {}
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
 if ((relative.startsWith('icons/') || relative === 'favicon.ico') && ASSETS.includes(relative) && !url.search) {
  event.respondWith((async () => {
   const cache = await caches.open(CACHE), cached = await cache.match(url.href);
   if (cached) return cached;
   const response = await fetch(request);
   if (response.ok) { try { await cache.put(url.href, response.clone()); } catch (_) {} }
   return response;
  })());
 }
 // The manifest remains network-served; its production identity is unchanged.
});
