// pwa.jsx — install, standalone detection, service worker + reminder bridge.

function dtIsStandalone() {
  try {
    if (window.navigator.standalone === true) return true;      // iOS home-screen app
    // A display-mode media query can be inherited from an embedding host,
    // so only trust it in a top-level window.
    if (window.self !== window.top) return false;
    return window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches;
  } catch (e) { return false; }
}

function dtIsIOS() {
  const ua = navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function dtRegisterSW() {
  if (!('serviceWorker' in navigator)) return Promise.resolve(null);
  return navigator.serviceWorker.register('sw.js').catch(() => null);
}

// Push the reminder config into the service worker + ask for background sync.
function dtSyncReminders(reminders) {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.ready.then(async reg => {
    const target = reg.active || navigator.serviceWorker.controller;
    if (target) target.postMessage({ type: 'set-reminders', reminders });
    try {
      if (reg.periodicSync && reminders.on) {
        const st = await navigator.permissions.query({ name: 'periodic-background-sync' }).catch(() => null);
        if (!st || st.state === 'granted') {
          await reg.periodicSync.register('dt-reminders', { minInterval: 30 * 60 * 1000 });
        }
      }
    } catch (e) {}
  }).catch(() => {});
}

// Ask the SW to check whether a reminder is due (catches missed ones).
function dtCheckDue() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.ready.then(reg => {
    const target = reg.active || navigator.serviceWorker.controller;
    if (target) target.postMessage({ type: 'check' });
  }).catch(() => {});
}

function dtPostSW(msg) {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.ready.then(reg => {
    const target = reg.active || navigator.serviceWorker.controller;
    if (target) target.postMessage(msg);
  }).catch(() => {});
}

// Alarma de prueba: sale por la barra del sistema, con sonido y vibración.
function dtTestAlarm(mode) { dtPostSW({ type: 'test-alarm', mode: mode || 'morning' }); }
// Posponer 10 min incluso con la app cerrada.
function dtSnoozeBg(mode) { dtPostSW({ type: 'snooze', mode: mode || 'morning' }); }
function dtAskAlarmStatus() { dtPostSW({ type: 'alarm-status?' }); }

// ¿El navegador puede disparar alarmas programadas sin abrir la app?
function dtSupportsScheduled() {
  try { return 'showTrigger' in Notification.prototype; } catch (e) { return false; }
}

// Respaldo universal (sobre todo iPhone): un archivo de calendario con
// alarma diaria. El teléfono suena aunque la app nunca se abra.
function dtIcsText(reminders) {
  const pad = n => String(n).padStart(2, '0');
  const now = new Date();
  const stamp = now.getUTCFullYear() + pad(now.getUTCMonth() + 1) + pad(now.getUTCDate()) +
    'T' + pad(now.getUTCHours()) + pad(now.getUTCMinutes()) + pad(now.getUTCSeconds()) + 'Z';
  const day = now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate());
  const ev = (mode, hm, title, desc) => {
    const [h, m] = String(hm || '08:00').split(':').map(Number);
    return [
      'BEGIN:VEVENT',
      'UID:descubrirte-' + mode + '-' + stamp,
      'DTSTAMP:' + stamp,
      'DTSTART:' + day + 'T' + pad(h || 0) + pad(m || 0) + '00',
      'DURATION:PT10M',
      'RRULE:FREQ=DAILY',
      'SUMMARY:' + title,
      'DESCRIPTION:' + desc,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'TRIGGER:PT0S',
      'DESCRIPTION:' + title,
      'END:VALARM',
      'END:VEVENT',
    ].join('\r\n');
  };
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//DescubrirTe//ES', 'CALSCALE:GREGORIAN',
    ev('morning', reminders.morning, 'DescubrirTe — tu momento de la mañana',
      'Encontrate con vos antes de empezar el día.'),
    ev('night', reminders.night, 'DescubrirTe — tu momento de la noche',
      'Cerrá tu día escribiendo cómo te fue.'),
    'END:VCALENDAR',
  ].join('\r\n');
}

function dtDownloadIcs(reminders) {
  try {
    const blob = new Blob([dtIcsText(reminders)], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'descubrirte-recordatorios.ics';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return true;
  } catch (e) { return false; }
}

// Hook: install availability + trigger.
function useDTInstall() {
  const [promptEvent, setPromptEvent] = React.useState(null);
  const [installed, setInstalled] = React.useState(dtIsStandalone());
  React.useEffect(() => {
    const onPrompt = e => { e.preventDefault(); setPromptEvent(e); };
    const onInstalled = () => { setInstalled(true); setPromptEvent(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    const mq = window.matchMedia('(display-mode: standalone)');
    const onMode = e => setInstalled(e.matches);
    mq.addEventListener && mq.addEventListener('change', onMode);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      mq.removeEventListener && mq.removeEventListener('change', onMode);
    };
  }, []);
  const install = async () => {
    if (!promptEvent) return 'unavailable';
    promptEvent.prompt();
    const res = await promptEvent.userChoice.catch(() => ({ outcome: 'dismissed' }));
    if (res.outcome === 'accepted') setInstalled(true);
    setPromptEvent(null);
    return res.outcome;
  };  return { canInstall: !!promptEvent, installed, install, isIOS: dtIsIOS() };
}

// ── Install card for the settings sheet ────────────────────────
function DTInstallCard({ canInstall, installed, install, isIOS }) {
  const [showIOS, setShowIOS] = React.useState(false);
  if (installed) {
    return (
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '13px 15px',
        background: 'var(--soft-bg)', borderRadius: 16 }}>
        <svg width="20" height="20" viewBox="0 0 24 24"><path d="M5 13l4 4 10-11" fill="none"
          stroke="var(--primary-deep)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <div style={{ fontFamily: 'var(--f-sans)', fontSize: 13.5, color: 'var(--ink)', fontWeight: 500 }}>
          App instalada. Las alarmas funcionan en segundo plano.
        </div>
      </div>
    );
  }
  return (
    <div>
      {canInstall ? (
        <DTButton variant="soft" onClick={install}>Instalar la app</DTButton>
      ) : (
        <DTButton variant="soft" onClick={() => setShowIOS(v => !v)}>
          {isIOS ? 'Cómo instalarla en iPhone' : 'Cómo instalarla'}
        </DTButton>
      )}
      {showIOS && (
        <div style={{ marginTop: 10, padding: '14px 16px', background: 'var(--surface-2)',
          border: '1px solid var(--line)', borderRadius: 16 }}>
          <ol style={{ margin: 0, paddingLeft: 18, fontFamily: 'var(--f-sans)', fontSize: 13,
            color: 'var(--ink)', lineHeight: 1.75 }}>
            {isIOS ? (
              <>
                <li>Abrí esta página en Safari.</li>
                <li>Tocá el botón <strong>Compartir</strong>.</li>
                <li>Elegí <strong>Añadir a pantalla de inicio</strong>.</li>
                <li>Abrila desde el ícono y activá el recordatorio.</li>
              </>
            ) : (
              <>
                <li>Abrí el menú del navegador (⋮).</li>
                <li>Elegí <strong>Instalar app</strong> o <strong>Añadir a pantalla de inicio</strong>.</li>
                <li>Abrila desde el ícono y activá el recordatorio.</li>
              </>
            )}
          </ol>
        </div>
      )}
    </div>
  );
}

Object.assign(window, {
  dtIsStandalone, dtIsIOS, dtRegisterSW, dtSyncReminders, dtCheckDue, dtPostSW,
  dtTestAlarm, dtSnoozeBg, dtAskAlarmStatus, dtSupportsScheduled, dtIcsText, dtDownloadIcs,
  useDTInstall, DTInstallCard,
});
