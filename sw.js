const PREFIX = "lwsm-shell-";
const CACHE = PREFIX + "20261122-3";
const BASE = new URL(self.registration.scope);
const SHELL = ["manifest.webmanifest","icons/icon-192.png","icons/icon-512.png","icons/maskable-512.png","icons/apple-touch-icon.png"];
const urls = new Map(SHELL.map(path => [new URL(path, BASE).pathname, new URL(path, BASE).href]));
const index = BASE.href;
const indexPath = new URL("index.html", BASE).pathname;

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.add(new Request(index, { cache: "reload" }));
    await Promise.allSettled(SHELL.map(path => cache.add(new Request(new URL(path, BASE), { cache: "reload" }))));
    await self.skipWaiting();
  })());
});
self.addEventListener("message", event => {
  if (event.data === "SKIP_WAITING") event.waitUntil(self.skipWaiting());
});
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== BASE.origin) return;
  const key = (url.pathname === BASE.pathname || url.pathname === indexPath) ? index : urls.get(url.pathname);
  if (!key) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    let response;
    try {
      response = await fetch(key === index ? BASE.href : request, { cache: "no-store" });
      if (response.ok && !response.redirected) {
        try { await cache.put(key, response.clone()); } catch (error) {}
        return response;
      }
    } catch (error) { /* Use the installed copy offline. */ }
    return (await cache.match(key)) || response || Response.error();
  })());
});
