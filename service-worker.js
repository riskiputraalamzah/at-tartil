// service-worker.js

const CACHE_NAME = "at-tartil-cache-v2"; // Naikkan versi jika ada perubahan pada daftar cache atau logika SW
const CORE_APP_SHELL_URLS = [
  "/", // Alias untuk index.html di root, penting untuk start_url
  "/index.html",
  "/manifest.json", // Cache manifest file
  "/css/style.css",
  "/js/script.js",
  "/js/firebase.js",
  "/img/logo.png", // Dari manifest.json
  "/img/feedback.png",
  "/img/offline-placeholder.png", // Sediakan gambar ini sebagai fallback jika gambar lain gagal load offline
];

const TARTIL_COUNT = 6;
const MAX_PAGES_PER_TARTIL = 36; // Sesuai dengan MAX_PAGES di script.js Anda

function generateTartilImageUrls() {
  const tartilImageUrls = [];
  for (let i = 1; i <= TARTIL_COUNT; i++) {
    tartilImageUrls.push(`/img/tartil${i}/cover.png`);
    for (let j = 1; j <= MAX_PAGES_PER_TARTIL; j++) {
      tartilImageUrls.push(`/img/tartil${i}/${j}.png`);
    }
  }
  return tartilImageUrls;
}

const ALL_URLS_TO_CACHE = [
  ...CORE_APP_SHELL_URLS,
  ...generateTartilImageUrls(),
];

// Install service worker dan cache file
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Install event");
  self.skipWaiting(); // Agar worker langsung aktif dan menggantikan yang lama

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log(
          `[Service Worker] Caching ${ALL_URLS_TO_CACHE.length} files: App Shell and Tartil images`
        );
        // Menggunakan addAll akan gagal jika salah satu URL gagal.
        // Ini baik untuk memastikan semua aset penting ter-cache.
        return cache.addAll(ALL_URLS_TO_CACHE);
      })
      .catch((err) => {
        console.error(
          "[Service Worker] Gagal melakukan pre-caching saat install:",
          err
        );
        // Anda mungkin ingin menangani ini lebih lanjut,
        // tapi biasanya jika precache gagal, instalasi SW juga gagal.
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
        return self.clients.claim(); // Pastikan SW baru mengontrol semua klien terbuka segera
      })
  );
});

// Fetch: strategi Cache-First, lalu Network dengan fallback dan runtime caching
self.addEventListener("fetch", (event) => {
  // Hanya tangani request GET
  if (event.request.method !== "GET") {
    return;
  }

  // Strategi untuk navigasi HTML (App Shell)
  // Network-first untuk halaman HTML agar pengguna selalu mendapatkan versi terbaru jika online
  if (
    event.request.mode === "navigate" ||
    event.request.destination === "document"
  ) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Jika berhasil dari network, simpan ke cache dan kembalikan
          if (networkResponse.ok) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Jika network gagal (offline), ambil dari cache
          return caches.match(event.request).then((cachedResponse) => {
            // Jika request spesifik ada di cache, gunakan itu.
            // Jika tidak (misalnya, URL dengan parameter), fallback ke index.html utama.
            return cachedResponse || caches.match("/index.html");
          });
        })
    );
    return;
  }

  // Strategi Cache-First untuk aset lain (CSS, JS, Gambar)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // console.log("[Service Worker] Serving from cache:", event.request.url);
        return cachedResponse;
      }

      // Jika tidak ada di cache, ambil dari network
      // console.log("[Service Worker] Fetching from network:", event.request.url);
      return fetch(event.request)
        .then((networkResponse) => {
          // Periksa apakah response valid sebelum di-cache
          // 'basic' untuk same-origin. 'cors' untuk cross-origin jika diperlukan.
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            (networkResponse.type !== "basic" &&
              networkResponse.type !== "cors")
          ) {
            return networkResponse; // Jangan cache response yang tidak valid atau opaque
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            // console.log("[Service Worker] Caching new resource from network:", event.request.url);
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        })
        .catch((error) => {
          console.warn(
            "[Service Worker] Network fetch failed for:",
            event.request.url,
            error
          );
          // Fallback jika fetch gagal (misal, offline dan tidak ada di cache)
          if (event.request.destination === "image") {
            return caches
              .match("/img/offline-placeholder.png")
              .then((response) => {
                if (response) return response;
                // Jika placeholder pun tidak ada, throw error agar browser handle
                console.error("Offline placeholder image not found in cache.");
                throw error;
              });
          }
          // Untuk jenis request lain yang tidak ada fallbacknya, biarkan error network standar
          // atau throw error agar promise di-reject.
          throw error;
        });
    })
  );
});
