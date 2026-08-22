// reminders.jsx — daily alarm scheduling + in-app alarm.

function dtDefaultReminders() {
  return { on: false, morning: '08:00', night: '22:00' };
}

function dtParseHM(s) {
  const [h, m] = String(s || '08:00').split(':').map(Number);
  return { h: h || 0, m: m || 0 };
}

function dtNextOccurrence(hm) {
  const { h, m } = dtParseHM(hm);
  const now = new Date();
  const t = new Date(now);
  t.setHours(h, m, 0, 0);
  if (t <= now) t.setDate(t.getDate() + 1);
  return t;
}

function dtTimeLabel(hm) {
  const { h, m } = dtParseHM(hm);
  const d = new Date(); d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
}

// Soft two-note chime (WebAudio, no asset).
function dtChime() {
  try { if (navigator.vibrate) navigator.vibrate([0, 120, 90, 120]); } catch (e) {}
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ac = new AC();
    [[880, 0], [1174.7, 0.26]].forEach(([f, at]) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine'; o.frequency.value = f;
      o.connect(g); g.connect(ac.destination);
      const t0 = ac.currentTime + at;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.16, t0 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0008, t0 + 1.5);
      o.start(t0); o.stop(t0 + 1.6);
    });
    setTimeout(() => ac.close && ac.close(), 2600);
  } catch (e) {}
}

async function dtAskNotify() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  try { return await Notification.requestPermission(); } catch (e) { return 'denied'; }
}

function dtNotify(title, body, mode) {
  // Prefer the service worker: su notificación queda en la barra del sistema
  // y sobrevive aunque la app se cierre.
  try {
    if ('serviceWorker' in navigator && Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, {
          body, tag: 'dt-' + (mode || 'now'),
          icon: 'icons/icon-192.png', badge: 'icons/badge-96.png',
          requireInteraction: true, data: { mode },
        });
      }).catch(() => {});
      return true;
    }
  } catch (e) {}
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, tag: 'descubrirte', icon: 'icons/icon-192.png' });
      return true;
    }
  } catch (e) {}
  return false;
}

// Hook: schedules both alarms while the app is open; fires onFire(mode).
function useDTReminders(reminders, onFire) {
  const timers = React.useRef([]);
  React.useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (!reminders || !reminders.on) return;
    const schedule = (mode, hm) => {
      const ms = dtNextOccurrence(hm) - new Date();
      if (ms < 0 || ms > 2147483000) return;
      timers.current.push(setTimeout(() => { onFire(mode); schedule(mode, hm); }, ms));
    };
    schedule('morning', reminders.morning);
    schedule('night', reminders.night);
    return () => { timers.current.forEach(clearTimeout); timers.current = []; };
  }, [reminders && reminders.on, reminders && reminders.morning, reminders && reminders.night]);
}

// ── Time picker row ────────────────────────────────────────────
function DTTimeRow({ label, sub, value, onChange, disabled }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
      background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 16,
      opacity: disabled ? 0.45 : 1, transition: 'opacity .2s' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--f-sans)', fontSize: 14.5, fontWeight: 600, color: 'var(--ink)' }}>{label}</div>
        <div style={{ fontFamily: 'var(--f-sans)', fontSize: 12, color: 'var(--ink-faint)' }}>{sub}</div>
      </div>
      <input type="time" value={value} disabled={disabled}
        onChange={e => onChange(e.target.value)}
        style={{ border: '1px solid var(--line)', borderRadius: 12, padding: '9px 10px',
          fontFamily: 'var(--f-sans)', fontSize: 15, fontWeight: 600, color: 'var(--ink)',
          background: 'var(--surface)', outline: 'none' }} />
    </div>
  );
}

// ── Toggle ─────────────────────────────────────────────────────
function DTToggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)} className="dt-tap"
      style={{ width: 50, height: 29, borderRadius: 99, border: 'none', cursor: 'pointer',
        background: on ? 'var(--primary)' : 'var(--line)', position: 'relative',
        transition: 'background .2s', flexShrink: 0 }}>
      <span style={{ position: 'absolute', top: 3, left: on ? 24 : 3, width: 23, height: 23,
        borderRadius: 99, background: '#fff', transition: 'left .2s cubic-bezier(.22,1,.36,1)',
        boxShadow: '0 2px 6px rgba(0,0,0,.18)' }} />
    </button>
  );
}

// ── In-app alarm overlay ───────────────────────────────────────
function DTAlarm({ mode, onWrite, onSnooze, onClose, name }) {
  if (!mode) return null;
  const isM = mode === 'morning';
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 120, background: 'rgba(60,65,96,.42)',
      backdropFilter: 'blur(3px)', display: 'grid', placeItems: 'center', padding: 28,
      animation: 'dtFade .22s ease' }}>
      <div style={{ background: 'var(--surface)', borderRadius: 28, padding: '30px 26px 24px',
        width: '100%', textAlign: 'center', animation: 'dtUp .3s cubic-bezier(.22,1,.36,1)',
        boxShadow: '0 30px 70px -30px rgba(40,44,70,.7)' }}>
        <div style={{ width: 62, height: 62, borderRadius: 99, margin: '0 auto 16px',
          background: isM ? 'var(--soft-bg)' : 'var(--ink)', display: 'grid', placeItems: 'center' }}>
          {isM ? (
            <svg width="30" height="30" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.5" fill="none" stroke="var(--primary)" strokeWidth="2" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" /></svg>
          ) : (
            <svg width="30" height="30" viewBox="0 0 24 24"><path d="M20 14.5A7.5 7.5 0 1 1 10.5 4 6 6 0 0 0 20 14.5z" fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round" /></svg>
          )}
        </div>
        <div style={{ fontFamily: 'var(--f-script)', fontSize: 34, color: 'var(--ink)', lineHeight: 1 }}>
          {isM ? 'Buenos días' : 'Buenas noches'}{name ? `, ${name}` : ''}
        </div>
        <p style={{ fontFamily: 'var(--f-serif)', fontStyle: 'italic', fontSize: 19, color: 'var(--ink-soft)',
          margin: '12px 0 22px', lineHeight: 1.4, textWrap: 'pretty' }}>
          {isM ? 'Es tu momento. ¿Cómo llegás hoy?' : 'Cerremos el día juntas. ¿Cómo te fue?'}
        </p>
        <DTButton onClick={onWrite} variant={isM ? 'primary' : 'ink'}>Escribir ahora</DTButton>
        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          <DTButton onClick={onSnooze} variant="ghost" style={{ fontSize: 14 }}>En 10 min</DTButton>
          <DTButton onClick={onClose} variant="ghost" style={{ fontSize: 14 }}>Cerrar</DTButton>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  dtDefaultReminders, dtNextOccurrence, dtTimeLabel, dtChime, dtAskNotify, dtNotify,
  useDTReminders, DTTimeRow, DTToggle, DTAlarm,
});
