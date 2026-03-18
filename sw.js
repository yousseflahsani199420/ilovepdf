const CACHE_VERSION = "v1.0.0";
const CORE_CACHE = `core-${CACHE_VERSION}`;
const PAGE_CACHE = `pages-${CACHE_VERSION}`;
const ASSET_CACHE = `assets-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;

const CORE_ASSETS = [
  "/",
  "/index.html",
  "/app.js",
  "/language-switcher.js",
  "/vendor/qrcode.min.js",
  "/pdflogo.png",
  "/robots.txt",
  "/sitemap.xml"
];

function isSameOrigin(requestUrl) {
  return requestUrl.origin === self.location.origin;
}

function isAsset(pathname) {
  return /\.(?:js|css|png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|otf|xml|txt)$/i.test(pathname);
}

function putInCache(cacheName, request, response) {
  if (!response) return;
  if (response.status !== 200 && response.type !== "opaque") return;
  const cloned = response.clone();
  caches.open(cacheName).then((cache) => cache.put(request, cloned)).catch(() => {});
}

async function networkFirst(request, cacheName) {
  try {
    const fresh = await fetch(request);
    putInCache(cacheName, request, fresh);
    return fresh;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    if (request.mode === "navigate") {
      const fallback = await caches.match("/index.html");
      if (fallback) return fallback;
    }

    return new Response("Offline", {
      status: 503,
      statusText: "Offline",
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request);

  const networkPromise = fetch(request)
    .then((fresh) => {
      putInCache(cacheName, request, fresh);
      return fresh;
    })
    .catch(() => null);

  if (cached) return cached;

  const fresh = await networkPromise;
  if (fresh) return fresh;

  return new Response("Offline", {
    status: 503,
    statusText: "Offline",
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CORE_CACHE)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  const keep = new Set([CORE_CACHE, PAGE_CACHE, ASSET_CACHE, RUNTIME_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.map((name) => (keep.has(name) ? Promise.resolve() : caches.delete(name)))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, PAGE_CACHE));
    return;
  }

  if (isSameOrigin(url)) {
    if (isAsset(url.pathname)) {
      event.respondWith(staleWhileRevalidate(request, ASSET_CACHE));
      return;
    }

    event.respondWith(staleWhileRevalidate(request, PAGE_CACHE));
    return;
  }

  // Cache useful third-party static resources (fonts/CDNs/analytics scripts).
  event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
});
