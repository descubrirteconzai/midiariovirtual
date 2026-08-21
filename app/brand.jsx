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

// ── Guided questions (verbatim from the user) ──────────────────
const DT_QUESTIONS = {
  morning: [
    {
      id: 'm1',
      text: '¿Cómo me siento hoy, realmente?',
      hint: 'No lo que deberías sentir… lo que sentís.',
      placeholder: 'Hoy, por dentro, siento…',
    },
    {
      id: 'm2',
      text: '¿Qué parte de mi vida me está pesando más últimamente?',
      hint: 'Nómbralo sin juzgarte.',
      placeholder: 'Lo que más me pesa es…',
    },
    {
      id: 'm3',
      text: 'Si pudiera decir una verdad que vengo callando… ¿cuál sería?',
      hint: 'Aquí nadie te lee. Solo vos.',
      placeholder: 'La verdad que callo es…',
    },
  ],
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
    '--f-script': DT_FONTS.script,
    '--f-serif': DT_FONTS.serif,
    '--f-sans': DT_FONTS.sans,
    '--text-scale': textScale,
  };
}

Object.assign(window, {
  DT_PALETTES, DT_PROMPT_FONTS, DT_FONTS, DT_MOODS, DT_QUESTIONS, DT_BRAND, dtThemeVars,
});
