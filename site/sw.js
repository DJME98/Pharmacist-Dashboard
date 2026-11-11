// Keeps the app available offline. Bump VERSION whenever any listed file changes.
const VERSION = 'pd-13';
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

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((hit) => hit ?? fetch(event.request)),
  );
});
