const CACHE_NAME = "clean-style-v7";
const IMMUTABLE_IMAGE = /^\/images\/(?:[^/]+\/)*[^/]+-[a-f0-9]{10}\.webp$/;
const LOCAL_HOSTS = ["localhost", "127.0.0.1", "::1"];
const IS_LOCAL_DEV = LOCAL_HOSTS.includes(self.location.hostname);

const PRECACHE_URLS = [
  "/offline.html",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/icon-192-maskable.png",
  "/icons/icon-512-maskable.png",
  "/icons/adult/icon-192x192.png",
  "/icons/adult/icon-512x512.png",
  "/icons/adult/icon-192-maskable.png",
  "/icons/adult/icon-512-maskable.png",
];

self.addEventListener("install", (event) => {
  if (IS_LOCAL_DEV) {
    self.skipWaiting();
    return;
  }

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  if (IS_LOCAL_DEV) {
    event.waitUntil(
      caches
        .keys()
        .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
        .then(() => self.registration.unregister())
    );
    return;
  }

  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("clean-style-") && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

async function cacheFirstImage(request) {
  let cache;
  try {
    cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;
  } catch {
    // Storage may be unavailable; fetching the public image must still work.
  }
  const response = await fetch(request);
  if (response.ok && cache) {
    await cache.put(request, response.clone()).catch(() => {});
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  if (IS_LOCAL_DEV) return;
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/api/")) return;

  if (IMMUTABLE_IMAGE.test(url.pathname)) {
    event.respondWith(cacheFirstImage(event.request));
    return;
  }

  if (url.pathname.startsWith("/images/") && /\.(?:webp|png|jpe?g|svg)$/i.test(url.pathname)) {
    const storage = caches.open(CACHE_NAME).catch(() => null);
    const cached = storage.then((cache) => cache?.match(event.request)).catch(() => undefined);
    const refresh = fetch(event.request).then(async (response) => {
      const cache = await storage;
      if (response.ok && cache) {
        await cache.put(event.request, response.clone()).catch(() => {});
      }
      return response;
    });
    event.waitUntil(refresh.then(() => undefined).catch(() => undefined));
    event.respondWith(cached.then((response) => response || refresh));
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(event.request).then(
          (cached) =>
            cached ||
            fetch(event.request).then((response) => {
              if (response.ok) cache.put(event.request, response.clone());
              return response;
            })
        )
      )
    );
    return;
  }

  if (url.pathname.startsWith("/_next/")) return;

  if (event.request.mode === "navigate") {
    const cacheKey = url.origin + url.pathname;
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        fetch(event.request)
          .then((response) => {
            if (response.ok) cache.put(cacheKey, response.clone());
            return response;
          })
          .catch(() =>
            cache.match(cacheKey).then(
              (cached) => cached || cache.match("/offline.html")
            )
          )
      )
    );
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      fetch(event.request)
        .then((response) => {
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        })
        .catch(() => cache.match(event.request))
    )
  );
});
