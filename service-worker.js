const CACHE_NAME = "at-tartil-cache-v1";
const urlsToCache = [
  "/index.html",
  "/css/style.css",
  "/js/script.js",
  "/img/logo.png",
  "/img/bg5.png",
  "/img/feedback.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
