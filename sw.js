/* BoardLab — service worker. Cambia VERSION a ogni nuova versione: il tablet la scarica e propone AGGIORNA. */
const VERSION = '0.7.3';
const CACHE = 'boardlab-' + VERSION;
const FILES = [
  './', 'index.html', 'manifest.webmanifest',
  'lib/jspdf.umd.min.js', 'lib/pdf.min.js', 'lib/pdf.worker.min.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-64.png'
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
