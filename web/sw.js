const CACHE = "nk-auto-builder-v1";
self.addEventListener("install", e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(["/", "/assets/styles.css", "/assets/app.js", "/assets/manifest.webmanifest"]))));
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
