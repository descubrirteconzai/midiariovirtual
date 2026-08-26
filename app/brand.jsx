// brand.jsx — DescubrirTe 21 design tokens, palettes, fonts, copy.
// Exposes globals (window.*) consumed by the rest of the app.

// ── Color palettes (all drawn from the brand kit) ──────────────
const DT_PALETTES = {
  rosa: {
    label: 'Rosa cálido',
    bg: '#FBEAE3',
    bgDeep: '#F6DAD0',
    surface: '#FFFFFF',
    surface2: '#FFF8F5',
    ink: '#4C5270',
    inkSoft: '#8E92A6',
    inkFaint: '#B9BCCB',
    primary: '#E28F8F',
    primaryDeep: '#D17070',
    primaryInk: '#FFFFFF',
    soft: '#E4B0BD',
    softBg: '#F8E6EA',
    line: 'rgba(76,82,112,0.10)',
    hint: '#9A4F4F',
    swatch: ['#4C5270', '#E28F8F', '#E4B0BD', '#FFEEE6'],
  },
  niebla: {
    label: 'Niebla serena',
    bg: '#FBF1F3',
    bgDeep: '#F4E2E7',
    surface: '#FFFFFF',
    surface2: '#FFF9FB',
    ink: '#4C5270',
    inkSoft: '#8E92A6',
    inkFaint: '#BFBECc',
    primary: '#D79AAA',
    primaryDeep: '#C07F92',
    primaryInk: '#FFFFFF',
    soft: '#E4B0BD',
    softBg: '#F6E6EC',
    line: 'rgba(76,82,112,0.10)',
    hint: '#8E5566',
    swatch: ['#4C5270', '#D79AAA', '#E4B0BD', '#FBF1F3'],
  },
  pizarra: {
    label: 'Pizarra & rosa',
    bg: '#EEEFF3',
    bgDeep: '#E2E4ED',
    surface: '#FFFFFF',
    surface2: '#F8F8FB',
    ink: '#3C4160',
    inkSoft: '#7E83A0',
    inkFaint: '#AEB2C6',
    primary: '#4C5270',
    primaryDeep: '#3A4060',
    primaryInk: '#FFFFFF',
    soft: '#E28F8F',
    softBg: '#F6E5E5',
    line: 'rgba(76,82,112,0.12)',
    hint: '#3A4060',
    swatch: ['#4C5270', '#E28F8F', '#E4B0BD', '#EEEFF3'],
  },
};

// ── Prompt font choices ────────────────────────────────────────
const DT_PROMPT_FONTS = {
  serif: { label: 'Serif elegante', family: "'Cormorant Garamond', Georgia, serif", weight: 600, italic: true, scale: 1.18 },
  script: { label: 'Script', family: "'Parisienne', cursive", weight: 400, italic: false, scale: 1.42 },
  sans: { label: 'Sans suave', family: "'Jost', system-ui, sans-serif", weight: 500, italic: false, scale: 1.0 },
};

const DT_FONTS = {
  script: "'Parisienne', cursive",
  serif: "'Cormorant Garamond', Georgia, serif",
  sans: "'Jost', system-ui, -apple-system, sans-serif",
};

// ── Mood scale (1 low → 5 high). Soft drawn faces, never emoji. ─
const DT_MOODS = [
  { v: 1, label: 'Abrumada', color: '#7E84A6' },
  { v: 2, label: 'Sensible', color: '#A98FAE' },
  { v: 3, label: 'En pausa', color: '#C9A6B0' },
  { v: 4, label: 'Serena', color: '#E0A6A6' },
  { v: 5, label: 'Radiante', color: '#E28F8F' },
];

// ── Morning question pool. Three are drawn per day, so las preguntas
// van cambiando día tras día sin repetir el mismo set. ─────────
const DT_MORNING_POOL = [
  { id: 'm1', text: '¿Cómo me siento hoy, realmente?',
    hint: 'No lo que deberías sentir… lo que sentís.',
    placeholder: 'Hoy, por dentro, siento…' },
  { id: 'm2', text: '¿Qué parte de mi vida me está pesando más últimamente?',
    hint: 'Nombralo sin juzgarte.',
    placeholder: 'Lo que más me pesa es…' },
  { id: 'm3', text: 'Si pudiera decir una verdad que vengo callando… ¿cuál sería?',
    hint: 'Acá nadie te lee. Solo vos.',
    placeholder: 'La verdad que callo es…' },
  { id: 'm4', text: '¿Con qué me despierto en la cabeza hoy?',
    hint: 'Lo primero que apareció, antes de ordenarlo.',
    placeholder: 'Me desperté pensando en…' },
  { id: 'm5', text: '¿Qué necesito hoy que nadie me va a dar si no me lo doy yo?',
    placeholder: 'Hoy necesito…' },
  { id: 'm6', text: 'Si el día saliera como quiero, ¿cómo me sentiría esta noche?',
    hint: 'No qué lograrías: cómo te sentirías.',
    placeholder: 'Esta noche me gustaría sentirme…' },
  { id: 'm7', text: '¿Qué estoy evitando y ya lo sé?',
    placeholder: 'Estoy evitando…' },
  { id: 'm8', text: '¿Qué me está pidiendo el cuerpo hoy?',
    hint: 'Respirá una vez y escuchalo antes de responder.',
    placeholder: 'Mi cuerpo me pide…' },
  { id: 'm9', text: '¿A qué le voy a decir que no hoy para cuidarme?',
    placeholder: 'Hoy le digo que no a…' },
  { id: 'm10', text: '¿Qué me estoy exigiendo que en realidad nadie me pidió?',
    placeholder: 'Me estoy exigiendo…' },
  { id: 'm11', text: 'Si hoy pudiera soltar una sola cosa, ¿cuál sería?',
    placeholder: 'Hoy suelto…' },
  { id: 'm12', text: '¿Qué cosa pequeña quiero regalarme hoy?',
    hint: 'Chiquita, posible, tuya.',
    placeholder: 'Hoy me regalo…' },
];

// Deterministic per-day draw: el mismo día siempre muestra el mismo set,
// así se puede volver a abrir y editar sin que cambien las preguntas.
function dtSeededPick(pool, count, seed) {
  const arr = pool.slice();
  const out = [];
  let s = (seed + 1) * 7919;
  for (let i = 0; i < count && arr.length; i++) {
    s = (s * 9301 + 49297) % 233280;
    out.push(arr.splice(Math.floor((s / 233280) * arr.length), 1)[0]);
  }
  return out;
}

function dtQuestionsFor(mode, day) {
  if (mode !== 'morning') return DT_QUESTIONS.night;
  return dtSeededPick(DT_MORNING_POOL, 3, day || 1);
}

// Primera pregunta (la del ánimo): va alternando día tras día.
const DT_MOOD_LEADS = {
  morning: [
    '¿Con qué ánimo llegás a este momento?',
    '¿Cómo está tu ánimo hoy?',
    '¿Cómo amaneció tu ánimo?',
    '¿Cómo te sentís al despertar?',
    '¿Cómo te encuentra hoy la mañana?',
    '¿Cómo estás llegando a este día?',
    '¿Cómo te sentís ahora mismo?',
  ],
  night: [
    '¿Con qué ánimo cerrás el día?',
    '¿Cómo te sentís ahora que el día termina?',
    '¿Cómo estuvo tu ánimo hoy?',
    '¿Cómo llegás al final del día?',
    '¿Cómo te sentís esta noche?',
    '¿Cómo está tu ánimo en este momento?',
    '¿Cómo te deja el día de hoy?',
  ],
};

function dtMoodQuestionFor(mode, day) {
  const pool = DT_MOOD_LEADS[mode === 'night' ? 'night' : 'morning'];
  const i = ((Number(day) || 1) - 1) % pool.length;
  return pool[i < 0 ? 0 : i];
}

// ── Guided questions ───────────────────────────────────────────
const DT_QUESTIONS = {
  morning: DT_MORNING_POOL.slice(0, 3),
  night: [
    {
      id: 'n1',
      text: '¿Cómo me sentí hoy después de regalarme unos minutos para mí?',
      hint: '',
      placeholder: 'Después de mi momento, sentí…',
    },
    {
      id: 'n2',
      text: '¿Qué momento del día me hizo sentir un poco mejor?',
      hint: 'Por pequeño que parezca.',
      placeholder: 'Lo que me hizo bien fue…',
    },
    {
      id: 'n3',
      text: '¿Qué necesito recordarme mañana?',
      hint: '',
      placeholder: 'Mañana quiero recordarme…',
    },
    {
      id: 'n4',
      text: 'Si pudiera decirme algo con más amor esta noche… ¿qué me diría?',
      hint: 'Háblate como a alguien que amás.',
      placeholder: 'Con amor, me diría…',
      tender: true,
    },
  ],
};

// Lookup by id so recaps can render any question that was ever answered.
const DT_Q_BY_ID = {};
DT_MORNING_POOL.forEach(q => { DT_Q_BY_ID[q.id] = q; });
DT_QUESTIONS.night.forEach(q => { DT_Q_BY_ID[q.id] = q; });

const DT_BRAND = {
  name: 'DescubrirTe',
  tagline: 'DescubrirTe es el acto de amor más valiente que existe',
};

// Build a CSS-variable style object for a given palette + text scale.
function dtThemeVars(palette, textScale = 1) {
  const p = DT_PALETTES[palette] || DT_PALETTES.rosa;
  return {
    '--bg': p.bg,
    '--bg-deep': p.bgDeep,
    '--surface': p.surface,
    '--surface-2': p.surface2,
    '--ink': p.ink,
    '--ink-soft': p.inkSoft,
    '--ink-faint': p.inkFaint,
    '--primary': p.primary,
    '--primary-deep': p.primaryDeep,
    '--primary-ink': p.primaryInk,
    '--soft': p.soft,
    '--soft-bg': p.softBg,
    '--line': p.line,
    '--hint': p.hint || p.ink,
    '--f-script': DT_FONTS.script,
    '--f-serif': DT_FONTS.serif,
    '--f-sans': DT_FONTS.sans,
    '--text-scale': textScale,
  };
}

Object.assign(window, {
  DT_PALETTES, DT_PROMPT_FONTS, DT_FONTS, DT_MOODS, DT_QUESTIONS, DT_BRAND, dtThemeVars,
  DT_MORNING_POOL, DT_Q_BY_ID, dtQuestionsFor, dtSeededPick,
  DT_MOOD_LEADS, dtMoodQuestionFor,
});
