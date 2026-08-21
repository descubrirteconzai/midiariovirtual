// storage.jsx — persistence + demo seed for DescubrirTe 21.

const DT_KEY = 'dt21_state_v1';

function dtDefaultState() {
  return {
    v: 1,
    name: '',
    cycleLength: 7,
    startDate: new Date().toISOString(),
    entries: {},      // { '1': { morning:{...}, night:{...} } }
    currentDay: 1,
    onboarded: false,
    usedDemo: false,
    reminders: { on: false, morning: '08:00', night: '22:00' },
  };
}

function dtLoad() {
  try {
    const raw = localStorage.getItem(DT_KEY);
    if (!raw) return dtDefaultState();
    return { ...dtDefaultState(), ...JSON.parse(raw) };
  } catch (e) { return dtDefaultState(); }
}

function dtSave(state) {
  try { localStorage.setItem(DT_KEY, JSON.stringify(state)); } catch (e) {}
}

function dtReset() {
  try { localStorage.removeItem(DT_KEY); } catch (e) {}
}

// Day completion helpers
function dtDayStatus(state, day) {
  const e = state.entries[day] || {};
  return { morning: !!e.morning, night: !!e.night, exercise: !!e.exercise,
           any: !!(e.morning || e.night || e.exercise),
           both: !!(e.morning && e.night) };
}
function dtCompletedDays(state) {
  let n = 0;
  for (let d = 1; d <= state.cycleLength; d++) {
    const s = dtDayStatus(state, d);
    if (s.both) n++;
  }
  return n;
}

// ── Demo seed: a coherent, emotional 7-day arc ─────────────────
const DT_DEMO_DAYS = [
  {
    morning: { mood: 2, energy: 2, sleep: 2, answers: {
      m1: 'Siento un cansancio que no es solo del cuerpo. Me desperté con el pecho apretado y ganas de quedarme en la cama.',
      m2: 'El trabajo me está pesando muchísimo. Siento que no llego a todo y mi jefa siempre quiere más.',
      m3: 'La verdad que callo es que tengo miedo de no ser suficiente, por más que me esfuerce.' } },
    night: { mood: 3, answers: {
      n1: 'Después de mi pausa para respirar me sentí un poco más liviana, menos en automático.',
      n2: 'Tomar un café sola en silencio antes del caos de la casa me hizo bien.',
      n3: 'Recordarme que descansar no es perder el tiempo.',
      n4: 'Me diría que estoy haciendo lo que puedo y que con eso alcanza por hoy.' } },
  },
  {
    morning: { mood: 3, energy: 3, sleep: 3, answers: {
      m1: 'Hoy me siento más estable, aunque con la cabeza llena de pendientes del trabajo.',
      m2: 'Lo que más me pesa es la culpa de no dedicarle tiempo a mi familia por estar tan cansada.',
      m3: 'Que a veces finjo estar bien para que nadie se preocupe por mí.' } },
    night: { mood: 3, answers: {
      n1: 'Sentí que volví a habitarme un poco. El momento para mí me ordenó por dentro.',
      n2: 'Mi hija me abrazó sin razón y se me llenaron los ojos.',
      n3: 'Recordarme respirar antes de reaccionar.',
      n4: 'Me diría que soy más fuerte de lo que creo y que merezco descanso.' } },
  },
  {
    morning: { mood: 2, energy: 2, sleep: 2, answers: {
      m1: 'Me siento irritable y sin energía. Dormí mal pensando en el dinero y las cuentas.',
      m2: 'El dinero. Las deudas me quitan el sueño y siento que el trabajo no alcanza.',
      m3: 'Que estoy agotada de sostenerlo todo yo sola.' } },
    night: { mood: 2, answers: {
      n1: 'Me costó regalarme el momento hoy, pero cuando lo hice respiré distinto.',
      n2: 'Una caminata corta al sol me bajó la ansiedad.',
      n3: 'Recordarme que pedir ayuda no me hace débil.',
      n4: 'Me diría que no tengo que poder con todo al mismo tiempo.' } },
  },
  {
    morning: { mood: 4, energy: 4, sleep: 4, answers: {
      m1: 'Hoy amanecí más serena, dormí mejor y siento el cuerpo más liviano.',
      m2: 'Sigue pesando el trabajo, pero hoy lo veo con un poco más de calma.',
      m3: 'Que quiero aprender a poner límites sin sentir culpa.' } },
    night: { mood: 4, answers: {
      n1: 'Me sentí orgullosa de haberme cuidado. El tiempo para mí ya no me parece egoísta.',
      n2: 'Cociné algo rico para mí, sin apuro. Eso fue amor propio.',
      n3: 'Recordarme que poner límites es cuidarme.',
      n4: 'Me diría que estoy floreciendo aunque no lo note todos los días.' } },
  },
  {
    morning: { mood: 3, energy: 3, sleep: 3, answers: {
      m1: 'Siento una mezcla: tranquila por momentos y ansiosa por otros.',
      m2: 'La familia y el trabajo tirando de mí al mismo tiempo. Me cuesta el equilibrio.',
      m3: 'Que necesito tiempo para mí sin tener que justificarlo.' } },
    night: { mood: 4, answers: {
      n1: 'Después de mi pausa sentí confianza, como si volviera a mi centro.',
      n2: 'Una charla honesta con mi pareja me hizo sentir acompañada.',
      n3: 'Recordarme que mi descanso también es importante.',
      n4: 'Me diría con amor que está bien soltar el control.' } },
  },
  {
    morning: { mood: 4, energy: 4, sleep: 4, answers: {
      m1: 'Me siento bastante bien, con más energía y menos miedo del que tenía al empezar.',
      m2: 'Hoy casi nada me pesa. El trabajo sigue, pero ya no me define.',
      m3: 'Que estoy aprendiendo a amarme tal como soy.' } },
    night: { mood: 5, answers: {
      n1: 'Me sentí plena, agradecida por el tiempo que me regalé.',
      n2: 'Leer unas páginas en calma antes de dormir fue mi momento favorito.',
      n3: 'Recordarme que merezco esta paz.',
      n4: 'Me diría que soy suficiente, hoy y siempre.' } },
  },
  {
    morning: { mood: 5, energy: 4, sleep: 4, answers: {
      m1: 'Amanecí radiante, con ganas. Siento que algo cambió por dentro esta semana.',
      m2: 'Casi nada. Y eso, después de tanto peso, se siente enorme.',
      m3: 'Que ya no quiero callar lo que siento ni achicarme para caber.' } },
    night: { mood: 5, answers: {
      n1: 'Me sentí orgullosa y entera. El tiempo para mí se volvió un hábito de amor propio.',
      n2: 'Mirar lo que escribí estos días y ver cuánto avancé.',
      n3: 'Recordarme que esta confianza la construí yo.',
      n4: 'Me diría: gracias por no soltarme. Estoy orgullosa de vos.' } },
  },
];

function dtSeedDemo(state) {
  const next = { ...state, entries: { ...state.entries } };
  DT_DEMO_DAYS.forEach((d, i) => { next.entries[i + 1] = d; });
  next.cycleLength = 7;
  next.currentDay = 7;
  next.onboarded = true;
  next.usedDemo = true;
  // backdate start so the calendar reads naturally
  const start = new Date();
  start.setDate(start.getDate() - 6);
  next.startDate = start.toISOString();
  return next;
}

Object.assign(window, {
  dtDefaultState, dtLoad, dtSave, dtReset,
  dtDayStatus, dtCompletedDays, dtSeedDemo, DT_DEMO_DAYS,
});
