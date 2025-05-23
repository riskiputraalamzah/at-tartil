// service-worker.js

const CACHE_NAME = "at-tartil-cache-v4"; // Naikkan versi!
const CORE_APP_SHELL_URLS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/css/style.css",
  "/js/script.js",
  "/img/logo.png",
  "/img/bg5.png",
  "/img/feedback.png",
  "/img/offline-placeholder.png",
];

// --- Konfigurasi untuk Pre-caching ---
const TARTIL_TO_PRECACHE = [1]; // Hanya Jilid 1 yang di-precache
const MAX_PAGES_PER_TARTIL = 36;

function generatePrecacheImageUrls() {
  const imageUrls = [];
  TARTIL_TO_PRECACHE.forEach((tartilNum) => {
    imageUrls.push(`/img/tartil${tartilNum}/cover.png`);
    for (let j = 1; j <= MAX_PAGES_PER_TARTIL; j++) {
      imageUrls.push(`/img/tartil${tartilNum}/${j}.png`);
    }
  });
  return imageUrls;
}

const URLS_TO_PRECACHE = [
  ...CORE_APP_SHELL_URLS,
  ...generatePrecacheImageUrls(),
];

// Total jilid untuk logika runtime caching jika diperlukan (meskipun tidak eksplisit dipakai di fetch di bawah)
const TOTAL_TARTIL_COUNT = 6;

// Install service worker
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Install event");
  self.skipWaiting();

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log(
          `[Service Worker] Pre-caching ${
            URLS_TO_PRECACHE.length
          } files: App Shell and Tartil Jilid ${TARTIL_TO_PRECACHE.join(", ")}`
        );
        return cache.addAll(URLS_TO_PRECACHE);
      })
      .catch((err) => {
        console.error("[Service Worker] Gagal pre-caching saat install:", err);
      })
  );
});

// Aktifasi: bersihkan cache lama
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activate event");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              console.log("[Service Worker] Deleting old cache:", name);
              return caches.delete(name);
            }
          })
        )
      )
      .then(() => {
        console.log("[Service Worker] Claiming clients");
        return self.clients.claim();
      })
  );
});

// Fetch: strategi caching
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);

  // Strategi untuk navigasi HTML (App Shell) - Network-first
  if (
    event.request.mode === "navigate" ||
    event.request.destination === "document"
  ) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse.ok) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || caches.match("/index.html");
          });
        })
    );
    return;
  }

  // Strategi Cache-First dengan Runtime Caching untuk aset lain (CSS, JS, Gambar)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            (networkResponse.type !== "basic" &&
              networkResponse.type !== "cors")
          ) {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            // Hanya cache jika itu adalah request yang berhasil dan berasal dari domain kita atau CORS yang valid
            // Ini akan otomatis meng-cache gambar Tartil Jilid 2-6 saat pertama kali diakses
            if (
              url.origin === self.location.origin ||
              networkResponse.type === "cors"
            ) {
              // console.log("[Service Worker] Runtime caching new resource from network:", event.request.url);
              cache.put(event.request, responseToCache);
            }
          });
          return networkResponse;
        })
        .catch((error) => {
          console.warn(
            "[Service Worker] Network fetch failed for:",
            event.request.url,
            error
          );
          if (event.request.destination === "image") {
            return caches
              .match("/img/offline-placeholder.png")
              .then((response) => {
                if (response) return response;
                console.error("Offline placeholder image not found in cache.");
                throw error;
              });
          }
          throw error;
        });
    })
  );
});
