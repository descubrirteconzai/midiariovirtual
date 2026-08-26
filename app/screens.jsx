// screens.jsx — Welcome, Home/Today, Journey calendar, Settings, Decor.

// ── Watercolor / line decoration (no figurative SVG) ───────────
function DTDecor({ mode = 'acuarela' }) {
  if (mode === 'minimo') return null;
  if (mode === 'lineas') {
    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <svg width="100%" height="100%" viewBox="0 0 402 874" preserveAspectRatio="xMidYMid slice"
          style={{ position: 'absolute', inset: 0 }}>
          <path d="M-20 120 Q 60 90 130 120 T 280 120 T 440 120" fill="none" stroke="var(--soft)" strokeWidth="2.5" opacity="0.35" strokeLinecap="round" />
          <path d="M-20 150 Q 60 120 130 150 T 280 150 T 440 150" fill="none" stroke="var(--primary)" strokeWidth="2" opacity="0.22" strokeLinecap="round" />
          <path d="M-20 800 Q 80 770 160 800 T 320 800 T 460 800" fill="none" stroke="var(--soft)" strokeWidth="2.5" opacity="0.3" strokeLinecap="round" />
        </svg>
      </div>
    );
  }
  // acuarela — soft blurred washes
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      <div style={{ position: 'absolute', top: -90, right: -70, width: 280, height: 280, borderRadius: '50%',
        background: 'radial-gradient(circle, var(--soft) 0%, transparent 68%)', opacity: 0.5, filter: 'blur(8px)' }} />
      <div style={{ position: 'absolute', top: 120, left: -110, width: 260, height: 260, borderRadius: '50%',
        background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)', opacity: 0.22, filter: 'blur(10px)' }} />
      <div style={{ position: 'absolute', bottom: -80, right: -60, width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, var(--soft) 0%, transparent 70%)', opacity: 0.4, filter: 'blur(12px)' }} />
    </div>
  );
}

// ── Welcome / onboarding ───────────────────────────────────────
function DTWelcome({ onStart, decor }) {
  const [nameDraft, setNameDraft] = React.useState('');
  return (
    <div style={{ position: 'relative', minHeight: '100%', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <DTDecor mode={decor} />
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column',
        padding: 'calc(var(--sbar, 54px) + 66px) 30px 36px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ width: 54, height: 54, borderRadius: '50%', border: '1.5px solid var(--primary)',
            display: 'grid', placeItems: 'center', marginBottom: 26 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--primary)' }} />
          </div>
          <div style={{ fontFamily: 'var(--f-script)', fontSize: 60, color: 'var(--ink)', lineHeight: 0.95 }}>
            DescubrirTe
          </div>
          <div style={{ fontFamily: 'var(--f-sans)', fontSize: 14, letterSpacing: 3, textTransform: 'uppercase',
            color: 'var(--primary)', marginTop: 10, fontWeight: 600 }}>diario guiado</div>
          <p style={{ fontFamily: 'var(--f-serif)', fontStyle: 'italic', fontSize: 22, lineHeight: 1.4,
            color: 'var(--ink)', margin: '28px 0 0', textWrap: 'pretty' }}>
            Escribí lo que sentís cada mañana y cada noche. Al cerrar el ciclo, te muestro los
            patrones que se repiten — para que puedas medirlos y transformarlos.
          </p>
        </div>

        <div style={{ marginTop: 30 }}>
          <div style={{ fontFamily: 'var(--f-sans)', fontSize: 13, fontWeight: 600, color: 'var(--ink)',
            marginBottom: 10, letterSpacing: 0.4 }}>¿Cómo querés que te llame?</div>
          <input value={nameDraft} onChange={e => setNameDraft(e.target.value)}
            placeholder="Tu nombre" style={{ width: '100%', boxSizing: 'border-box',
              border: '1px solid var(--line)', borderRadius: 16, padding: '14px 16px',
              fontFamily: 'var(--f-sans)', fontSize: 16, color: 'var(--ink)',
              background: 'var(--surface)', outline: 'none', marginBottom: 16 }} />
          <DTButton onClick={() => onStart(nameDraft.trim())}>Comenzar mi viaje</DTButton>
          <p style={{ fontFamily: 'var(--f-sans)', fontSize: 12, color: 'var(--ink-faint)',
            textAlign: 'center', margin: '12px 0 0' }}>
            Un ciclo de 7 días. Todo se guarda solo en tu teléfono.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Home / Today ───────────────────────────────────────────────
function DTHome({ state, onOpen, onSettings, onExercise, decor }) {
  const completed = dtCompletedDays(state);
  const day = state.currentDay;
  const st = dtDayStatus(state, day);
  const hour = new Date().getHours();
  const greeting = hour < 13 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';

  const CheckRow = ({ mode, done }) => {
    const isM = mode === 'morning';
    return (
      <DTCard onClick={() => onOpen(mode)} style={{ display: 'flex', alignItems: 'center', gap: 16,
        opacity: 1, position: 'relative', overflow: 'hidden' }}>
        <div style={{ width: 46, height: 46, borderRadius: 14, flexShrink: 0, display: 'grid', placeItems: 'center',
          background: done ? 'var(--soft-bg)' : (isM ? 'var(--soft-bg)' : 'var(--ink)') }}>
          {isM ? (
            <svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.5" fill="none" stroke={done ? 'var(--primary)' : 'var(--primary)'} strokeWidth="2" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" /></svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24"><path d="M20 14.5A7.5 7.5 0 1 1 10.5 4 6 6 0 0 0 20 14.5z" fill="none" stroke={done ? 'var(--ink)' : '#fff'} strokeWidth="2" strokeLinejoin="round" /></svg>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--f-sans)', fontSize: 12, fontWeight: 600, letterSpacing: 1,
            textTransform: 'uppercase', color: 'var(--ink-faint)' }}>{isM ? 'Mañana' : 'Noche'}</div>
          <div style={{ fontFamily: 'var(--f-serif)', fontStyle: 'italic', fontSize: 19, color: 'var(--ink)', fontWeight: 600 }}>
            {done ? 'Completado' : (isM ? 'Encontrate con vos' : 'Cerrá tu día')}
          </div>
        </div>
        {done ? (
          <div style={{ width: 26, height: 26, borderRadius: 99, background: 'var(--primary)', display: 'grid', placeItems: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24"><path d="M5 13l4 4 10-11" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" fill="none" stroke="var(--ink-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        )}
      </DTCard>
    );
  };

  return (
    <div style={{ position: 'relative', minHeight: '100%', background: 'var(--bg)', overflow: 'hidden' }}>
      <DTDecor mode={decor} />
      <div style={{ position: 'relative', zIndex: 1, padding: 'calc(var(--sbar, 54px) + 12px) 22px 30px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: 'var(--f-sans)', fontSize: 13, color: 'var(--ink-soft)', letterSpacing: 0.4 }}>
              {greeting}{state.name ? '' : ''}
            </div>
            <div style={{ fontFamily: 'var(--f-script)', fontSize: 42, color: 'var(--ink)', lineHeight: 1, marginTop: 2 }}>
              {state.name || 'Hola'}
            </div>
          </div>
          <button onClick={onSettings} className="dt-tap" style={{ border: 'none', background: 'var(--surface)',
            width: 40, height: 40, borderRadius: 99, cursor: 'pointer', boxShadow: '0 6px 16px -8px rgba(76,82,112,.5)',
            display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" fill="none" stroke="var(--ink)" strokeWidth="2" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.5 4.5l2 2M17.5 17.5l2 2M19.5 4.5l-2 2M6.5 17.5l-2 2" stroke="var(--ink)" strokeWidth="1.8" strokeLinecap="round" /></svg>
          </button>
        </div>

        {/* Progress card */}
        <DTCard style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 18 }}>
          <DTRing value={completed} total={state.cycleLength} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--f-sans)', fontSize: 12, fontWeight: 600, letterSpacing: 1,
              textTransform: 'uppercase', color: 'var(--primary)' }}>Día {day} de {state.cycleLength}</div>
            <div style={{ fontFamily: 'var(--f-serif)', fontStyle: 'italic', fontSize: 21, color: 'var(--ink)',
              fontWeight: 600, lineHeight: 1.2, marginTop: 4 }}>
              {completed >= state.cycleLength ? '¡Completaste tu ciclo!' : 'Seguí descubriéndote'}
            </div>
            <div style={{ fontFamily: 'var(--f-sans)', fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>
              {completed >= state.cycleLength ? 'Tus patrones te esperan.' : `${state.cycleLength - completed} días para revelar tus patrones`}
            </div>
          </div>
        </DTCard>

        {/* Today: morning → exercise → night */}
        <div style={{ marginTop: 22, marginBottom: 10 }}>
          <DTEyebrow>Hoy</DTEyebrow>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <CheckRow mode="morning" done={st.morning} />
          {onExercise && dtProgramDay(day) && (
            <DTCard onClick={onExercise} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 46, height: 46, borderRadius: 14, flexShrink: 0, display: 'grid',
                placeItems: 'center', background: 'var(--soft-bg)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24"><path d="M5 19l1-3.5L16 5.5a2 2 0 0 1 3 3L8.5 19 5 19Z" fill="none" stroke="var(--primary)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /><path d="M14 7.5 17 10.5" fill="none" stroke="var(--primary)" strokeWidth="1.9" strokeLinecap="round" /></svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--f-sans)', fontSize: 12, fontWeight: 600, letterSpacing: 1,
                  textTransform: 'uppercase', color: 'var(--ink-faint)' }}>
                  Ejercicio del día · {dtProgramDay(day).minutes} min
                </div>
                <div style={{ fontFamily: 'var(--f-serif)', fontStyle: 'italic', fontSize: 19,
                  color: 'var(--ink)', fontWeight: 600, lineHeight: 1.2 }}>
                  {dtProgramDay(day).title}
                </div>
              </div>
              {st.exercise ? (
                <div style={{ width: 26, height: 26, borderRadius: 99, background: 'var(--primary)',
                  display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24"><path d="M5 13l4 4 10-11" fill="none"
                    stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" fill="none"
                  stroke="var(--ink-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              )}
            </DTCard>
          )}
          <CheckRow mode="night" done={st.night} />
        </div>

        {/* Daily intention quote */}
        <div style={{ marginTop: 22, padding: '4px 8px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--f-serif)', fontStyle: 'italic', fontSize: 20.5, color: 'var(--ink)',
            margin: 0, lineHeight: 1.45, textWrap: 'pretty' }}>
            “{DT_BRAND.tagline}.”
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Journey calendar ───────────────────────────────────────────
function DTJourney({ state, onOpenDay, decor }) {
  const days = [];
  for (let d = 1; d <= state.cycleLength; d++) days.push(d);
  return (
    <div style={{ position: 'relative', minHeight: '100%', background: 'var(--bg)', overflow: 'hidden' }}>
      <DTDecor mode={decor} />
      <div style={{ position: 'relative', zIndex: 1, padding: 'calc(var(--sbar, 54px) + 16px) 22px 30px' }}>
        <DTEyebrow>Mi viaje</DTEyebrow>
        <h1 style={{ fontFamily: 'var(--f-script)', fontSize: 46, color: 'var(--ink)', margin: '6px 0 4px', lineHeight: 1 }}>
          {state.cycleLength} días contigo
        </h1>
        <p style={{ fontFamily: 'var(--f-sans)', fontSize: 14, color: 'var(--ink-soft)', margin: '0 0 22px' }}>
          Tocá cualquier día para escribir o releerte.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {days.map(d => {
            const s = dtDayStatus(state, d);
            const isToday = d === state.currentDay;
            return (
              <button key={d} onClick={() => onOpenDay(d)} className="dt-press"
                style={{ aspectRatio: '1', border: isToday ? '1.5px solid var(--primary)' : '1px solid var(--line)',
                  background: s.both ? 'var(--primary)' : 'var(--surface)', borderRadius: 20, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                  position: 'relative' }}>
                <span style={{ fontFamily: 'var(--f-serif)', fontSize: 24, fontWeight: 700,
                  color: s.both ? '#fff' : 'var(--ink)' }}>{d}</span>
                <div style={{ display: 'flex', gap: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 9,
                    background: s.morning ? (s.both ? 'rgba(255,255,255,.9)' : 'var(--primary)') : 'var(--line)' }} />
                  <span style={{ width: 7, height: 7, borderRadius: 9,
                    background: s.night ? (s.both ? 'rgba(255,255,255,.9)' : 'var(--ink)') : 'var(--line)' }} />
                </div>
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 18, marginTop: 20, fontFamily: 'var(--f-sans)', fontSize: 12, color: 'var(--ink-soft)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 9, background: 'var(--primary)' }} /> Mañana</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 9, background: 'var(--ink)' }} /> Noche</span>
        </div>
      </div>
    </div>
  );
}

// ── Day detail sheet content ───────────────────────────────────
function DTDayDetail({ state, day, onCheckin, onExercise }) {
  const e = state.entries[day] || {};
  const prog = dtProgramDay(day);
  const sections = [
    { key: 'morning', label: 'Mañana', data: e.morning },
    { key: 'night', label: 'Noche', data: e.night },
  ];
  return (
    <div>
      {sections.map(sec => (
        <div key={sec.key} style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <DTEyebrow>{sec.label}</DTEyebrow>
            <button onClick={() => onCheckin(sec.key)} className="dt-tap" style={{ border: 'none', background: 'var(--soft-bg)',
              borderRadius: 99, padding: '6px 14px', cursor: 'pointer', fontFamily: 'var(--f-sans)', fontSize: 12.5,
              fontWeight: 600, color: 'var(--ink)' }}>
              {sec.data ? 'Editar' : 'Escribir'}
            </button>
          </div>
          {sec.data ? (
            <div style={{ background: 'var(--surface-2)', borderRadius: 16, padding: 14, border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                {sec.data.mood && <DTFace v={sec.data.mood} size={28} color={DT_MOODS[sec.data.mood - 1].color} />}
                <span style={{ fontFamily: 'var(--f-sans)', fontSize: 13, color: 'var(--ink-soft)' }}>
                  {sec.data.mood ? DT_MOODS[sec.data.mood - 1].label : ''}
                  {sec.data.energy ? ` · energía ${sec.data.energy}/5` : ''}
                  {sec.data.sleep ? ` · sueño ${sec.data.sleep}/5` : ''}
                </span>
              </div>
              {Object.keys(sec.data.answers || {}).map(qid => {
                const val = sec.data.answers[qid];
                if (!val || !String(val).trim()) return null;
                const q = DT_Q_BY_ID[qid];
                return (
                  <div key={qid} style={{ marginBottom: 10 }}>
                    <div style={{ fontFamily: 'var(--f-sans)', fontSize: 12, color: 'var(--ink-faint)', marginBottom: 2 }}>{q ? q.text : ''}</div>
                    <div style={{ fontFamily: 'var(--f-serif)', fontSize: 16, color: 'var(--ink)', lineHeight: 1.4 }}>{val}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ fontFamily: 'var(--f-sans)', fontSize: 13.5, color: 'var(--ink-faint)', fontStyle: 'italic' }}>
              Aún sin escribir.
            </div>
          )}
        </div>
      ))}
      {prog && onExercise && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <DTEyebrow>Ejercicio · {prog.title}</DTEyebrow>
            <button onClick={onExercise} className="dt-tap" style={{ border: 'none', background: 'var(--soft-bg)',
              borderRadius: 99, padding: '6px 14px', cursor: 'pointer', fontFamily: 'var(--f-sans)',
              fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', flexShrink: 0 }}>
              {e.exercise ? 'Editar' : 'Hacerlo'}
            </button>
          </div>
          {e.exercise
            ? <DTExerciseRecap day={day} data={e.exercise} />
            : <div style={{ fontFamily: 'var(--f-sans)', fontSize: 13.5, color: 'var(--ink-faint)',
                fontStyle: 'italic' }}>Aún sin hacer.</div>}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { DTDecor, DTWelcome, DTHome, DTJourney, DTDayDetail });
