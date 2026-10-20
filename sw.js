/* BoardLab — service worker. Cambia VERSION a ogni nuova versione: il tablet la scarica e propone AGGIORNA. */
const VERSION = '0.14.0';
const CACHE = 'boardlab-' + VERSION;
const FILES = [
  './', 'index.html', 'manifest.webmanifest',
  'lib/jspdf.umd.min.js', 'lib/pdf.min.js', 'lib/pdf.worker.min.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-64.png',
  'fonts/arimo-400-italic.ttf', 'fonts/arimo-400-italic.woff2', 'fonts/arimo-400-normal.ttf', 'fonts/arimo-400-normal.woff2', 'fonts/arimo-700-italic.ttf', 'fonts/arimo-700-italic.woff2', 'fonts/arimo-700-normal.ttf', 'fonts/arimo-700-normal.woff2', 'fonts/atkinson-hyperlegible-400-italic.ttf', 'fonts/atkinson-hyperlegible-400-italic.woff2', 'fonts/atkinson-hyperlegible-400-normal.ttf', 'fonts/atkinson-hyperlegible-400-normal.woff2', 'fonts/atkinson-hyperlegible-700-italic.ttf', 'fonts/atkinson-hyperlegible-700-italic.woff2', 'fonts/atkinson-hyperlegible-700-normal.ttf', 'fonts/atkinson-hyperlegible-700-normal.woff2', 'fonts/carlito-400-italic.ttf', 'fonts/carlito-400-italic.woff2', 'fonts/carlito-400-normal.ttf', 'fonts/carlito-400-normal.woff2', 'fonts/carlito-700-italic.ttf', 'fonts/carlito-700-italic.woff2', 'fonts/carlito-700-normal.ttf', 'fonts/carlito-700-normal.woff2', 'fonts/comic-neue-400-italic.ttf', 'fonts/comic-neue-400-italic.woff2', 'fonts/comic-neue-400-normal.ttf', 'fonts/comic-neue-400-normal.woff2', 'fonts/comic-neue-700-italic.ttf', 'fonts/comic-neue-700-italic.woff2', 'fonts/comic-neue-700-normal.ttf', 'fonts/comic-neue-700-normal.woff2', 'fonts/cousine-400-italic.ttf', 'fonts/cousine-400-italic.woff2', 'fonts/cousine-400-normal.ttf', 'fonts/cousine-400-normal.woff2', 'fonts/cousine-700-italic.ttf', 'fonts/cousine-700-italic.woff2', 'fonts/cousine-700-normal.ttf', 'fonts/cousine-700-normal.woff2', 'fonts/eb-garamond-400-italic.ttf', 'fonts/eb-garamond-400-italic.woff2', 'fonts/eb-garamond-400-normal.ttf', 'fonts/eb-garamond-400-normal.woff2', 'fonts/eb-garamond-700-italic.ttf', 'fonts/eb-garamond-700-italic.woff2', 'fonts/eb-garamond-700-normal.ttf', 'fonts/eb-garamond-700-normal.woff2', 'fonts/roboto-400-italic.ttf', 'fonts/roboto-400-italic.woff2', 'fonts/roboto-400-normal.ttf', 'fonts/roboto-400-normal.woff2', 'fonts/roboto-700-italic.ttf', 'fonts/roboto-700-italic.woff2', 'fonts/roboto-700-normal.ttf', 'fonts/roboto-700-normal.woff2', 'fonts/tinos-400-italic.ttf', 'fonts/tinos-400-italic.woff2', 'fonts/tinos-400-normal.ttf', 'fonts/tinos-400-normal.woff2', 'fonts/tinos-700-italic.ttf', 'fonts/tinos-700-italic.woff2', 'fonts/tinos-700-normal.ttf', 'fonts/tinos-700-normal.woff2'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('boardlab-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });
/* Prima i file salvati sul tablet: nessuna attesa e nessun consumo di rete */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(c => c.match(req, { ignoreSearch: true })
    .then(r => r || (req.mode === 'navigate' ? c.match('index.html') : null))
    .then(r => r || fetch(req))));
});
