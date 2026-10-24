/* MakeQR Pro service worker — app-shell + static asset caching.
 * NEVER caches API routes, Stripe, checkout, or ad traffic. Those always
 * go straight to the network so payments and verification are never stale. */
const CACHE = "makeqr-shell-v1";

// Minimal app shell precached on install.
const SHELL = ["/", "/scan", "/manifest.json", "/icon-192.png", "/icon-512.png"];

// Requests we must never intercept or cache.
function isBypassed(url) {
  if (url.origin !== self.location.origin) return true; // third parties (Stripe, ads, fonts)
  return (
    url.pathname.startsWith("/api/") ||
    url.pathname.includes("checkout") ||
    url.pathname.includes("verify-session")
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (isBypassed(url)) return; // let the network handle it, uncached

  // Navigations: network-first so fresh HTML wins, fall back to cached shell offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("/")))
    );
    return;
  }

  // Static assets: stale-while-revalidate for fast loads.
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
