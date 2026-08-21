// checkin.jsx — morning & night guided check-in flow.
const { useState: dtUseState } = React;

function DTCheckin({ mode, day, initial, onSave, onClose, name }) {
  // mode: 'morning' | 'night'
  const isMorning = mode === 'morning';
  const questions = DT_QUESTIONS[mode];
  // steps: [mood] (+[scales for morning]) + one per question
  const preSteps = isMorning ? ['mood', 'scales'] : ['mood'];
  const steps = [...preSteps, ...questions.map(q => q.id)];

  const [step, setStep] = dtUseState(0);
  const [mood, setMood] = dtUseState(initial?.mood ?? null);
  const [energy, setEnergy] = dtUseState(initial?.energy ?? null);
  const [sleep, setSleep] = dtUseState(initial?.sleep ?? null);
  const [answers, setAnswers] = dtUseState(initial?.answers ?? {});

  const cur = steps[step];
  const total = steps.length;
  const last = step === total - 1;

  const canNext = () => {
    if (cur === 'mood') return mood != null;
    if (cur === 'scales') return energy != null && sleep != null;
    return true; // text answers optional but encouraged
  };

  const finish = () => {
    const data = isMorning ? { mood, energy, sleep, answers } : { mood, answers };
    onSave(data);
  };
  const next = () => { if (last) finish(); else setStep(s => s + 1); };
  const back = () => { if (step === 0) onClose(); else setStep(s => s - 1); };

  const accent = isMorning ? 'var(--primary)' : 'var(--ink)';
  const h = new Date().getHours();
  const greeting = h < 13 ? 'Buenos días' : h < 20 ? 'Buenas tardes' : 'Buenas noches';
  const sub = isMorning
    ? 'Un momento para encontrarte antes de empezar.'
    : 'Un momento para cerrar el día contigo.';

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column',
      background: 'var(--bg)', paddingTop: 'var(--sbar, 54px)' }}>
      {/* Header */}
      <div style={{ padding: '8px 22px 4px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={back} className="dt-tap" style={{ border: 'none', background: 'var(--surface)',
          width: 38, height: 38, borderRadius: 99, cursor: 'pointer', flexShrink: 0,
          boxShadow: '0 4px 12px -6px rgba(76,82,112,.5)', display: 'grid', placeItems: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" fill="none"
            stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        {/* progress segments */}
        <div style={{ flex: 1, display: 'flex', gap: 5 }}>
          {steps.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 9,
              background: i <= step ? accent : 'var(--line)', transition: 'background .3s' }} />
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: '20px 24px 8px', display: 'flex', flexDirection: 'column' }}>
        {(cur === 'mood' || cur === 'scales') && (
          <div style={{ marginBottom: 26 }}>
            <div style={{ fontFamily: 'var(--f-script)', fontSize: 34, color: accent, lineHeight: 1 }}>
              {greeting}{name ? ',' : ''}
            </div>
            {name && <div style={{ fontFamily: 'var(--f-script)', fontSize: 34, color: accent,
              lineHeight: 1, marginTop: -2 }}>{name}</div>}
            <div style={{ fontFamily: 'var(--f-sans)', fontSize: 14, color: 'var(--ink-soft)', marginTop: 8 }}>{sub}</div>
          </div>
        )}

        {cur === 'mood' && (
          <div style={{ animation: 'dtIn .35s ease' }}>
            <h2 style={dtQ()}>¿Con qué ánimo llegás a este momento?</h2>
            <div style={{ marginTop: 20 }}>
              <DTMoodPicker value={mood} onChange={setMood} />
            </div>
          </div>
        )}

        {cur === 'scales' && (
          <div style={{ animation: 'dtIn .35s ease' }}>
            <h2 style={dtQ()}>¿Cómo está tu cuerpo hoy?</h2>
            <div style={{ marginTop: 24 }}>
              <label style={dtLbl()}>Energía</label>
              <DTScale value={energy} onChange={setEnergy} lowLabel="En reserva" highLabel="Plena" accent="var(--primary)" />
            </div>
            <div style={{ marginTop: 26 }}>
              <label style={dtLbl()}>Cómo dormí</label>
              <DTScale value={sleep} onChange={setSleep} lowLabel="Mal" highLabel="Profundo" accent="var(--soft)" />
            </div>
          </div>
        )}

        {questions.map(q => cur === q.id && (
          <div key={q.id} style={{ animation: 'dtIn .35s ease', display: 'flex', flexDirection: 'column', flex: 1 }}>
            {q.tender && (
              <div style={{ fontFamily: 'var(--f-script)', fontSize: 22, color: 'var(--primary)', marginBottom: 4 }}>
                con más amor…
              </div>
            )}
            <h2 style={dtQ()}>{q.text}</h2>
            {q.hint && <p style={{ fontFamily: 'var(--f-sans)', fontSize: 13.5, fontStyle: 'italic',
              color: 'var(--ink-soft)', margin: '8px 0 0' }}>{q.hint}</p>}
            <textarea
              value={answers[q.id] || ''}
              onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
              placeholder={q.placeholder}
              style={{
                marginTop: 18, flex: 1, minHeight: 150, width: '100%', boxSizing: 'border-box',
                border: '1px solid var(--line)', borderRadius: 18, padding: 16, resize: 'none',
                fontFamily: 'var(--f-sans)', fontSize: 16, lineHeight: 1.6, color: 'var(--ink)',
                background: 'var(--surface)', outline: 'none',
              }}
            />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: '8px 24px 30px', background: 'var(--bg)' }}>
        <DTButton onClick={next} disabled={!canNext()}
          variant={isMorning ? 'primary' : 'ink'}>
          {last ? (isMorning ? 'Guardar mi mañana' : 'Cerrar mi día') : 'Continuar'}
        </DTButton>
        {!['mood', 'scales'].includes(cur) && !last && (
          <button onClick={() => setStep(s => s + 1)} className="dt-tap"
            style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer',
              padding: '12px 0 0', fontFamily: 'var(--f-sans)', fontSize: 13.5, color: 'var(--ink-faint)' }}>
            Saltar esta pregunta
          </button>
        )}
      </div>
    </div>
  );
}

function dtQ() {
  return {
    fontFamily: 'var(--f-prompt, var(--f-serif))',
    fontStyle: 'var(--prompt-style, italic)',
    fontWeight: 'var(--prompt-weight, 600)',
    fontSize: 'calc(27px * var(--prompt-scale, 1))',
    lineHeight: 1.25, color: 'var(--ink)', margin: 0, textWrap: 'pretty',
  };
}
function dtLbl() {
  return {
    display: 'block', fontFamily: 'var(--f-sans)', fontSize: 13, fontWeight: 600,
    letterSpacing: 0.4, color: 'var(--ink)', marginBottom: 12,
  };
}

Object.assign(window, { DTCheckin });
