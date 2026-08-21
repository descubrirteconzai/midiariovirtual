// analysis.jsx — DescubrirTe 21 pattern engine.
// All client-side, real computation over the user's own entries.

// ── Spanish stopwords ──────────────────────────────────────────
const DT_STOP = new Set((
  'a al algo algunas algunos ante antes como con contra cual cuando de del desde donde dos el ella ' +
  'ellas ellos en entre era erais eran eras eres es esa esas ese eso esos esta estaba estaban estado ' +
  'estais estamos estan estar estas este esto estos estoy fin fue fueron fui fuimos ha habia habian han ' +
  'hasta hay la las le les lo los mas me mi mientras muy nada ni no nos nosotras nosotros nuestra nuestro ' +
  'o os para pero poco por porque que quien se sea sean ser si sin sobre sois somos son soy su sus tambien ' +
  'tampoco tan tanto te tiene tienen toda todas todo todos tu tus un una uno unos uy ya yo ' +
  'siento siente sentir hoy dia dias mañana noche cosa cosas vez veces solo sola estoy ' +
  'algo mucho mucha muchos muchas cada todo toda hacer hace siempre nunca aunque despues parte ' +
  'mismo misma quiero puedo pude vengo decir diria daria seria'
).split(/\s+/));

// Normalize: lowercase + strip accents + keep letters/spaces.
function dtNorm(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zñ\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Theme / trigger lexicon (recurring life domains) ───────────
const DT_THEMES = [
  { id: 'trabajo', label: 'Trabajo', color: '#4C5270',
    words: ['trabajo', 'jefe', 'jefa', 'oficina', 'tareas', 'tarea', 'proyecto', 'reunion', 'reuniones', 'cliente', 'clientes', 'curro', 'laboral', 'empleo', 'estudio', 'estudios', 'examen'] },
  { id: 'familia', label: 'Familia', color: '#E28F8F',
    words: ['familia', 'mama', 'papa', 'madre', 'padre', 'hijo', 'hija', 'hijos', 'hermana', 'hermano', 'pareja', 'esposo', 'esposa', 'novio', 'novia', 'casa', 'hogar'] },
  { id: 'dinero', label: 'Dinero', color: '#C9A06A',
    words: ['dinero', 'plata', 'deuda', 'deudas', 'cuenta', 'cuentas', 'pagar', 'pago', 'gastos', 'economia', 'sueldo'] },
  { id: 'cuerpo', label: 'Cuerpo y salud', color: '#7FA9A0',
    words: ['cuerpo', 'salud', 'peso', 'comida', 'comer', 'ejercicio', 'dolor', 'enferma', 'enfermo', 'energia', 'cansada', 'cansado', 'cansancio', 'agotada', 'agotado'] },
  { id: 'descanso', label: 'Descanso', color: '#9D8FBF',
    words: ['dormir', 'sueño', 'sueno', 'descanso', 'descansar', 'insomnio', 'cama', 'siesta'] },
  { id: 'emociones', label: 'Emociones', color: '#E4B0BD',
    words: ['miedo', 'ansiedad', 'ansiosa', 'tristeza', 'triste', 'enojo', 'enojada', 'culpa', 'verguenza', 'soledad', 'sola', 'estres', 'estresada', 'angustia', 'preocupada', 'preocupacion'] },
  { id: 'autoestima', label: 'Autoestima', color: '#D79AAA',
    words: ['valgo', 'merezco', 'confianza', 'segura', 'inseguridad', 'inseguro', 'autoestima', 'amor', 'amarme', 'cuidarme', 'orgullo', 'orgullosa', 'fuerte', 'capaz', 'logro', 'logre'] },
  { id: 'tiempo', label: 'Tiempo para mí', color: '#8E92A6',
    words: ['tiempo', 'pausa', 'respirar', 'calma', 'silencio', 'paz', 'momento', 'caminar', 'leer', 'meditar'] },
];

const DT_THEME_LOOKUP = (() => {
  const m = {};
  DT_THEMES.forEach(t => t.words.forEach(w => { m[w] = t.id; }));
  return m;
})();

// Gather all free-text from an entry.
function dtEntryText(entry) {
  let out = [];
  if (entry?.morning?.answers) out = out.concat(Object.values(entry.morning.answers));
  if (entry?.night?.answers) out = out.concat(Object.values(entry.night.answers));
  if (entry?.exercise?.answers) {
    Object.values(entry.exercise.answers).forEach(v => {
      if (Array.isArray(v)) out = out.concat(v);
      else out.push(v);
    });
  }
  return out.filter(Boolean).join(' ');
}

// ── Main analysis ──────────────────────────────────────────────
// entries: { '1': {morning, night}, ... }
function dtAnalyze(entries, cycleLength) {
  const days = [];
  Object.keys(entries || {})
    .map(Number).sort((a, b) => a - b)
    .forEach(d => days.push({ day: d, ...entries[d] }));

  // Mood / energy / sleep series
  const moodMorning = [], moodNight = [], energy = [], sleep = [], moodAll = [];
  days.forEach(d => {
    const mm = d.morning?.mood, mn = d.night?.mood;
    if (mm) { moodMorning.push({ day: d.day, v: mm }); moodAll.push(mm); }
    if (mn) { moodNight.push({ day: d.day, v: mn }); moodAll.push(mn); }
    if (d.morning?.energy) energy.push({ day: d.day, v: d.morning.energy });
    if (d.morning?.sleep) sleep.push({ day: d.day, v: d.morning.sleep });
  });

  const avg = arr => arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : 0;
  const moodAvg = avg(moodAll);
  const energyAvg = avg(energy.map(x => x.v));
  const sleepAvg = avg(sleep.map(x => x.v));

  // Best / hardest day by combined mood
  let best = null, hard = null;
  days.forEach(d => {
    const vals = [d.morning?.mood, d.night?.mood].filter(Boolean);
    if (!vals.length) return;
    const m = avg(vals);
    if (!best || m > best.m) best = { day: d.day, m };
    if (!hard || m < hard.m) hard = { day: d.day, m };
  });

  // Word frequencies + theme tallies
  const freq = {};
  const themeCount = {};
  const themeDays = {};
  days.forEach(d => {
    const toks = dtNorm(dtEntryText(d)).split(' ').filter(w => w.length > 3 && !DT_STOP.has(w));
    const seenThemes = new Set();
    toks.forEach(w => {
      freq[w] = (freq[w] || 0) + 1;
      const th = DT_THEME_LOOKUP[w];
      if (th) {
        themeCount[th] = (themeCount[th] || 0) + 1;
        seenThemes.add(th);
      }
    });
    seenThemes.forEach(th => { themeDays[th] = (themeDays[th] || 0) + 1; });
  });

  const topWords = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 18)
    .map(([word, n]) => ({ word, n }));

  const themes = DT_THEMES
    .map(t => ({ ...t, count: themeCount[t.id] || 0, days: themeDays[t.id] || 0 }))
    .filter(t => t.count > 0)
    .sort((a, b) => b.count - a.count);

  // ── Generated written insights ───────────────────────────────
  const insights = [];
  const filledDays = days.filter(d => d.morning || d.night).length;

  if (moodAll.length) {
    insights.push({
      kind: 'mood',
      text: `Tu ánimo promedio fue ${moodAvg.toFixed(1)} de 5${best ? `, y tu mejor momento fue el día ${best.day}` : ''}.`,
    });
  }
  if (topWords.length) {
    const tw = topWords[0];
    insights.push({
      kind: 'word',
      text: `La palabra que más se repitió en tu escritura fue «${tw.word}» — apareció ${tw.n} ${tw.n === 1 ? 'vez' : 'veces'}.`,
    });
  }
  if (themes.length) {
    const t = themes[0];
    insights.push({
      kind: 'theme',
      text: `«${t.label}» fue el tema más presente: apareció en ${t.days} de tus ${filledDays} días registrados.`,
    });
  }
  if (energy.length && sleep.length) {
    insights.push({
      kind: 'energysleep',
      text: `Tu energía promedió ${energyAvg.toFixed(1)}/5 y tu descanso ${sleepAvg.toFixed(1)}/5. ${energyAvg >= sleepAvg ? 'Tu energía se sostuvo incluso cuando dormiste poco.' : 'Dormir mejor parece levantar tu energía.'}`,
    });
  }
  if (hard && best && hard.day !== best.day) {
    insights.push({
      kind: 'contrast',
      text: `El día ${hard.day} fue el más cuesta arriba. Mirar qué escribiste ahí puede mostrarte un patrón.`,
    });
  }

  return {
    days, filledDays, cycleLength,
    moodMorning, moodNight, energy, sleep,
    moodAvg, energyAvg, sleepAvg, best, hard,
    topWords, themes, insights,
  };
}

Object.assign(window, { dtAnalyze, dtNorm, DT_THEMES, dtEntryText });
