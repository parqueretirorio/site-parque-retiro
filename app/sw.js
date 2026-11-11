// CONecta Retiro: permite instalar o app e abrir a casca do app mesmo com internet fraca.
// Sempre busca a versão nova na internet primeiro; só usa a cópia guardada se estiver sem conexão.
// Os dados NÃO ficam aqui: vêm do servidor do Parque a cada abertura.
const CACHE = 'conecta-retiro-v1';
const CASCA = ['./', './index.html', './app.css', './app.js', './manifest.webmanifest', './icone-192.png', './icone-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CASCA)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return; // servidor de dados e login: nunca guardados
  e.respondWith(fetch(e.request).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); } return r; }).catch(() => caches.match(e.request)));
});
