// Keeps the app available offline. Bump VERSION whenever any listed file changes.
const VERSION = 'pd-19';
const FILES = [
  './', 'index.html', 'styles.css', 'app.js', 'manifest.webmanifest',
  'calc/formulas.js', 'calc/patient.js', 'calc/registry.js', 'data/references.js',
  'dom.js', 'data/insulin.js', 'calc/insulin.js', 'calc/labs.js', 'data/care.js', 'data/tools.js', 'tools-view.js',
  'calc/convert.js', 'data/conversions.js', 'convert-view.js',
  'calc/vanco.js', 'calc/amino.js', 'data/pk.js', 'pk-view.js',
  'calc/resus.js', 'data/resus.js', 'resus-view.js',
  'calc/local.js', 'data/local.js', 'local-view.js',
  'fonts/atkinson-400.woff2', 'fonts/atkinson-700.woff2',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Network first, so updates show up right away; the saved copy is used only when offline.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    fetch(event.request, { cache: 'no-cache' })
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(event.request, copy)); }
        return res;
      })
      .catch(() => caches.match(event.request, { ignoreSearch: true })),
  );
});
