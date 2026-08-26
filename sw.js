/* sw.js — DescubrirTe service worker: offline shell + daily reminders. */
const CACHE = 'descubrirte-v4';
const CFG = '__dt_reminders__';

const LOCAL = [
  './', './index.html', './DescubrirTe.html', './manifest.webmanifest',
  './tweaks-panel.jsx', './frames/ios-frame.jsx', './frames/android-frame.jsx',
  './app/brand.jsx', './app/analysis.jsx', './app/storage.jsx', './app/ui.jsx',
  './app/pwa.jsx', './app/reminders.jsx', './app/export.jsx', './app/checkin.jsx',
  './app/program.jsx', './app/exercise.jsx',
  './app/patterns.jsx', './app/screens.jsx', './app/app.jsx',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png', './icons/badge-96.png',
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
  opportunisticCheck(e);
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

// Opciones de alarma: suena y vibra como una alerta del sistema.
function alarmOpts(mode, extra) {
  const c = COPY[mode] || COPY.morning;
  return Object.assign({
    body: c.body,
    tag: 'dt-' + mode,
    icon: './icons/icon-192.png',
    badge: './icons/badge-96.png',
    requireInteraction: true,
    renotify: true,
    silent: false,
    vibrate: [0, 350, 180, 350, 180, 600],
    data: { mode },
    actions: [{ action: 'write', title: 'Escribir ahora' },
              { action: 'snooze', title: 'En 10 min' }],
  }, extra || {});
}

/* ── Notification Triggers: alarmas programadas sin servidor ──
   Donde el navegador lo soporta (Chrome/Android con la app instalada),
   el sistema muestra la notificación a la hora exacta aunque la app
   nunca se haya abierto ese día. */
const TRIGGERS_OK = (() => {
  try { return 'showTrigger' in Notification.prototype && typeof TimestampTrigger === 'function'; }
  catch (e) { return false; }
})();

async function clearScheduled() {
  try {
    const list = await self.registration.getNotifications({ includeTriggered: true });
    list.forEach(n => { if (n.data && n.data.scheduled) n.close(); });
  } catch (e) {}
}

async function scheduleAhead(cfg, days) {
  if (!TRIGGERS_OK || !cfg || !cfg.on) { await clearScheduled(); return 0; }
  await clearScheduled();
  const now = Date.now();
  let n = 0;
  for (let d = 0; d < (days || 21); d++) {
    for (const mode of ['morning', 'night']) {
      const base = new Date(); base.setDate(base.getDate() + d);
      const when = hmToday(cfg[mode], base).getTime();
      if (when <= now + 15000) continue;
      try {
        await self.registration.showNotification(COPY[mode].title, alarmOpts(mode, {
          tag: 'dt-sched-' + mode + '-' + d,
          showTrigger: new TimestampTrigger(when),
          data: { mode, scheduled: true },
        }));
        n++;
      } catch (e) {}
    }
  }
  return n;
}

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
      await self.registration.showNotification(COPY[mode].title, alarmOpts(mode));
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
      const cfg = { ...prev, ...d.reminders, fired: prev.fired || {} };
      await writeCfg(cfg);
      await checkDue();
      const count = await scheduleAhead(cfg, 21);
      reply(e, { type: 'alarm-status', triggers: TRIGGERS_OK, scheduled: count });
    })());
  } else if (d.type === 'check') {
    e.waitUntil((async () => {
      await checkDue();
      const cfg = await readCfg();
      if (cfg && cfg.on) await scheduleAhead(cfg, 21);
    })());
  } else if (d.type === 'test-alarm') {
    e.waitUntil(self.registration.showNotification(
      (COPY[d.mode] || COPY.morning).title, alarmOpts(d.mode || 'morning', { body: 'Así va a sonar tu recordatorio.' })));
  } else if (d.type === 'snooze') {
    e.waitUntil((async () => {
      const mode = d.mode || 'morning';
      const when = Date.now() + 10 * 60 * 1000;
      if (TRIGGERS_OK) {
        try {
          await self.registration.showNotification(COPY[mode].title, alarmOpts(mode, {
            tag: 'dt-snooze-' + mode, showTrigger: new TimestampTrigger(when),
            body: 'Volví cuando puedas. Este es tu momento.',
          }));
        } catch (err) {}
      }
    })());
  } else if (d.type === 'alarm-status?') {
    e.waitUntil((async () => {
      const list = await self.registration.getNotifications({ includeTriggered: true }).catch(() => []);
      reply(e, { type: 'alarm-status', triggers: TRIGGERS_OK,
        scheduled: list.filter(n => n.data && n.data.scheduled).length });
    })());
  }
});

function reply(e, msg) {
  try { if (e.source && e.source.postMessage) { e.source.postMessage(msg); return; } } catch (err) {}
  self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    .then(all => all.forEach(c => c.postMessage(msg))).catch(() => {});
}

/* Chequeo oportunista: cada vez que el SW despierta por cualquier motivo
   (una pestaña, una sincronización, un fetch) revisa si una alarma venció. */
let lastCheck = 0;
function opportunisticCheck(e) {
  const now = Date.now();
  if (now - lastCheck < 4 * 60 * 1000) return;
  lastCheck = now;
  e.waitUntil(checkDue().catch(() => {}));
}

self.addEventListener('periodicsync', e => {
  if (e.tag === 'dt-reminders') e.waitUntil((async () => {
    await checkDue();
    const cfg = await readCfg();
    if (cfg && cfg.on) await scheduleAhead(cfg, 21);
  })());
});

self.addEventListener('sync', e => {
  if (e.tag === 'dt-reminders') e.waitUntil(checkDue());
});

self.addEventListener('push', e => {
  let payload = { mode: 'morning' };
  try { if (e.data) payload = e.data.json(); } catch (err) {}
  const c = COPY[payload.mode] || COPY.morning;
  e.waitUntil(self.registration.showNotification(c.title, {
    body: c.body, icon: './icons/icon-192.png', badge: './icons/badge-96.png',
    tag: 'dt-' + payload.mode, data: { mode: payload.mode },
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const mode = (e.notification.data && e.notification.data.mode) || 'morning';
  if (e.action === 'snooze') {
    e.waitUntil((async () => {
      if (!TRIGGERS_OK) return;
      try {
        await self.registration.showNotification(COPY[mode].title, alarmOpts(mode, {
          tag: 'dt-snooze-' + mode,
          showTrigger: new TimestampTrigger(Date.now() + 10 * 60 * 1000),
          body: 'Volví cuando puedas. Este es tu momento.',
        }));
      } catch (err) {}
    })());
    return;
  }
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
