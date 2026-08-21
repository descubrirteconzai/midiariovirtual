/* sw.js — DescubrirTe service worker: offline shell + daily reminders. */
const CACHE = 'descubrirte-v3';
const CFG = '__dt_reminders__';

const LOCAL = [
  './', './index.html', './DescubrirTe.html', './manifest.webmanifest',
  './tweaks-panel.jsx', './frames/ios-frame.jsx', './frames/android-frame.jsx',
  './app/brand.jsx', './app/analysis.jsx', './app/storage.jsx', './app/ui.jsx',
  './app/pwa.jsx', './app/reminders.jsx', './app/export.jsx', './app/checkin.jsx',
  './app/program.jsx', './app/exercise.jsx',
  './app/patterns.jsx', './app/screens.jsx', './app/app.jsx',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
];
const REMOTE = [
  'https://unpkg.com/react@18.3.1/umd/react.development.js',
  'https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js',
  'https://unpkg.com/@babel/standalone@7.29.0/babel.min.js',
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600&family=Jost:wght@300;400;500;600&family=Parisienne&display=swap',
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.all(LOCAL.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => {})));
    await Promise.all(REMOTE.map(async u => {
      try { const r = await fetch(u, { mode: 'cors' }); if (r.ok) await c.put(u, r); } catch (err) {}
    }));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const sameOrigin = new URL(req.url).origin === location.origin;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // App files: network-first so updates land immediately; cache is the offline fallback.
    if (sameOrigin) {
      try {
        const res = await fetch(req);
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      } catch (err) {
        const hit = await cache.match(req, { ignoreSearch: true });
        if (hit) return hit;
        if (req.mode === 'navigate') {
          const shell = await cache.match('./DescubrirTe.html', { ignoreSearch: true });
          if (shell) return shell;
        }
        return new Response('Sin conexión', { status: 503, statusText: 'offline' });
      }
    }
    // Third-party libraries and fonts: cache-first, they are version-pinned.
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    } catch (err) {
      return new Response('Sin conexión', { status: 503, statusText: 'offline' });
    }
  })());
});

/* ── reminder config persisted in the cache ── */
async function readCfg() {
  try {
    const c = await caches.open(CACHE);
    const r = await c.match(CFG);
    if (!r) return null;
    return await r.json();
  } catch (e) { return null; }
}
async function writeCfg(cfg) {
  const c = await caches.open(CACHE);
  await c.put(CFG, new Response(JSON.stringify(cfg), { headers: { 'Content-Type': 'application/json' } }));
}

function todayKey(d) { return d.toISOString().slice(0, 10); }
function hmToday(hm, base) {
  const [h, m] = String(hm || '08:00').split(':').map(Number);
  const t = new Date(base);
  t.setHours(h || 0, m || 0, 0, 0);
  return t;
}

const COPY = {
  morning: { title: 'Tu momento de la mañana', body: 'Encontrate con vos antes de empezar el día.' },
  night: { title: 'Tu momento de la noche', body: 'Cerrá tu día escribiendo cómo te fue.' },
};

async function checkDue() {
  const cfg = await readCfg();
  if (!cfg || !cfg.on) return;
  const now = new Date();
  const key = todayKey(now);
  const fired = cfg.fired || {};
  let changed = false;
  for (const mode of ['morning', 'night']) {
    const when = hmToday(cfg[mode], now);
    // fire if the time has passed today and we haven't fired it yet (grace: 6h)
    if (now >= when && (now - when) < 6 * 3600 * 1000 && fired[mode] !== key) {
      await self.registration.showNotification(COPY[mode].title, {
        body: COPY[mode].body,
        tag: 'dt-' + mode,
        icon: './icons/icon-192.png',
        badge: './icons/icon-192.png',
        requireInteraction: true,
        data: { mode },
        actions: [{ action: 'write', title: 'Escribir ahora' }],
      });
      fired[mode] = key;
      changed = true;
    }
  }
  if (changed) await writeCfg({ ...cfg, fired });
}

self.addEventListener('message', e => {
  const d = e.data || {};
  if (d.type === 'set-reminders') {
    e.waitUntil((async () => {
      const prev = (await readCfg()) || {};
      await writeCfg({ ...prev, ...d.reminders, fired: prev.fired || {} });
      await checkDue();
    })());
  } else if (d.type === 'check') {
    e.waitUntil(checkDue());
  }
});

self.addEventListener('periodicsync', e => {
  if (e.tag === 'dt-reminders') e.waitUntil(checkDue());
});

self.addEventListener('sync', e => {
  if (e.tag === 'dt-reminders') e.waitUntil(checkDue());
});

self.addEventListener('push', e => {
  let payload = { mode: 'morning' };
  try { if (e.data) payload = e.data.json(); } catch (err) {}
  const c = COPY[payload.mode] || COPY.morning;
  e.waitUntil(self.registration.showNotification(c.title, {
    body: c.body, icon: './icons/icon-192.png', tag: 'dt-' + payload.mode,
    data: { mode: payload.mode },
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const mode = (e.notification.data && e.notification.data.mode) || 'morning';
  const url = './DescubrirTe.html?checkin=' + mode;
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const cl of all) {
      if (cl.url.includes('DescubrirTe.html')) {
        cl.postMessage({ type: 'open-checkin', mode });
        return cl.focus();
      }
    }
    return self.clients.openWindow(url);
  })());
});
