/* Sulog service worker — offline shell.
 *
 * STRATEGY (deliberately conservative for a live auth app):
 *  - Navigations (the app HTML at "/"): NETWORK-FIRST — always try the network so online users get
 *    the latest build; only fall back to the cached shell when offline. This avoids the classic
 *    "cache-first bricks the app on a stale index.html" failure.
 *  - Same-origin static assets (icons, manifest): cache-first, then network.
 *  - EVERYTHING cross-origin (Supabase REST/Auth, Google OAuth, fonts, etc.) is IGNORED — the SW
 *    never intercepts or caches it, so sign-in and data sync behave exactly as without a SW.
 *  - Only GET is ever handled.
 *
 * Bump CACHE when the shell/icons change to evict old caches. Registration is OPT-IN for now
 * (see the app: localStorage 'sulog:offline' = 'on') until iOS + OAuth are verified end-to-end.
 */
const CACHE = "sulog-shell-v1";
const SHELL = ["/", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/icon-180.png"];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {})));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;                       // never touch writes / auth POSTs
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;        // Supabase / Google / CDNs → straight to network

  // App HTML → network-first, fall back to the cached shell offline.
  if (req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("/", copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((m) => m || caches.match("/")))
    );
    return;
  }

  // Static same-origin assets → cache-first, then network (and cache the result).
  e.respondWith(
    caches.match(req).then((hit) =>
      hit ||
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => hit)
    )
  );
});
