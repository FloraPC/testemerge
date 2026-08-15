/**
 * service-worker.js
 * -----------------------------------------------------------------------
 * Estratégia: "cache-first" para o app shell inteiro. Como este é um
 * jogo pensado para quiosques/tablets de exposição — muitas vezes sem
 * internet estável — priorizamos disponibilidade offline garantida em
 * vez de sempre buscar a versão mais nova da rede.
 *
 * Para publicar uma atualização do jogo, basta subir os novos arquivos
 * e incrementar CACHE_VERSION abaixo: o service worker antigo detecta a
 * mudança, baixa os novos arquivos em segundo plano e passa a servi-los
 * assim que o app for reaberto.
 * -----------------------------------------------------------------------
 */

const CACHE_VERSION = 'female-merge-v1';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/data.js',
  './js/storage.js',
  './js/audio.js',
  './js/accessibility.js',
  './js/render.js',
  './js/game.js',
  './js/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          // guarda uma cópia no cache para a próxima vez que estiver offline
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => {
          // offline e sem cópia em cache: para navegação, cai no shell principal
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
