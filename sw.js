/* =========================================================================
   Service Worker - Plano de Acompanhamento Familiar (PAF / PAIF)
   Suporte Offline, Pre-cache de Dependências e PWA
   ========================================================================= */

const CACHE_NAME = 'paf-paif-v1';

// Recursos locais e CDNs críticos para funcionamento 100% offline
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './firebase-config.js',
  // Fonts e CDNs JS do index.html
  'https://fonts.googleapis.com/css2?family=Lora:wght@500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

/* ---------------------------- Instalação ---------------------------- */

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).catch((err) => {
      console.warn('Falha parcial no pre-cache de ativos estáticos:', err);
    })
  );
  self.skipWaiting();
});

/* ---------------------------- Ativação ---------------------------- */

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      )
    )
  );
  self.clients.claim();
});

/* ---------------------------- Interceptação Fetch ---------------------------- */

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Aceita apenas requisições GET
  if (request.method !== 'GET') return;

  // Nunca interceptar chamadas diretas de API/Database do Firebase/Firestore
  if (
    request.url.includes('firestore.googleapis.com') ||
    request.url.includes('firebaseinstallations.googleapis.com')
  ) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      // Se encontrou no cache, retorna imediatamente
      if (cached) return cached;

      // Senão, busca na rede e guarda em cache dinâmico se for válido
      return fetch(request)
        .then((response) => {
          if (
            response &&
            response.status === 200 &&
            (response.type === 'basic' || response.type === 'cors')
          ) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // Fallback para requisições de navegação offline
          if (request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
