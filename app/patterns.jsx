// patterns.jsx — the automatic "patrones" reveal screen.

function DTPatterns({ state, onLoadDemo, onExport }) {
  const a = dtAnalyze(state.entries, state.cycleLength);
  const enough = a.filledDays >= 3;

  if (!enough) {
    return (
      <div style={{ padding: 'calc(var(--sbar, 54px) + 16px) 24px 30px', minHeight: '100%', background: 'var(--bg)' }}>
        <DTEyebrow>Patrones</DTEyebrow>
        <h1 style={dtPTitle()}>Tu espejo<br />se revela aquí</h1>
        <p style={{ fontFamily: 'var(--f-sans)', fontSize: 15, lineHeight: 1.6,
          color: 'var(--ink-soft)', margin: '14px 0 0' }}>
          A medida que escribís cada mañana y cada noche, DescubrirTe va leyendo lo que sentís
          y te devuelve, sin que hagas nada, los patrones que se repiten: tu ánimo, tus palabras,
          tu energía y lo que más te pesa.
        </p>
        <DTCard style={{ marginTop: 24, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--f-serif)', fontStyle: 'italic', fontSize: 20,
            color: 'var(--ink)', marginBottom: 6 }}>
            Llevás {a.filledDays} {a.filledDays === 1 ? 'día' : 'días'} registrados
          </div>
          <p style={{ fontFamily: 'var(--f-sans)', fontSize: 13.5, color: 'var(--ink-soft)',
            margin: '0 0 18px' }}>Con 3 días ya empiezo a mostrarte tus primeros patrones.</p>
          <DTButton variant="soft" onClick={onLoadDemo}>Ver con una semana de ejemplo</DTButton>
        </DTCard>
      </div>
    );
  }

  const moodTones = ['#7E84A6', '#A98FAE', '#C9A6B0', '#E0A6A6', '#E28F8F'];
  const maxTheme = a.themes.length ? a.themes[0].count : 1;
  const complete = a.filledDays >= state.cycleLength;

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)' }}>
      {/* Header band */}
      <div style={{ padding: 'calc(var(--sbar, 54px) + 16px) 24px 26px', background: 'var(--ink)', color: '#fff',
        borderRadius: '0 0 30px 30px' }}>
        <div style={{ fontFamily: 'var(--f-sans)', fontSize: 12, fontWeight: 600, letterSpacing: 2,
          textTransform: 'uppercase', color: 'var(--soft)' }}>
          {complete ? `Ciclo de ${state.cycleLength} días · completo` : `${a.filledDays} de ${state.cycleLength} días`}
        </div>
        <h1 style={{ fontFamily: 'var(--f-script)', fontSize: 44, margin: '6px 0 0', lineHeight: 1 }}>
          Tus patrones
        </h1>
        <p style={{ fontFamily: 'var(--f-sans)', fontSize: 14, lineHeight: 1.55,
          color: 'rgba(255,255,255,.78)', margin: '12px 0 0' }}>
          Esto es lo que se repitió en lo que escribiste. No para juzgarte — para que puedas
          medirlo, entenderlo y, si querés, cambiarlo.
        </p>
      </div>

      <div style={{ padding: '22px 20px 30px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Insights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {a.insights.map((ins, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start',
              background: 'var(--surface)', borderRadius: 18, padding: '14px 16px',
              border: '1px solid var(--line)' }}>
              <div style={{ width: 8, height: 8, borderRadius: 9, background: 'var(--primary)',
                marginTop: 7, flexShrink: 0 }} />
              <p style={{ fontFamily: 'var(--f-serif)', fontSize: 16.5, lineHeight: 1.45,
                color: 'var(--ink)', margin: 0 }}>{ins.text}</p>
            </div>
          ))}
        </div>

        {/* Mood over time */}
        <DTCard>
          <DTEyebrow>Tu ánimo en el tiempo</DTEyebrow>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '8px 0 14px' }}>
            <span style={{ fontFamily: 'var(--f-serif)', fontSize: 40, fontWeight: 600,
              color: 'var(--ink)', lineHeight: 1 }}>{a.moodAvg.toFixed(1)}</span>
            <span style={{ fontFamily: 'var(--f-sans)', fontSize: 14, color: 'var(--ink-soft)' }}>promedio de 5</span>
          </div>
          <DTSparkline series={a.moodNight.length ? a.moodNight : a.moodMorning} total={state.cycleLength} color="var(--primary)" />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8,
            fontFamily: 'var(--f-sans)', fontSize: 11, color: 'var(--ink-faint)' }}>
            <span>Día 1</span><span>Día {state.cycleLength}</span>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 14, flexWrap: 'wrap' }}>
            {a.best && <DTMini label={`Mejor día`} value={`Día ${a.best.day}`} color="var(--primary)" />}
            {a.hard && <DTMini label={`Más difícil`} value={`Día ${a.hard.day}`} color="var(--ink-soft)" />}
          </div>
        </DTCard>

        {/* Words */}
        <DTCard>
          <DTEyebrow>Palabras que más repetís</DTEyebrow>
          <div style={{ marginTop: 16, marginBottom: 4 }}>
            <DTWordCloud words={a.topWords} />
          </div>
        </DTCard>

        {/* Themes / triggers */}
        {a.themes.length > 0 && (
          <DTCard>
            <DTEyebrow>Lo que más aparece (y lo que te pesa)</DTEyebrow>
            <p style={{ fontFamily: 'var(--f-sans)', fontSize: 13, color: 'var(--ink-soft)',
              margin: '6px 0 16px' }}>Los temas que tu escritura nombró una y otra vez.</p>
            {a.themes.map(t => (
              <DTThemeBar key={t.id} label={t.label} value={t.count} max={maxTheme} color={t.color} />
            ))}
          </DTCard>
        )}

        {/* Energy & sleep */}
        <DTCard>
          <DTEyebrow>Energía y descanso</DTEyebrow>
          <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--f-sans)', fontSize: 13, color: 'var(--ink-soft)', marginBottom: 4 }}>Energía</div>
              <div style={{ fontFamily: 'var(--f-serif)', fontSize: 30, fontWeight: 600, color: 'var(--ink)', lineHeight: 1 }}>
                {a.energyAvg.toFixed(1)}<span style={{ fontSize: 15, color: 'var(--ink-faint)' }}> /5</span>
              </div>
              <div style={{ marginTop: 10 }}>
                <DTSparkline series={a.energy} total={state.cycleLength} color="var(--primary)" height={56} fill={false} dots={false} />
              </div>
            </div>
            <div style={{ width: 1, background: 'var(--line)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--f-sans)', fontSize: 13, color: 'var(--ink-soft)', marginBottom: 4 }}>Descanso</div>
              <div style={{ fontFamily: 'var(--f-serif)', fontSize: 30, fontWeight: 600, color: 'var(--ink)', lineHeight: 1 }}>
                {a.sleepAvg.toFixed(1)}<span style={{ fontSize: 15, color: 'var(--ink-faint)' }}> /5</span>
              </div>
              <div style={{ marginTop: 10 }}>
                <DTSparkline series={a.sleep} total={state.cycleLength} color="var(--soft)" height={56} fill={false} dots={false} />
              </div>
            </div>
          </div>
        </DTCard>

        {/* Export */}
        {onExport && (
          <DTCard style={{ textAlign: 'center' }}>
            <DTEyebrow>Guardar o compartir</DTEyebrow>
            <p style={{ fontFamily: 'var(--f-sans)', fontSize: 13, color: 'var(--ink-soft)',
              margin: '6px 0 14px' }}>Llevate tu resumen como imagen o PDF.</p>
            <DTButton variant="soft" onClick={onExport}>Exportar mi resumen</DTButton>
          </DTCard>
        )}

        {/* Closing */}
        <div style={{ textAlign: 'center', padding: '10px 16px 4px' }}>
          <p style={{ fontFamily: 'var(--f-script)', fontSize: 26, color: 'var(--primary)', margin: 0, lineHeight: 1.2 }}>
            Lo que se mide, se puede transformar.
          </p>
          <p style={{ fontFamily: 'var(--f-sans)', fontSize: 13, color: 'var(--ink-soft)', margin: '10px 0 0' }}>
            Elegí un patrón. Esa es tu intención para el próximo ciclo.
          </p>
        </div>
      </div>
    </div>
  );
}

function DTMini({ label, value, color }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--f-sans)', fontSize: 11.5, color: 'var(--ink-faint)',
        textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ fontFamily: 'var(--f-sans)', fontSize: 16, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function dtPTitle() {
  return { fontFamily: 'var(--f-serif)', fontStyle: 'italic', fontWeight: 600, fontSize: 36,
    lineHeight: 1.1, color: 'var(--ink)', margin: '10px 0 0' };
}

Object.assign(window, { DTPatterns });
