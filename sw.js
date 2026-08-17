const CACHE_NAME = 'paf-paif-v46';

// Arquivos "essenciais" do app: sempre tentamos buscar a versão mais nova na rede
// primeiro, e só usamos o cache se o dispositivo estiver offline. Isso garante que
// qualquer alteração publicada apareça automaticamente, sem precisar trocar o número
// de versão do cache manualmente.
const CORE_ASSETS = ['./', './index.html', './styles.css', './app.js', './firebase-config.js'];

// Arquivos estáticos que raramente mudam (ícones, manifesto): cache primeiro,
// com fallback para a rede.
const STATIC_ASSETS = ['./manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll([...CORE_ASSETS, ...STATIC_ASSETS]))
      .catch(() => {})
  );
  // Ativa a nova versão imediatamente, sem esperar as abas antigas fecharem.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

function isCoreRequest(url) {
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.endsWith('/') || url.pathname.endsWith('/index.html')) return true;
  return CORE_ASSETS.some((asset) => asset !== './' && url.pathname.endsWith(asset.replace('./', '/')));
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  // Nunca cachear chamadas ao Firebase/Firestore - sempre precisam de rede
  if (request.url.includes('firestore.googleapis.com') || request.url.includes('googleapis.com')) {
    return;
  }

  const url = new URL(request.url);

  if (isCoreRequest(url)) {
    // Network-first: busca sempre a versão mais recente; cai para o cache só se offline.
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Demais arquivos (ícones, fontes, manifesto): cache primeiro, com fallback para a rede.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response && response.status === 200 && request.url.startsWith(self.location.origin)) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});
