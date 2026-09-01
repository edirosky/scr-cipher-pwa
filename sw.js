/* ============================================================
   Service Worker — SCR CIPHER · COSMAR (PWA)
   Estratégias:
   - App shell (index.html + fontes + ícones): precache, cache-first
     (Leaflet, topojson e o mapa-múndi já são embutidos no index.html)
   - Navegação: network-first com fallback para o shell em cache
   - Tiles OSM: stale-while-revalidate com limite LRU
   ============================================================ */

const VERSION = "v8";
const SHELL_CACHE = `scr-cipher-shell-${VERSION}`;
const TILE_CACHE = `scr-cipher-tiles-${VERSION}`;
const MAX_TILE_ENTRIES = 600;

const SHELL_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./offline.html",
  "./fonts/fonts.css",
  "./fonts/ShareTechMono-400-latin.woff2",
  "./fonts/Barlow-400-latin.woff2",
  "./fonts/Barlow-400-latin-ext.woff2",
  "./fonts/Barlow-500-latin.woff2",
  "./fonts/Barlow-500-latin-ext.woff2",
  "./fonts/BarlowCondensed-400-latin.woff2",
  "./fonts/BarlowCondensed-400-latin-ext.woff2",
  "./fonts/BarlowCondensed-700-latin.woff2",
  "./fonts/BarlowCondensed-700-latin-ext.woff2",
  "./fonts/BarlowCondensed-900-latin.woff2",
  "./fonts/BarlowCondensed-900-latin-ext.woff2",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png",
  "./icons/icon.svg",
  "./images/marker-icon.png",
  "./images/marker-icon-2x.png",
  "./images/marker-shadow.png",
  "./images/layers.png",
  "./images/layers-2x.png",
  "./navios/index.html",
  "./navios/manifest.json",
  "./navios/pwa-192x192.png",
  "./navios/pwa-512x512.png",
  "./navios/apple-touch-icon-180x180.png",
  "./navios/favicon.ico"
];

const TILE_HOSTS = [
  "tile.openstreetmap.org",
  "a.tile.openstreetmap.org",
  "b.tile.openstreetmap.org",
  "c.tile.openstreetmap.org"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("scr-cipher-") && k !== SHELL_CACHE && k !== TILE_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isTileUrl(url) {
  return TILE_HOSTS.some((h) => url.hostname === h || url.hostname.endsWith("." + h));
}

async function trimTileCache() {
  const cache = await caches.open(TILE_CACHE);
  const keys = await cache.keys();
  if (keys.length <= MAX_TILE_ENTRIES) return;
  const excess = keys.length - MAX_TILE_ENTRIES;
  await Promise.all(keys.slice(0, excess).map((req) => cache.delete(req)));
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(TILE_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && (response.ok || response.type === "opaque")) {
        cache.put(request, response.clone());
        trimTileCache();
      }
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Navegação: network-first, cai para o shell em cache, depois offline.html
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          caches.open(SHELL_CACHE).then((c) => c.put("./index.html", response.clone()));
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(SHELL_CACHE);
          return (
            (await cache.match("./index.html")) ||
            (await cache.match("./")) ||
            (await cache.match("./offline.html")) ||
            Response.error()
          );
        })
    );
    return;
  }

  // Tiles OSM: stale-while-revalidate com LRU
  if (isTileUrl(url)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Mesmo domínio (shell, fontes, ícones): cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response && response.ok) {
              caches.open(SHELL_CACHE).then((c) => c.put(request, response.clone()));
            }
            return response;
          })
      )
    );
    return;
  }

  // Demais cross-origin: deixa passar sem interceptar
});
