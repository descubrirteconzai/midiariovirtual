// profile.jsx — "Mi perfil" sheet: nombre, fecha, zona horaria, alarmas, paleta, app, viaje.

function dtLocalKey(d) {
  const x = d || new Date();
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
}
function dtMinusHours(hm, h) {
  const [H, M] = String(hm || '22:00').split(':').map(Number);
  let t = ((H || 0) - (h || 0)) % 24; if (t < 0) t += 24;
  return String(t).padStart(2, '0') + ':' + String(M || 0).padStart(2, '0');
}
function dtExerciseSlots(r) {
  return [
    { key: 'ex1', hm: r.exNoon || '11:00' },
    { key: 'ex2', hm: r.exSiesta || '15:00' },
    { key: 'ex3', hm: dtMinusHours(r.night, r.exBefore || 3) },
  ];
}
function dtTimeZoneInfo() {
  let tz = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
  const off = -new Date().getTimezoneOffset();
  const h = Math.trunc(off / 60), m = Math.abs(off % 60);
  const gmt = 'GMT' + (off >= 0 ? '+' : '-') + Math.abs(h) + (m ? ':' + String(m).padStart(2, '0') : '');
  return { name: tz.replace(/_/g, ' ') || 'Hora local', gmt };
}

const DT_PROFILE_ICONS = {
  user: <><circle cx="12" cy="8" r="4" /><path d="M4.5 20.5c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  globe: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.4 2.4 3.5 5.3 3.5 8.5s-1.1 6.1-3.5 8.5c-2.4-2.4-3.5-5.3-3.5-8.5S9.6 5.9 12 3.5z" /></>,
  bell: <><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></>,
  palette: <><path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.3 0 1.8-.9 1.4-1.9-.5-1.2.3-2.3 1.6-2.3h1.8c2 0 3.7-1.6 3.7-3.8 0-5-3.8-9-8.5-9z" /><circle cx="7.8" cy="11" r="1" /><circle cx="10.5" cy="7.5" r="1" /><circle cx="14.8" cy="7.8" r="1" /></>,
  phone: <><rect x="7" y="3" width="10" height="18" rx="2.5" /><path d="M11 17.5h2" /></>,
  reset: <><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" /><path d="M4.5 4v4h4" /></>,
};

function DTProfileHead({ icon, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '0 0 14px' }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)"
        strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        {DT_PROFILE_ICONS[icon]}
      </svg>
      <div style={{ fontFamily: 'var(--f-sans)', fontSize: 17, fontWeight: 600, color: 'var(--ink)' }}>{children}</div>
    </div>
  );
}

const dtPfField = { width: '100%', boxSizing: 'border-box', minHeight: 58, border: '1px solid var(--soft-bg)',
  borderRadius: 18, padding: '0 18px', fontFamily: 'var(--f-sans)', fontSize: 17, color: 'var(--ink-soft)',
  background: 'var(--surface-2)', outline: 'none', display: 'flex', alignItems: 'center', position: 'relative' };
const dtPfCard = { padding: '14px 18px', background: 'var(--surface-2)', border: '1px solid var(--soft-bg)', borderRadius: 18 };
const dtPfTime = { border: '1px solid var(--line)', borderRadius: 14, padding: '10px 12px',
  fontFamily: 'var(--f-sans)', fontSize: 17, fontWeight: 600, color: 'var(--ink-soft)',
  background: 'var(--surface)', outline: 'none', minHeight: 46 };
const dtPfSection = { marginTop: 30 };

function DTPfTimeCard({ label, sub, value, onChange, disabled }) {
  return (
    <div style={{ ...dtPfCard, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--f-sans)', fontSize: 16, fontWeight: 600, color: 'var(--ink-soft)' }}>{label}</div>
        <div style={{ fontFamily: 'var(--f-sans)', fontSize: 13, color: 'var(--ink-faint)', marginTop: 2 }}>{sub}</div>
      </div>
      <input type="time" value={value} disabled={disabled} onChange={e => onChange(e.target.value)} style={dtPfTime} />
    </div>
  );
}

function DTProfileSheet({ open, onClose, state, setName, setStartDate, reminders, setReminders, toggleReminders,
  notifyState, setNotifyState, alarmStatus, paletteKey, setPalette, inst, onReset }) {
  if (!open) return null;
  const off = !reminders.on;
  const tz = dtTimeZoneInfo();
  const start = state.startDate ? new Date(state.startDate) : new Date();
  const startLabel = start.toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });
  const exOn = reminders.exOn !== false;
  const before = reminders.exBefore || 3;
  const afternoon = dtMinusHours(reminders.night, before);
  const dim = { opacity: off ? 0.5 : 1, transition: 'opacity .2s', pointerEvents: off ? 'none' : 'auto' };
  const scheduled = alarmStatus.scheduled > 0;
  const rowLabel = { flex: 1, fontFamily: 'var(--f-sans)', fontSize: 16, color: 'var(--ink-soft)' };

  return (
    <DTSheet open={open} onClose={onClose}>
      <h3 style={{ fontFamily: 'var(--f-serif)', fontSize: 32, fontWeight: 500, color: 'var(--ink)', margin: '4px 0 22px' }}>Mi perfil</h3>

      <DTProfileHead icon="user">Tu nombre</DTProfileHead>
      <input value={state.name || ''} onChange={e => setName(e.target.value)}
        placeholder="¿Cómo querés que te llame?" style={dtPfField} />

      <div style={dtPfSection}>
        <DTProfileHead icon="calendar">Fecha de inicio</DTProfileHead>
        <label style={dtPfField}>
          {startLabel}
          <input type="date" value={dtLocalKey(start)}
            onChange={e => { if (e.target.value) setStartDate(new Date(e.target.value + 'T12:00:00').toISOString()); }}
            style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', cursor: 'pointer' }} />
        </label>
      </div>

      <div style={dtPfSection}>
        <DTProfileHead icon="globe">Zona horaria</DTProfileHead>
        <div style={{ ...dtPfField, justifyContent: 'space-between', gap: 12 }}>
          <span>{tz.name}</span><span>{tz.gmt}</span>
        </div>
        <p style={{ fontFamily: 'var(--f-sans)', fontSize: 14, color: 'var(--ink-soft)', margin: '10px 4px 0', lineHeight: 1.45 }}>
          Se toma sola de tu teléfono: las alarmas suenan a tu hora.
        </p>
      </div>

      <div style={dtPfSection}>
        <DTProfileHead icon="bell">Notificaciones</DTProfileHead>
        <div style={{ ...dtPfCard, display: 'flex', alignItems: 'center', gap: 12, padding: '18px 20px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--f-sans)', fontSize: 17, fontWeight: 600, color: 'var(--ink)' }}>
              {off ? 'Desactivadas' : 'Activadas'}
            </div>
            <div style={{ fontFamily: 'var(--f-sans)', fontSize: 14, color: 'var(--ink-soft)', marginTop: 2 }}>
              {off ? 'Activalas para no olvidarte' : 'Te aviso en tus horarios'}
            </div>
          </div>
          <DTToggle on={reminders.on} onChange={toggleReminders} />
        </div>
        {!off && notifyState === 'denied' && (
          <p style={{ fontFamily: 'var(--f-sans)', fontSize: 13, color: 'var(--primary-deep)', margin: '10px 4px 0', lineHeight: 1.45 }}>
            Las notificaciones están bloqueadas. Activalas en los ajustes del teléfono para que la alarma suene con la app cerrada.
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14, ...dim }}>
          <DTPfTimeCard label="Mañana" sub="Encontrate con vos" value={reminders.morning}
            disabled={off} onChange={v => setReminders({ morning: v })} />

          <div style={{ ...dtPfCard, padding: '16px 20px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--f-sans)', fontSize: 16, fontWeight: 600, color: 'var(--ink-soft)' }}>Ejercicio del día</div>
                <div style={{ fontFamily: 'var(--f-sans)', fontSize: 13, color: 'var(--ink-faint)', marginTop: 2 }}>
                  3 avisos, solo si todavía no lo hiciste
                </div>
              </div>
              <DTToggle on={exOn} onChange={v => setReminders({ exOn: v })} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14,
              opacity: exOn ? 1 : 0.5, pointerEvents: exOn ? 'auto' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={rowLabel}>Antes del mediodía</span>
                <input type="time" value={reminders.exNoon || '11:00'} disabled={off || !exOn}
                  onChange={e => setReminders({ exNoon: e.target.value })} style={dtPfTime} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={rowLabel}>A la siesta</span>
                <input type="time" value={reminders.exSiesta || '15:00'} disabled={off || !exOn}
                  onChange={e => setReminders({ exSiesta: e.target.value })} style={dtPfTime} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 30 }}>
                <span style={rowLabel}>Por la tarde</span>
                <span style={{ fontFamily: 'var(--f-sans)', fontSize: 17, fontWeight: 600, color: 'var(--ink-soft)' }}>{afternoon}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 10 }}>
                {[2, 3, 4].map(h => {
                  const sel = before === h;
                  return (
                    <button key={h} onClick={() => setReminders({ exBefore: h })} className="dt-press"
                      style={{ minHeight: 48, borderRadius: 14, cursor: 'pointer', fontFamily: 'var(--f-sans)',
                        fontSize: 15, fontWeight: sel ? 600 : 500, color: 'var(--ink-soft)',
                        border: '1.5px solid ' + (sel ? 'var(--primary)' : 'var(--line)'),
                        background: sel ? 'var(--soft-bg)' : 'var(--surface)' }}>{h} h antes</button>
                  );
                })}
              </div>
              <div style={{ fontFamily: 'var(--f-sans)', fontSize: 13.5, color: 'var(--ink-faint)' }}>
                Antes de tu alarma de la noche ({reminders.night}).
              </div>
            </div>
          </div>

          <DTPfTimeCard label="Noche" sub="Cerrá tu día" value={reminders.night}
            disabled={off} onChange={v => setReminders({ night: v })} />

          <div style={{ ...dtPfCard, padding: '16px 20px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, flexShrink: 0,
                background: scheduled ? 'var(--primary)' : 'var(--ink-faint)' }} />
              <div style={{ fontFamily: 'var(--f-sans)', fontSize: 15, fontWeight: 600, color: 'var(--ink-soft)' }}>
                {scheduled ? 'Alarmas programadas en el teléfono' : 'Alarma con la app cerrada'}
              </div>
            </div>
            <p style={{ fontFamily: 'var(--f-sans)', fontSize: 13.5, color: 'var(--ink-faint)', margin: '8px 0 0', lineHeight: 1.5 }}>
              {scheduled
                ? `Las próximas ${alarmStatus.scheduled} alarmas ya están agendadas: suenan solas, sin abrir la app.`
                : 'Suenan en la barra de notificaciones. Si tu teléfono duerme la app, sumalas también a tu calendario y no fallan nunca.'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
              <DTButton variant="soft" style={{ fontSize: 15 }}
                onClick={async () => {
                  const res = await dtAskNotify(); setNotifyState(res);
                  if (res === 'granted') { dtTestAlarm('morning'); dtChime(); dtAskAlarmStatus(); }
                }}>Probar la alarma ahora</DTButton>
              <DTButton variant="ghost" style={{ fontSize: 15 }} onClick={() => dtDownloadIcs(reminders)}>
                Agregar a la alarma del teléfono
              </DTButton>
            </div>
          </div>
        </div>
      </div>

      <div style={dtPfSection}>
        <DTProfileHead icon="palette">Paleta de colores</DTProfileHead>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 10 }}>
          {Object.keys(DT_PALETTES).map(k => {
            const p = DT_PALETTES[k];
            const on = paletteKey === k;
            return (
              <button key={k} onClick={() => setPalette(k)} className="dt-press"
                style={{ cursor: 'pointer', borderRadius: 16, padding: '14px 6px 12px', minHeight: 80,
                  border: '1.5px solid ' + (on ? p.primary : 'var(--line)'),
                  background: on ? p.softBg : 'var(--surface)', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 10 }}>
                  {p.swatch.map(c => (
                    <span key={c} style={{ width: 15, height: 15, borderRadius: 99, background: c,
                      boxShadow: 'inset 0 0 0 1px rgba(76,82,112,.12)' }} />
                  ))}
                </div>
                <div style={{ fontFamily: 'var(--f-sans)', fontSize: 13.5, fontWeight: on ? 600 : 500,
                  color: 'var(--ink)', lineHeight: 1.2 }}>{p.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={dtPfSection}>
        <DTProfileHead icon="phone">La app en tu teléfono</DTProfileHead>
        <DTInstallCard canInstall={inst.canInstall} installed={inst.installed} install={inst.install} isIOS={inst.isIOS} />
      </div>

      <div style={dtPfSection}>
        <DTProfileHead icon="reset">Mi viaje</DTProfileHead>
        <DTButton variant="ghost" onClick={() => {
          if (window.confirm('¿Reiniciar tu viaje? Se borra todo lo que escribiste en este dispositivo.')) onReset();
        }}>Reiniciar mi viaje</DTButton>
      </div>

      <p style={{ fontFamily: 'var(--f-sans)', fontSize: 14, color: 'var(--ink-soft)', textAlign: 'center', margin: '26px 0 0' }}>
        Todo se guarda solo en este dispositivo.
      </p>
    </DTSheet>
  );
}

Object.assign(window, { DTProfileSheet, dtLocalKey, dtMinusHours, dtExerciseSlots, dtTimeZoneInfo });
