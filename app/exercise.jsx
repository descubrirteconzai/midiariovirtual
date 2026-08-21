// exercise.jsx — renders one day of the guided program as a form.

function DTExercise({ day, initial, onSave, onClose }) {
  const prog = dtProgramDay(day);
  const [ans, setAns] = React.useState(() => (initial && initial.answers) || {});
  if (!prog) return null;

  const set = (id, v) => setAns(a => ({ ...a, [id]: v }));
  const toggle = (id, opt) => setAns(a => {
    const cur = a[id] || [];
    return { ...a, [id]: cur.includes(opt) ? cur.filter(x => x !== opt) : [...cur, opt] };
  });

  const filled = Object.values(ans).filter(v => Array.isArray(v) ? v.length : (v || '').trim()).length;

  const qStyle = {
    fontFamily: 'var(--f-prompt, var(--f-serif))', fontStyle: 'var(--prompt-style, italic)',
    fontWeight: 'var(--prompt-weight, 600)', fontSize: 'calc(21px * var(--prompt-scale, 1))',
    lineHeight: 1.3, color: 'var(--ink)', margin: 0, textWrap: 'pretty',
  };
  const hintStyle = { fontFamily: 'var(--f-sans)', fontSize: 12.5, lineHeight: 1.5,
    color: 'var(--ink-soft)', margin: '6px 0 0' };
  const inputStyle = (big) => ({
    marginTop: 12, width: '100%', boxSizing: 'border-box', minHeight: big ? 130 : 62,
    border: '1px solid var(--line)', borderRadius: 16, padding: 14, resize: 'none',
    fontFamily: 'var(--f-sans)', fontSize: 15.5, lineHeight: 1.6, color: 'var(--ink)',
    background: 'var(--surface)', outline: 'none',
  });

  const Chip = ({ on, children, onClick, round }) => (
    <button onClick={onClick} className="dt-tap" style={{
      display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
      border: '1.5px solid ' + (on ? 'var(--primary)' : 'var(--line)'),
      background: on ? 'var(--soft-bg)' : 'var(--surface)', borderRadius: 14,
      padding: '11px 13px', cursor: 'pointer', fontFamily: 'var(--f-sans)',
      fontSize: 14.5, color: 'var(--ink)', lineHeight: 1.35,
    }}>
      <span style={{ width: 18, height: 18, flexShrink: 0, borderRadius: round ? 99 : 5,
        border: '1.5px solid ' + (on ? 'var(--primary)' : 'var(--ink-faint)'),
        background: on ? 'var(--primary)' : 'transparent', display: 'grid', placeItems: 'center' }}>
        {on && (round
          ? <span style={{ width: 7, height: 7, borderRadius: 99, background: '#fff' }} />
          : <svg width="11" height="11" viewBox="0 0 24 24"><path d="M5 13l4 4 10-11" fill="none"
              stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" /></svg>)}
      </span>
      <span>{children}</span>
    </button>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column',
      background: 'var(--bg)', paddingTop: 'var(--sbar, 54px)', overflow: 'hidden' }}>
      {/* header */}
      <div style={{ padding: '8px 22px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onClose} className="dt-tap" style={{ border: 'none', background: 'var(--surface)',
          width: 38, height: 38, borderRadius: 99, cursor: 'pointer', flexShrink: 0,
          boxShadow: '0 4px 12px -6px rgba(76,82,112,.5)', display: 'grid', placeItems: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" fill="none"
            stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--f-sans)', fontSize: 11.5, fontWeight: 600, letterSpacing: 1.6,
            textTransform: 'uppercase', color: 'var(--primary)' }}>
            Día {prog.n} · {prog.minutes} min
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: '0 22px 10px' }}>
        <h1 style={{ fontFamily: 'var(--f-script)', fontSize: 38, color: 'var(--ink)',
          margin: '0 0 10px', lineHeight: 1.05 }}>{prog.title}</h1>
        <p style={{ fontFamily: 'var(--f-sans)', fontSize: 12.5, color: 'var(--ink-faint)',
          margin: '0 0 22px', lineHeight: 1.5 }}>
          Escribilo acá — y si te hace bien, hacelo primero a mano y volcalo después.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {prog.blocks.map((b, i) => {
            if (b.t === 'section') return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: i ? 6 : 0 }}>
                <DTEyebrow>{b.label}</DTEyebrow>
                <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
              </div>
            );
            if (b.t === 'text') return (
              <div key={b.id}>
                <p style={qStyle}>{b.q}</p>
                {b.hint && <p style={hintStyle}>{b.hint}</p>}
                <textarea value={ans[b.id] || ''} placeholder={b.placeholder || 'Escribí acá…'}
                  onChange={e => set(b.id, e.target.value)} style={inputStyle(b.big)} />
              </div>
            );
            if (b.t === 'group') return (
              <div key={i} style={{ background: 'var(--surface-2)', border: '1px solid var(--line)',
                borderRadius: 20, padding: 16 }}>
                <div style={{ fontFamily: 'var(--f-sans)', fontSize: 13, fontWeight: 700,
                  color: 'var(--ink)', marginBottom: 12, letterSpacing: 0.3 }}>{b.label}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {b.fields.map(f => (
                    <div key={f.id}>
                      <div style={{ fontFamily: 'var(--f-sans)', fontSize: 13, color: 'var(--ink-soft)',
                        marginBottom: 5 }}>{f.q}</div>
                      <input value={ans[f.id] || ''} onChange={e => set(f.id, e.target.value)}
                        style={{ width: '100%', boxSizing: 'border-box', border: '1px solid var(--line)',
                          borderRadius: 12, padding: '11px 13px', fontFamily: 'var(--f-sans)',
                          fontSize: 15, color: 'var(--ink)', background: 'var(--surface)', outline: 'none' }} />
                    </div>
                  ))}
                </div>
              </div>
            );
            if (b.t === 'check' || b.t === 'radio') {
              let options = b.options;
              if (b.optionsBy) {
                const dep = ans[b.dependsOn];
                if (!dep) return null;
                options = b.optionsBy[dep] || [];
              }
              const cur = ans[b.id];
              return (
                <div key={b.id}>
                  <p style={qStyle}>{b.q}</p>
                  {b.hint && <p style={hintStyle}>{b.hint}</p>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                    {options.map(o => (
                      <Chip key={o} round={b.t === 'radio'}
                        on={b.t === 'radio' ? cur === o : (cur || []).includes(o)}
                        onClick={() => b.t === 'radio' ? set(b.id, o) : toggle(b.id, o)}>
                        {o}
                      </Chip>
                    ))}
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>

      <div style={{ padding: '14px 22px 30px', background: 'var(--bg)', flexShrink: 0,
        borderTop: '1px solid var(--line)' }}>
        <DTButton onClick={() => onSave({ answers: ans, done: true })} disabled={filled === 0}>
          {filled ? 'Guardar mi ejercicio' : 'Escribí algo para guardar'}
        </DTButton>
      </div>
    </div>
  );
}

// Read-only recap used in the day sheet.
function DTExerciseRecap({ day, data }) {
  const prog = dtProgramDay(day);
  if (!prog || !data) return null;
  const rows = [];
  prog.blocks.forEach(b => {
    if (b.t === 'text' || b.t === 'check' || b.t === 'radio') {
      const v = data.answers?.[b.id];
      const txt = Array.isArray(v) ? v.join(' · ') : v;
      if (txt && String(txt).trim()) rows.push({ q: b.q, a: txt });
    } else if (b.t === 'group') {
      b.fields.forEach(f => {
        const v = data.answers?.[f.id];
        if (v && String(v).trim()) rows.push({ q: `${b.label} — ${f.q}`, a: v });
      });
    }
  });
  if (!rows.length) return null;
  return (
    <div style={{ background: 'var(--surface-2)', borderRadius: 16, padding: 14,
      border: '1px solid var(--line)' }}>
      {rows.map((r, i) => (
        <div key={i} style={{ marginBottom: i === rows.length - 1 ? 0 : 10 }}>
          <div style={{ fontFamily: 'var(--f-sans)', fontSize: 12, color: 'var(--ink-faint)',
            marginBottom: 2 }}>{r.q}</div>
          <div style={{ fontFamily: 'var(--f-serif)', fontSize: 15.5, color: 'var(--ink)',
            lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>{r.a}</div>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { DTExercise, DTExerciseRecap });
