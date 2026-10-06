// Service worker : met l'enveloppe de l'app en cache (démarrage instantané, écran hors-ligne).
// L'application Apps Script elle-même est toujours chargée en ligne.
// Une nouvelle version attend (« waiting ») jusqu'à ce que l'utilisateur touche « Mettre à jour ».
const CACHE = "lwsm-shell-v8";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/maskable-512.png", "./icons/apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))); });
self.addEventListener("message", e => { if (e.data === "SKIP_WAITING") self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k.indexOf("lwsm-shell") === 0).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  e.respondWith(
    fetch(r).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); return res; })
      .catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || caches.match("./index.html")))
  );
});
