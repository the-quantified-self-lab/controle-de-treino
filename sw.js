// Service worker — Controle de Treino
// Deixa o app abrir e funcionar 100% offline (registro de treino não depende de internet).
// Usa caminhos RELATIVOS, então continua funcionando mesmo se o repositório for renomeado.
const CACHE = "controle-treino-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png",
  "./favicon-32.png",
  "./favicon-48.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      // addAll falharia inteiro se um arquivo faltasse; add() individual tolera ausências.
      .then((c) => Promise.all(ASSETS.map((u) => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // Só cuida dos arquivos do próprio app (mesma origem).
  // Requisições do Google (login/planilha) SEMPRE vão direto à rede — nunca passam pelo cache.
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;

  e.respondWith(
    caches.match(e.request).then((hit) => {
      if (hit) return hit;
      return fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match("./index.html")); // offline: cai no app shell
    })
  );
});
