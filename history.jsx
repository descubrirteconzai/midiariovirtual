// history.jsx — semanas anteriores: se guardan al reiniciar, solo lectura y con resumen descargable.

const DT_ARCHIVE_KEY = 'dt21_archive_v1';

function dtLoadArchive() {
  try { const a = JSON.parse(localStorage.getItem(DT_ARCHIVE_KEY) || '[]'); return Array.isArray(a) ? a : []; }
  catch (e) { return []; }
}
function dtSaveArchive(list) {
  try { localStorage.setItem(DT_ARCHIVE_KEY, JSON.stringify(list)); } catch (e) {}
}
function dtHasWriting(state) {
  return Object.values(state.entries || {}).some(e => e && (e.morning || e.night || e.exercise));
}
// Congela el viaje actual (copia profunda) y lo suma al archivo. La demo no se guarda.
function dtArchiveJourney(state) {
  const list = dtLoadArchive();
  if (!dtHasWriting(state) || state.usedDemo) return list;
  const snap = JSON.parse(JSON.stringify({
    startDate: state.startDate, endDate: new Date().toISOString(), name: state.name || '',
    cycleLength: state.cycleLength || 7, currentDay: state.currentDay, entries: state.entries || {}, dayDates: state.dayDates || {},
  }));
  snap.id = 'w' + Date.now();
  const next = [...list, snap];
  dtSaveArchive(next);
  return next;
}

function dtPastRange(p) {
  const keys = Object.values(p.dayDates || {}).filter(Boolean).sort();
  const a = keys.length ? new Date(keys[0] + 'T12:00:00') : new Date(p.startDate);
  const b = keys.length ? new Date(keys[keys.length - 1] + 'T12:00:00') : new Date(p.endDate);
  const f = (d, m) => d.toLocaleDateString('es', m ? { day: 'numeric', month: 'short' } : { day: 'numeric' });
  if (a.toDateString() === b.toDateString()) return f(a, true);
  return (a.getMonth() === b.getMonth() ? f(a) : f(a, true)) + ' al ' + f(b, true);
}
function dtPastDays(p) {
  return Object.keys(p.entries || {}).map(Number).filter(d => { const e = p.entries[d]; return e && (e.morning || e.night || e.exercise); }).sort((x, y) => x - y);
}

// Lista para Mi perfil
function DTPastList({ archive, onOpen }) {
  if (!archive.length) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
      {archive.map((p, i) => ({ p, i })).reverse().map(({ p, i }) => (
        <button key={p.id} onClick={() => onOpen(p.id)} className="dt-press" style={{ ...dtPfCard, display: 'flex',
          alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left', width: '100%', minHeight: 64 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--f-serif)', fontSize: 19, fontWeight: 600, color: 'var(--ink)' }}>Semana {i + 1}</div>
            <div style={{ fontFamily: 'var(--f-sans)', fontSize: 13, color: 'var(--ink-soft)', marginTop: 2 }}>
              {dtPastRange(p)} · {dtPastDays(p).length} {dtPastDays(p).length === 1 ? 'día escrito' : 'días escritos'}
            </div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ink-soft)" strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6" /></svg>
        </button>
      ))}
    </div>
  );
}

// Contenido de la hoja de lectura de una semana pasada
function DTPastRead({ past, onDownload }) {
  const days = dtPastDays(past);
  const dateOf = d => past.dayDates && past.dayDates[d]
    ? new Date(past.dayDates[d] + 'T12:00:00').toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' }) : '';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{ fontFamily: 'var(--f-sans)', fontSize: 14, color: 'var(--ink-soft)', margin: 0 }}>
          {dtPastRange(past)} · {days.length} {days.length === 1 ? 'día escrito' : 'días escritos'}
        </p>
        <DTButton onClick={onDownload}>Descargar resumen</DTButton>
      </div>
      {days.map(d => (
        <div key={d}>
          <DTEyebrow style={{ marginBottom: 4 }}>Día {d}</DTEyebrow>
          {dateOf(d) && <div style={{ fontFamily: 'var(--f-sans)', fontSize: 13, color: 'var(--ink-faint)', marginBottom: 12 }}>{dateOf(d)}</div>}
          <DTDayDetail state={past} day={d} readOnly />
        </div>
      ))}
      <p style={{ fontFamily: 'var(--f-sans)', fontSize: 13, color: 'var(--ink-faint)', textAlign: 'center', margin: 0 }}>
        Solo lectura. Lo que escribiste queda tal como lo sentiste.
      </p>
    </div>
  );
}

Object.assign(window, { dtLoadArchive, dtSaveArchive, dtArchiveJourney, dtPastRange, dtPastDays, DTPastList, DTPastRead });
