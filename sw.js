const CACHE_NAME = 'paf-paif-v129';

// Arquivos "essenciais" do app: sempre tentamos buscar a versão mais nova na rede
// primeiro, e só usamos o cache se o dispositivo estiver offline. Isso garante que
// qualquer alteração publicada apareça automaticamente, sem precisar trocar o número
// de versão do cache manualmente.
const CORE_ASSETS = ['./', './index.html', './styles.css', './produtividade.css', './umbrela-ui.css', './produtividade.js', './app.js', './historico.js', './notas.js', './firebase-config.js', './paulus.v1.js', './paulus-consulta.js', './paulus-umbrella.js', './print-runtime.js', './corretor.js'];

// Arquivos estáticos que raramente mudam (ícones, manifesto): cache primeiro,
// com fallback para a rede.
// conhecimento.json = base de normas do Paulus (pacote leve): cache primeiro; ao atualizá-la, troque o CACHE_NAME.
const STATIC_ASSETS = ['./manifest.json', './icon-192.png', './icon-512.png', './conhecimento.json', './conhecimento-umbrella.json', './vendor/pdf.min.js', './vendor/pdf.worker.min.js'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Um por um: se um arquivo falhar (404), os demais continuam sendo guardados.
        const urls = [...CORE_ASSETS, ...STATIC_ASSETS];
        return Promise.allSettled(urls.map((u) => cache.add(u))).then((res) => {
          res.forEach((r, i) => { if (r.status === 'rejected') console.warn('[sw] não foi possível guardar em cache:', urls[i]); });
        });
      })
      .catch((e) => console.warn('[sw] falha ao abrir o cache', e))
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

  // Dicionário do corretor (≈5 MB): o próprio corretor o guarda no cache do navegador; não passa pelo cache do app.
  if (url.origin === self.location.origin && url.pathname.includes('/spell/')) return;

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
