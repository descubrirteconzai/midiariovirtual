// ui.jsx — shared UI primitives for DescubrirTe 21.
const { useState, useRef, useEffect } = React;

// ── Soft drawn mood face (no emoji) ────────────────────────────
function DTFace({ v = 3, size = 40, color = '#E28F8F', active = true }) {
  // mouth curvature: v1 frown … v5 smile
  const curve = { 1: -8, 2: -4, 3: 0, 4: 5, 5: 9 }[v] ?? 0;
  const cx = size / 2;
  const my = size * 0.66;
  const mw = size * 0.34;
  const eyeY = size * 0.42;
  const eyeDx = size * 0.18;
  const stroke = active ? color : '#C7C9D4';
  const sw = Math.max(1.6, size * 0.05);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      <circle cx={cx} cy={cx} r={cx - sw} fill="none" stroke={stroke} strokeWidth={sw} opacity={active ? 0.9 : 0.5} />
      <circle cx={cx - eyeDx} cy={eyeY} r={sw * 0.62} fill={stroke} />
      <circle cx={cx + eyeDx} cy={eyeY} r={sw * 0.62} fill={stroke} />
      <path
        d={`M ${cx - mw} ${my} Q ${cx} ${my + curve} ${cx + mw} ${my}`}
        fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round"
      />
    </svg>
  );
}

// ── Mood picker (1–5) ──────────────────────────────────────────
function DTMoodPicker({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
      {DT_MOODS.map(m => {
        const on = value === m.v;
        return (
          <button key={m.v} onClick={() => onChange(m.v)} className="dt-tap"
            style={{
              flex: 1, border: 'none', background: on ? 'var(--soft-bg)' : 'transparent',
              borderRadius: 18, padding: '12px 4px 9px', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              outline: on ? '1.5px solid var(--soft)' : '1.5px solid transparent',
              transition: 'all .2s ease',
            }}>
            <DTFace v={m.v} size={38} color={m.color} active={on || value == null} />
            <span style={{
              fontFamily: 'var(--f-sans)', fontSize: 11, fontWeight: on ? 600 : 500,
              color: on ? 'var(--ink)' : 'var(--ink-soft)', letterSpacing: 0.2,
            }}>{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── 1–5 dot scale (energy / sleep) ─────────────────────────────
function DTScale({ value, onChange, lowLabel, highLabel, accent = 'var(--primary)' }) {
  return (
    <div>
      <div style={{ display: 'flex', gap: 8 }}>
        {[1, 2, 3, 4, 5].map(n => {
          const on = value != null && n <= value;
          return (
            <button key={n} onClick={() => onChange(n)} className="dt-tap"
              style={{
                flex: 1, height: 40, borderRadius: 12, cursor: 'pointer',
                border: '1.5px solid ' + (on ? accent : 'var(--line)'),
                background: on ? accent : 'var(--surface-2)',
                transition: 'all .18s ease',
              }} aria-label={String(n)} />
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7,
        fontFamily: 'var(--f-sans)', fontSize: 11.5, color: 'var(--ink-faint)' }}>
        <span>{lowLabel}</span><span>{highLabel}</span>
      </div>
    </div>
  );
}

// ── Buttons ────────────────────────────────────────────────────
function DTButton({ children, onClick, variant = 'primary', disabled, style = {} }) {
  const base = {
    fontFamily: 'var(--f-sans)', fontWeight: 600, fontSize: 16, letterSpacing: 0.2,
    border: 'none', borderRadius: 999, padding: '16px 22px', cursor: disabled ? 'default' : 'pointer',
    transition: 'transform .12s ease, box-shadow .2s ease, opacity .2s', width: '100%',
    opacity: disabled ? 0.45 : 1,
  };
  const variants = {
    primary: { background: 'var(--primary)', color: 'var(--primary-ink)',
      boxShadow: '0 8px 20px -8px var(--primary)' },
    soft: { background: 'var(--soft-bg)', color: 'var(--ink)' },
    ghost: { background: 'transparent', color: 'var(--ink-soft)', boxShadow: 'inset 0 0 0 1.5px var(--line)' },
    ink: { background: 'var(--ink)', color: '#fff' },
  };
  return (
    <button className="dt-press" disabled={disabled} onClick={onClick}
      style={{ ...base, ...variants[variant], ...style }}>{children}</button>
  );
}

// ── Card ───────────────────────────────────────────────────────
function DTCard({ children, style = {}, onClick, raised = true }) {
  return (
    <div onClick={onClick} className={onClick ? 'dt-press' : ''}
      style={{
        background: 'var(--surface)', borderRadius: 24, padding: 20,
        boxShadow: raised ? '0 18px 40px -28px rgba(76,82,112,0.45)' : 'none',
        border: '1px solid var(--line)', cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}>{children}</div>
  );
}

// ── Progress ring ──────────────────────────────────────────────
function DTRing({ value, total, size = 86, stroke = 8 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = total ? Math.min(1, value / total) : 0;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--soft-bg)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--primary)" strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.22,1,.36,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--f-sans)' }}>
        <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>{value}</span>
        <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>de {total}</span>
      </div>
    </div>
  );
}

// ── Sparkline / mood curve (SVG data viz) ──────────────────────
function DTSparkline({ series, total, color = 'var(--primary)', fill = true, height = 90, dots = true }) {
  // series: [{day, v}], v in 1..5
  const w = 300, h = height, pad = 10;
  if (!series || series.length === 0) return null;
  const maxDay = total || Math.max(...series.map(s => s.day));
  const x = d => pad + ((d - 1) / Math.max(1, maxDay - 1)) * (w - pad * 2);
  const y = v => h - pad - ((v - 1) / 4) * (h - pad * 2);
  const pts = series.map(s => [x(s.day), y(s.v)]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = line + ` L ${pts[pts.length - 1][0].toFixed(1)} ${h - pad} L ${pts[0][0].toFixed(1)} ${h - pad} Z`;
  const gid = 'g' + Math.random().toString(36).slice(2, 7);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${gid})`} />}
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {dots && pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="3.4" fill="#fff" stroke={color} strokeWidth="2.2" />
      ))}
    </svg>
  );
}

// ── Theme bar ──────────────────────────────────────────────────
function DTThemeBar({ label, value, max, color }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6,
        fontFamily: 'var(--f-sans)', fontSize: 13.5, color: 'var(--ink)', fontWeight: 500 }}>
        <span>{label}</span><span style={{ color: 'var(--ink-faint)' }}>{value}</span>
      </div>
      <div style={{ height: 9, borderRadius: 99, background: 'var(--soft-bg)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: pct + '%', background: color, borderRadius: 99,
          transition: 'width .7s cubic-bezier(.22,1,.36,1)' }} />
      </div>
    </div>
  );
}

// ── Word cloud ─────────────────────────────────────────────────
function DTWordCloud({ words }) {
  if (!words || !words.length) return null;
  const max = words[0].n, min = words[words.length - 1].n;
  const tones = ['var(--ink)', 'var(--primary)', 'var(--soft)', 'var(--ink-soft)', 'var(--primary-deep)'];
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', alignItems: 'baseline', justifyContent: 'center' }}>
      {words.map((w, i) => {
        const t = max === min ? 1 : (w.n - min) / (max - min);
        const fs = 14 + t * 24;
        return (
          <span key={w.word} style={{
            fontFamily: 'var(--f-serif)', fontWeight: 600, fontSize: fs,
            color: tones[i % tones.length], opacity: 0.55 + t * 0.45, lineHeight: 1.1,
          }}>{w.word}</span>
        );
      })}
    </div>
  );
}

// ── Section heading ────────────────────────────────────────────
function DTEyebrow({ children, style = {} }) {
  return <div style={{ fontFamily: 'var(--f-sans)', fontSize: 12, fontWeight: 600,
    letterSpacing: 2, textTransform: 'uppercase', color: 'var(--primary)', ...style }}>{children}</div>;
}

// ── Bottom navigation ──────────────────────────────────────────
const DT_NAV_ICONS = {
  home: (a) => <path d="M3 11l9-8 9 8M5 9.5V21h5v-6h4v6h5V9.5" fill="none" stroke="currentColor" strokeWidth={a ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" />,
  journey: (a) => <path d="M5 4v16M19 4v16M5 8h14M5 14h14" fill="none" stroke="currentColor" strokeWidth={a ? 2.2 : 1.8} strokeLinecap="round" />,
  patterns: (a) => <path d="M4 19V5M4 15l5-5 4 3 6-7" fill="none" stroke="currentColor" strokeWidth={a ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" />,
};
function DTBottomNav({ tab, onTab, unlocked }) {
  const items = [
    { id: 'home', label: 'Hoy' },
    { id: 'journey', label: 'Mi viaje' },
    { id: 'patterns', label: 'Patrones' },
  ];
  return (
    <div style={{
      display: 'flex', background: 'var(--surface)', borderTop: '1px solid var(--line)',
      padding: '10px 8px 8px', flexShrink: 0,
    }}>
      {items.map(it => {
        const on = tab === it.id;
        const locked = it.id === 'patterns' && !unlocked;
        return (
          <button key={it.id} onClick={() => onTab(it.id)} className="dt-tap"
            style={{ flex: 1, border: 'none', background: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              color: on ? 'var(--primary)' : 'var(--ink-faint)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24">{DT_NAV_ICONS[it.id](on)}</svg>
            <span style={{ fontFamily: 'var(--f-sans)', fontSize: 11, fontWeight: on ? 600 : 500,
              letterSpacing: 0.2, position: 'relative' }}>
              {it.label}
              {locked && <span style={{ position: 'absolute', top: -1, right: -10, width: 5, height: 5,
                borderRadius: 9, background: 'var(--soft)' }} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── Bottom sheet ───────────────────────────────────────────────
function DTSheet({ open, onClose, children, title }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 80,
      background: 'rgba(60,65,96,0.32)', backdropFilter: 'blur(2px)',
      display: 'flex', alignItems: 'flex-end', animation: 'dtFade .2s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--surface)', width: '100%', borderRadius: '28px 28px 0 0',
        padding: '14px 22px 30px', animation: 'dtUp .28s cubic-bezier(.22,1,.36,1)',
        maxHeight: '82%', overflow: 'auto' }}>
        <div style={{ width: 40, height: 4.5, borderRadius: 9, background: 'var(--line)',
          margin: '0 auto 16px' }} />
        {title && <h3 style={{ fontFamily: 'var(--f-serif)', fontSize: 24, fontWeight: 600,
          color: 'var(--ink)', margin: '0 0 16px' }}>{title}</h3>}
        {children}
      </div>
    </div>
  );
}

Object.assign(window, {
  DTFace, DTMoodPicker, DTScale, DTButton, DTCard, DTRing, DTSparkline,
  DTThemeBar, DTWordCloud, DTEyebrow, DTBottomNav, DTSheet,
});
