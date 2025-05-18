const CACHE_NAME = "at-tartil-cache-v1";
const urlsToCache = [
  "/index.html",
  "/css/style.css",
  "/js/script.js",
  "/img/logo.png",
  "/img/bg5.png",
  "/img/feedback.png",
];

// Install service worker dan cache file
self.addEventListener("install", (event) => {
  self.skipWaiting(); // agar worker langsung aktif

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
      .catch((err) => {
        console.error("Gagal cache saat install:", err);
      })
  );
});

// Aktifasi: bersihkan cache lama
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              return caches.delete(name);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch: ambil dari cache dulu, jika tidak ada ambil dari network
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(event.request).catch(() => {
          // fallback jika fetch gagal, misal karena offline
          if (event.request.destination === "document") {
            return caches.match("/index.html");
          }
        })
      );
    })
  );
});
