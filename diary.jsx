// diary.jsx — "Mi diario": calendario de solo lectura + desbloqueo diario.

// Fecha (YYYY-MM-DD) en la que se escribió cada día del programa.
function dtDayDate(state, d) {
  if (state.dayDates && state.dayDates[d]) return state.dayDates[d];
  if (!state.entries[d]) return null;
  const s = new Date(state.startDate || Date.now());
  s.setDate(s.getDate() + d - 1);
  return dtLocalKey(s);
}
function dtDaysByDate(state) {
  const map = {};
  for (let d = 1; d <= state.cycleLength; d++) {
    const k = dtDayDate(state, d);
    if (k && state.entries[d]) (map[k] = map[k] || []).push(d);
  }
  return map;
}
// El día siguiente se abre recién cuando empieza una nueva fecha.
function dtAdvanceDay(s) {
  const k = s.dayDates && s.dayDates[s.currentDay];
  if (k && k < dtLocalKey() && s.currentDay < s.cycleLength) return { ...s, currentDay: s.currentDay + 1 };
  return s;
}

const DT_WEEK = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const DT_DOT = { morning: 'var(--primary)', exercise: 'var(--soft)', night: 'var(--ink)' };

function DTDiary({ state, decor, onOpenDate }) {
  const today = dtLocalKey();
  const [cur, setCur] = React.useState(() => { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() }; });
  const byDate = dtDaysByDate(state);
  const first = new Date(cur.y, cur.m, 1);
  const lead = (first.getDay() + 6) % 7;
  const count = new Date(cur.y, cur.m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= count; d++) cells.push(d);
  const title = first.toLocaleDateString('es', { month: 'long', year: 'numeric' }).replace(' de ', ' ');
  const go = (n) => setCur(c => { const x = new Date(c.y, c.m + n, 1); return { y: x.getFullYear(), m: x.getMonth() }; });
  const navBtn = { width: 44, height: 44, borderRadius: 99, border: '1px solid var(--line)', background: 'var(--surface)',
    cursor: 'pointer', display: 'grid', placeItems: 'center', color: 'var(--ink)' };

  return (
    <div style={{ position: 'relative', minHeight: '100%', background: 'var(--bg)', overflow: 'hidden' }}>
      <DTDecor mode={decor} />
      <div style={{ position: 'relative', zIndex: 1, padding: 'calc(var(--sbar, 54px) + 16px) 22px 30px' }}>
        <DTEyebrow>Mi diario</DTEyebrow>
        <h1 style={{ fontFamily: 'var(--f-script)', fontSize: 44, color: 'var(--ink)', margin: '6px 0 4px', lineHeight: 1 }}>
          Todo lo que escribiste
        </h1>
        <p style={{ fontFamily: 'var(--f-sans)', fontSize: 14, color: 'var(--ink-soft)', margin: '0 0 22px' }}>
          Tocá un día marcado para releerte.
        </p>
        <div style={{ background: 'var(--surface)', borderRadius: 24, padding: '14px 12px 18px',
          boxShadow: '0 14px 34px -22px rgba(76,82,112,.45)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px 12px' }}>
            <button onClick={() => go(-1)} className="dt-tap" style={navBtn} aria-label="Mes anterior">
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <div style={{ fontFamily: 'var(--f-serif)', fontStyle: 'italic', fontSize: 21, color: 'var(--ink)', textTransform: 'capitalize' }}>{title}</div>
            <button onClick={() => go(1)} className="dt-tap" style={navBtn} aria-label="Mes siguiente">
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0,1fr))', rowGap: 4 }}>
            {DT_WEEK.map((w, i) => (
              <div key={i} style={{ textAlign: 'center', fontFamily: 'var(--f-sans)', fontSize: 11, fontWeight: 600,
                color: 'var(--ink-faint)', padding: '4px 0 8px' }}>{w}</div>
            ))}
            {cells.map((d, i) => {
              if (!d) return <div key={i} />;
              const key = dtLocalKey(new Date(cur.y, cur.m, d));
              const days = byDate[key];
              const isToday = key === today;
              const future = key > today;
              const marks = { morning: false, exercise: false, night: false };
              (days || []).forEach(n => { const e = state.entries[n] || {};
                if (e.morning) marks.morning = true; if (e.exercise) marks.exercise = true; if (e.night) marks.night = true; });
              return (
                <button key={i} disabled={!days} onClick={() => days && onOpenDate(key, days)}
                  className={days ? 'dt-press' : ''}
                  style={{ height: 44, margin: '0 auto', width: '100%', maxWidth: 44, borderRadius: 13,
                    border: isToday ? '1.5px solid var(--primary)' : '1.5px solid transparent',
                    background: isToday ? 'var(--soft-bg)' : days ? 'var(--surface-2)' : 'transparent',
                    cursor: days ? 'pointer' : 'default', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 3, padding: 0 }}>
                  <span style={{ fontFamily: 'var(--f-sans)', fontSize: 15, fontWeight: days || isToday ? 600 : 500,
                    color: future ? 'var(--ink-faint)' : days || isToday ? 'var(--ink)' : 'var(--ink-soft)' }}>{d}</span>
                  {days && (
                    <span style={{ display: 'flex', gap: 3, height: 5 }}>
                      {['morning', 'exercise', 'night'].filter(m => marks[m]).map(m => (
                        <span key={m} style={{ width: 5, height: 5, borderRadius: 9, background: DT_DOT[m] }} />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 16,
            fontFamily: 'var(--f-sans)', fontSize: 12, color: 'var(--ink-soft)' }}>
            {[['morning', 'Mañana'], ['exercise', 'Ejercicio'], ['night', 'Noche']].map(([m, l]) => (
              <span key={m} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: 9, background: DT_DOT[m] }} />{l}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Hoja de lectura: muestra lo escrito sin opción de editar.
function DTDiaryRead({ state, days }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {days.map(d => (
        <div key={d}>
          {days.length > 1 && <DTEyebrow style={{ marginBottom: 12 }}>Día {d}</DTEyebrow>}
          <DTDayDetail state={state} day={d} readOnly />
        </div>
      ))}
      <p style={{ fontFamily: 'var(--f-sans)', fontSize: 13, color: 'var(--ink-faint)', textAlign: 'center', margin: 0 }}>
        Solo lectura. Lo que escribiste queda tal como lo sentiste.
      </p>
    </div>
  );
}

Object.assign(window, { dtDayDate, dtDaysByDate, dtAdvanceDay, DTDiary, DTDiaryRead });
