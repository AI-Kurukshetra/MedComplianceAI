/**
 * MedCompliance AI — Service Worker
 * Provides offline caching and background sync for the PWA.
 */

const CACHE_VERSION = "v1";
const STATIC_CACHE = `mc-static-${CACHE_VERSION}`;
const PAGES_CACHE = `mc-pages-${CACHE_VERSION}`;
const ASSETS_CACHE = `mc-assets-${CACHE_VERSION}`;

/* Static assets to pre-cache on install */
const PRECACHE_URLS = [
  "/",
  "/offline",
  "/manifest.json",
];

/* ── Install ────────────────────────────────────────────── */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

/* ── Activate ───────────────────────────────────────────── */
self.addEventListener("activate", (event) => {
  const currentCaches = [STATIC_CACHE, PAGES_CACHE, ASSETS_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !currentCaches.includes(key))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/* ── Fetch strategy ─────────────────────────────────────── */
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  /* Skip non-GET, cross-origin, and Supabase API requests */
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/webpack-hmr")
  ) {
    return;
  }

  /* Next.js build chunks — cache-first */
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  /* Images and media — cache-first */
  if (/\.(png|jpg|jpeg|gif|svg|ico|webp|mp4|webm|woff2?)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(request, ASSETS_CACHE));
    return;
  }

  /* HTML pages — network-first with cache fallback */
  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(networkFirst(request, PAGES_CACHE));
    return;
  }
});

/* ── Cache strategies ───────────────────────────────────── */

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503, statusText: "Service Unavailable" });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    /* Fallback to offline page */
    const offlinePage = await caches.match("/offline");
    if (offlinePage) return offlinePage;

    return new Response(
      `<!DOCTYPE html><html><head><title>Offline</title></head><body>
        <h1>You are offline</h1>
        <p>MedCompliance AI requires a connection for this page.</p>
        <a href="/dashboard">Go to Dashboard</a>
      </body></html>`,
      { headers: { "Content-Type": "text/html" } },
    );
  }
}

/* ── Background Sync ────────────────────────────────────── */
self.addEventListener("sync", (event) => {
  if (event.tag === "quiz-submit-sync") {
    event.waitUntil(syncPendingQuizzes());
  }
});

async function syncPendingQuizzes() {
  /* Open IndexedDB from the service worker context */
  const db = await openDB();
  const submissions = await getAllFromStore(db, "pending_submissions");

  for (const item of submissions) {
    try {
      const res = await fetch(`/api/quiz/${item.moduleId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: item.payload }),
      });

      if (res.ok) {
        await deleteFromStore(db, "pending_submissions", item.id);
      }
    } catch {
      /* Will retry on next sync event */
    }
  }
}

/* ── Minimal IndexedDB access from SW ───────────────────── */
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("medcompliance-offline", 1);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("pending_submissions")) {
        db.createObjectStore("pending_submissions", { keyPath: "id" });
      }
    };
  });
}

function getAllFromStore(db, storeName) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result ?? []);
    req.onerror = () => reject(req.error);
  });
}

function deleteFromStore(db, storeName, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
