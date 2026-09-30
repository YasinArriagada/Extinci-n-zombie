/* EXTINCIÓN ZOMBIE — service worker
 * Guarda el juego en el dispositivo la primera vez que se abre con internet, para que
 * el modo SOLITARIO funcione después sin conexión. El multijugador sigue necesitando
 * internet (lo comprueba game.js).
 *
 * Si agregas archivos nuevos al juego (música, imágenes), añádelos a CORE y sube CACHE_VERSION.
 */
const CACHE_VERSION = 'v4';
const CACHE = 'extincion-zombie-' + CACHE_VERSION;
const CORE = [
  './', 'index.html', 'game.js', 'style.css', 'favicon.svg',
  'Menu.mp3', 'Avion.mp3', 'Music_robot.mp3', 'mementomori.jpeg', 'yo.jpeg',
  'manifest.json', 'icon-192 (1).png', 'icon-512 (1).png', 'icon-512-maskable.png',
];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

// La caché se guarda SIN el "?v=..." que index.html agrega para evitar versiones viejas.
const keyFor = url => new Request(url.origin + url.pathname);

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // uno por uno: si falta un archivo (p. ej. una imagen), los demás igual se guardan
    await Promise.allSettled(CORE.map(async f => {
      const res = await fetch(new Request(f, { cache: 'reload' }));
      if (res && res.ok) await cache.put(keyFor(new URL(f, self.registration.scope)), res);
    }));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(n => n.startsWith('extincion-zombie-') && n !== CACHE).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

// Los navegadores piden el audio por partes (Range); se responde desde la caché cortando el archivo.
async function rangeFrom(req, cached) {
  const buf = await cached.arrayBuffer();
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.get('range') || '');
  let start = m && m[1] ? parseInt(m[1], 10) : 0;
  let end = m && m[2] ? parseInt(m[2], 10) : buf.byteLength - 1;
  if (end >= buf.byteLength) end = buf.byteLength - 1;
  if (start > end) start = 0;
  return new Response(buf.slice(start, end + 1), {
    status: 206, statusText: 'Partial Content',
    headers: {
      'Content-Type': cached.headers.get('Content-Type') || 'audio/mpeg',
      'Content-Range': `bytes ${start}-${end}/${buf.byteLength}`,
      'Content-Length': String(end - start + 1),
    },
  });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Tipografías de Google: se guardan la primera vez y después salen de la caché.
  if (FONT_HOSTS.includes(url.hostname)) {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(req);
      const net = fetch(req).then(res => { if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()); return res; }).catch(() => null);
      return hit || (await net) || Response.error();
    })());
    return;
  }

  // Todo lo demás que no sea de este mismo sitio (PeerJS, etc.) pasa directo a internet.
  if (url.origin !== self.location.origin) return;

  const key = keyFor(url);
  const isCode = req.mode === 'navigate' || /\.(html|js|css|json)$/.test(url.pathname) || url.pathname.endsWith('/');
  const isMedia = req.destination === 'audio' || req.destination === 'video' || /\.(mp3|ogg|wav|m4a)$/.test(url.pathname);

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);

    if (isMedia) {
      let cached = await cache.match(key);
      if (!cached) {
        try { const full = await fetch(key); if (full && full.ok) { await cache.put(key, full.clone()); cached = full; } } catch (err) { /* sin conexión */ }
      }
      if (cached) return req.headers.get('range') ? rangeFrom(req, cached) : cached;
      return fetch(req);
    }

    if (isCode) {
      // Con internet: siempre la versión más nueva. Sin internet: la guardada.
      try {
        const res = await fetch(req);
        if (res && res.ok) cache.put(key, res.clone());
        return res;
      } catch (err) {
        const hit = (await cache.match(key)) || (req.mode === 'navigate' ? await cache.match(keyFor(new URL('index.html', self.registration.scope))) : null);
        if (hit) return hit;
        throw err;
      }
    }

    // Imágenes y demás: de la caché si existe; si no, de internet y se guarda.
    const hit = await cache.match(key);
    if (hit) return hit;
    const res = await fetch(req);
    if (res && res.ok) cache.put(key, res.clone());
    return res;
  })());
});
