// app.jsx — DescubrirTe 21 root: routing, state, settings, tweaks, device frame.
const { useState: aUseState, useEffect: aUseEffect, useRef: aUseRef } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "rosa",
  "promptFont": "serif",
  "decor": "acuarela",
  "device": "iPhone",
  "userName": ""
}/*EDITMODE-END*/;

// Device presets for the preview frame. --sbar/--nbar tell the screens how much
// room the frame's own status bar / nav bar already takes.
const DT_DEVICES = {
  iPhone: { w: 402, h: 874, sbar: '54px', nbar: 22 },
  Android: { w: 412, h: 892, sbar: '8px', nbar: 6 },
};

function dtPromptVars(promptFont) {
  const pf = DT_PROMPT_FONTS[promptFont] || DT_PROMPT_FONTS.serif;
  return {
    '--f-prompt': pf.family,
    '--prompt-style': pf.italic ? 'italic' : 'normal',
    '--prompt-weight': String(pf.weight),
    '--prompt-scale': String(pf.scale),
  };
}

function dtFilledDays(state) {
  let n = 0;
  for (let d = 1; d <= state.cycleLength; d++) {
    const e = state.entries[d];
    if (e && (e.morning || e.night)) n++;
  }
  return n;
}

// ── Scale-to-fit stage ─────────────────────────────────────────
function DTStage({ children, w = 402, h = 874 }) {
  const [scale, setScale] = aUseState(1);
  aUseEffect(() => {
    const fit = () => {
      const pad = 24;
      const sw = (window.innerWidth - pad) / w;
      const sh = (window.innerHeight - pad) / h;
      setScale(Math.min(1, sw, sh));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [w, h]);
  return (
    <div style={{ width: '100vw', height: '100vh', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
      <div style={{ width: w * scale, height: h * scale, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: w, height: h,
          transform: `scale(${scale})`, transformOrigin: 'top left' }}>{children}</div>
      </div>
    </div>
  );
}

function DTApp() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [state, setState] = aUseState(dtLoad);
  const [tab, setTab] = aUseState('home');
  const [checkin, setCheckin] = aUseState(null); // {mode, day}
  const [settings, setSettings] = aUseState(false);
  const [detailDay, setDetailDay] = aUseState(null);
  const [readDate, setReadDate] = aUseState(null); // { key, days }
  const [alarm, setAlarm] = aUseState(null);
  const [alarmStatus, setAlarmStatus] = aUseState({ triggers: false, scheduled: 0 });
  const [exportOpen, setExportOpen] = aUseState(false);
  const [exportImg, setExportImg] = aUseState(null);
  const [notifyState, setNotifyState] = aUseState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');
  const [exercise, setExercise] = aUseState(null);
  const canvasRef = aUseRef(null);
  const standalone = dtIsStandalone();
  const inst = useDTInstall();

  aUseEffect(() => { dtSave(state); }, [state]);
  aUseEffect(() => {
    const tick = () => setState(s => dtAdvanceDay(s));
    tick();
    const id = setInterval(tick, 60 * 1000);
    const onVis = () => { if (document.visibilityState === 'visible') tick(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  const name = (state.name != null && state.name !== '' ? state.name : (t.userName || '')).trim();
  const paletteKey = DT_PALETTES[state.palette] ? state.palette : t.palette;
  const setName = (v) => setState(s => ({ ...s, name: v }));
  const setPalette = (k) => setState(s => ({ ...s, palette: k }));
  const filled = dtFilledDays(state);
  const unlocked = filled >= 3;
  const reminders = { ...dtDefaultReminders(), ...(state.reminders || {}) };
  const stateRef = aUseRef(state); stateRef.current = state;

  // ── reminders ──
  const fireAlarm = (mode) => {
    if (mode === 'exercise' && stateRef.current.exerciseDoneOn === dtLocalKey()) return;
    dtChime();
    const copy = {
      morning: ['Tu momento de la mañana', 'Encontrate con vos antes de empezar el día.'],
      night: ['Tu momento de la noche', 'Cerrá tu día escribiendo cómo te fue.'],
      exercise: ['Tu ejercicio del día', 'Todavía estás a tiempo: son 10 minutos para vos.'],
    }[mode] || [];
    dtNotify(copy[0], copy[1], mode);
    setAlarm(mode);
  };
  useDTReminders(reminders, fireAlarm);

  // ── PWA: service worker, deep links, background reminders ──
  aUseEffect(() => {
    dtRegisterSW();
    const params = new URLSearchParams(location.search);
    const ci = params.get('checkin');
    const tb = params.get('tab');
    if (ci === 'morning' || ci === 'night') setCheckin({ mode: ci, day: state.currentDay });
    else if (params.get('exercise')) setExercise(state.currentDay);
    else if (tb === 'patterns') setTab('patterns');
    const onMsg = e => {
      const d = e.data || {};
      if (d.type === 'open-checkin' && (d.mode === 'morning' || d.mode === 'night')) {
        setCheckin({ mode: d.mode, day: state.currentDay });
      } else if (d.type === 'open-exercise') {
        setExercise(stateRef.current.currentDay);
      } else if (d.type === 'alarm-status') {
        setAlarmStatus({ triggers: !!d.triggers, scheduled: d.scheduled || 0 });
      }
    };
    navigator.serviceWorker && navigator.serviceWorker.addEventListener('message', onMsg);
    const onVis = () => {
      if (document.visibilityState === 'visible') { dtCheckDue(); dtAskAlarmStatus(); }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      navigator.serviceWorker && navigator.serviceWorker.removeEventListener('message', onMsg);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  aUseEffect(() => { dtSyncReminders({ ...reminders, exerciseDoneOn: state.exerciseDoneOn || '' }); },
    [reminders.on, reminders.morning, reminders.night, reminders.exOn, reminders.exNoon,
     reminders.exSiesta, reminders.exBefore, state.exerciseDoneOn]);

  // ── Android hardware back closes the top layer instead of leaving the app ──
  const overlayOpen = !!(checkin || exercise || settings || detailDay != null || readDate || exportOpen || alarm);
  const overlayPushed = aUseRef(false);
  const poppingBack = aUseRef(false);
  aUseEffect(() => {
    if (overlayOpen && !overlayPushed.current) {
      overlayPushed.current = true;
      try { history.pushState({ dtLayer: true }, ''); } catch (e) {}
    } else if (!overlayOpen && overlayPushed.current) {
      overlayPushed.current = false;
      if (poppingBack.current) { poppingBack.current = false; return; }
      try { if (history.state && history.state.dtLayer) history.back(); } catch (e) {}
    }
  }, [overlayOpen]);
  aUseEffect(() => {
    const onPop = () => {
      if (!overlayOpen) return;
      poppingBack.current = true;
      if (alarm) setAlarm(null);
      else if (exportOpen) setExportOpen(false);
      else if (detailDay != null) setDetailDay(null);
      else if (readDate) setReadDate(null);
      else if (settings) setSettings(false);
      else if (exercise) setExercise(null);
      else if (checkin) setCheckin(null);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [overlayOpen, alarm, exportOpen, detailDay, readDate, settings, exercise, checkin]);

  const setReminders = (patch) => setState(s => ({
    ...s, reminders: { ...(s.reminders || dtDefaultReminders()), ...patch },
  }));
  const toggleReminders = async (on) => {
    if (on) {
      const res = await dtAskNotify();
      setNotifyState(res);
    }
    setReminders({ on });
  };
  const snooze = () => {
    const mode = alarm;
    setAlarm(null);
    dtSnoozeBg(mode);                                   // suena aunque cierre la app
    setTimeout(() => fireAlarm(mode), 10 * 60 * 1000);  // y también si sigue abierta
  };

  // ── export ──
  const openExport = () => {
    const canvas = dtBuildSummary(state, paletteKey, name);
    canvasRef.current = canvas;
    setExportImg(canvas.toDataURL('image/png'));
    setExportOpen(true);
  };

  // ── actions ──
  const startJourney = (chosenName) => {
    setState(s => ({ ...s, name: (chosenName || '').trim(), cycleLength: 7,
      onboarded: true, currentDay: 1, startDate: new Date().toISOString() }));
  };
  // Empezar una semana nueva: se conservan nombre, paleta y recordatorios.
  const startWeek = () => {
    setState(s => ({ ...s, cycleLength: 7, entries: {}, dayDates: {}, currentDay: 1, usedDemo: false,
      onboarded: true, startDate: new Date().toISOString() }));
    setTab('home');
    setSettings(false);
  };
  const openCheckin = (mode, day = state.currentDay) => { setCheckin({ mode, day }); setDetailDay(null); };
  const openExercise = (day = state.currentDay) => { setExercise(day); setDetailDay(null); };
  const saveExercise = (data) => {
    const day = exercise;
    setState(s => ({
      ...s,
      entries: { ...s.entries, [day]: { ...(s.entries[day] || {}), exercise: data } },
      dayDates: { ...(s.dayDates || {}), [day]: (s.dayDates && s.dayDates[day]) || dtLocalKey() },
      exerciseDoneOn: day === s.currentDay ? dtLocalKey() : s.exerciseDoneOn,
    }));
    setExercise(null);
  };
  const saveCheckin = (data) => {
    const { mode, day } = checkin;
    setState(s => {
      const entries = { ...s.entries, [day]: { ...(s.entries[day] || {}), [mode]: data } };
      const dayDates = { ...(s.dayDates || {}), [day]: (s.dayDates && s.dayDates[day]) || dtLocalKey() };
      return { ...s, entries, dayDates };
    });
    setCheckin(null);
  };
  const loadDemo = () => { setState(s => dtSeedDemo(s)); setTab('patterns'); setSettings(false); };
  const resetAll = () => { dtReset(); setState(dtDefaultState()); setTab('home'); setSettings(false); };

  // theme vars
  const dev = DT_DEVICES[t.device] || DT_DEVICES.iPhone;
  const rootVars = { ...dtThemeVars(paletteKey), ...dtPromptVars(t.promptFont),
    '--sbar': standalone ? '10px' : dev.sbar };
  const patternsRich = tab === 'patterns' && unlocked;
  const statusDark = patternsRich;

  // ── render content ──
  let content;
  if (!state.onboarded) {
    content = <DTWelcome onStart={startJourney} decor={t.decor} />;
  } else if (exercise) {
    content = (
      <DTExercise day={exercise} initial={state.entries[exercise]?.exercise}
        onSave={saveExercise} onClose={() => setExercise(null)} />
    );
  } else if (checkin) {
    const init = state.entries[checkin.day]?.[checkin.mode];
    content = (
      <DTCheckin mode={checkin.mode} day={checkin.day} initial={init} name={name}
        onSave={saveCheckin} onClose={() => setCheckin(null)} />
    );
  } else {
    let screen;
    if (tab === 'home') screen = <DTHome state={{ ...state, name }} decor={t.decor}
      onOpen={(m) => openCheckin(m)} onSettings={() => setSettings(true)}
      onExercise={() => openExercise()} />;
    else if (tab === 'diary') screen = <DTDiary state={state} decor={t.decor} onOpenDate={(key, days) => setReadDate({ key, days })} />;
    else if (tab === 'journey') screen = <DTJourney state={state} decor={t.decor} onOpenDay={(d) => setDetailDay(d)} />;
    else screen = <DTPatterns state={state} onLoadDemo={loadDemo} onExport={unlocked ? openExport : null} />;
    content = (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>{screen}</div>
        <div style={{ paddingBottom: standalone ? 'calc(env(safe-area-inset-bottom, 0px) + 8px)' : dev.nbar,
          background: 'var(--surface)' }}>
          <DTBottomNav tab={tab} onTab={setTab} unlocked={unlocked} />
        </div>
      </div>
    );
  }

  const shell = (
          <div style={{ height: '100%', fontFamily: 'var(--f-sans)', color: 'var(--ink)',
            background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}>
            {content}

            <DTProfileSheet open={settings} onClose={() => setSettings(false)} state={state}
              setName={setName} setStartDate={v => setState(s => ({ ...s, startDate: v }))}
              reminders={reminders} setReminders={setReminders} toggleReminders={toggleReminders}
              notifyState={notifyState} setNotifyState={setNotifyState} alarmStatus={alarmStatus}
              paletteKey={paletteKey} setPalette={setPalette} inst={inst} onReset={resetAll} />

            <DTSheet open={!!readDate} onClose={() => setReadDate(null)}
              title={readDate ? new Date(readDate.key + 'T12:00:00').toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^./, c => c.toUpperCase()) : ''}>
              {readDate && <DTDiaryRead state={state} days={readDate.days} />}
            </DTSheet>

            {/* Day detail sheet */}
            <DTSheet open={detailDay != null} onClose={() => setDetailDay(null)}
              title={detailDay != null ? `Día ${detailDay}` : ''}>
              {detailDay != null && (
                <DTDayDetail state={state} day={detailDay}
                  onCheckin={(mode) => openCheckin(mode, detailDay)}
                  onExercise={() => openExercise(detailDay)} />
              )}
            </DTSheet>

            {/* Export sheet */}
            <DTSheet open={exportOpen} onClose={() => setExportOpen(false)} title="Tu resumen">
              {exportImg && (
                <div style={{ borderRadius: 18, overflow: 'hidden', border: '1px solid var(--line)',
                  marginBottom: 16, maxHeight: 300, overflowY: 'auto' }}>
                  <img src={exportImg} alt="Resumen del ciclo" style={{ width: '100%', display: 'block' }} />
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <DTButton onClick={() => canvasRef.current &&
                  dtDownloadCanvas(canvasRef.current, 'DescubrirTe-resumen.png')}>
                  Guardar imagen (PNG)
                </DTButton>
                <DTButton variant="soft" onClick={() => canvasRef.current && dtPrintCanvas(canvasRef.current)}>
                  Guardar como PDF
                </DTButton>
              </div>
              <p style={{ fontFamily: 'var(--f-sans)', fontSize: 12, color: 'var(--ink-faint)',
                textAlign: 'center', margin: '14px 0 0' }}>
                La imagen es ideal para compartir; el PDF, para guardar o imprimir.
              </p>
            </DTSheet>

            {/* Alarm overlay */}
            <DTAlarm mode={alarm} name={name}
              onWrite={() => { const m = alarm; setAlarm(null); if (m === 'exercise') openExercise(); else openCheckin(m); }}
              onSnooze={snooze}
              onClose={() => setAlarm(null)} />
          </div>
  );

  const tweaks = (
        <TweaksPanel>
          <TweakSection label="Apariencia" />
          <TweakColor label="Paleta" value={DT_PALETTES[paletteKey].swatch}
            options={Object.keys(DT_PALETTES).map(k => DT_PALETTES[k].swatch)}
            onChange={(arr) => {
              const key = Object.keys(DT_PALETTES).find(k => DT_PALETTES[k].swatch.join() === arr.join());
              if (key) { setTweak('palette', key); setPalette(key); }
            }} />
          <TweakRadio label="Decoración" value={t.decor}
            options={['acuarela', 'lineas', 'minimo']}
            onChange={(v) => setTweak('decor', v)} />
          <TweakSection label="Vista previa" />
          <TweakRadio label="Dispositivo" value={t.device}
            options={['iPhone', 'Android']}
            onChange={(v) => setTweak('device', v)} />
          <TweakSection label="Las preguntas" />
          <TweakRadio label="Tipografía" value={t.promptFont}
            options={['serif', 'script', 'sans']}
            onChange={(v) => setTweak('promptFont', v)} />
          <TweakSection label="Personal" />
          <TweakText label="Tu nombre" value={state.name || ''}
            onChange={(v) => setName(v)} placeholder="Sofía" />
        </TweaksPanel>
  );

  if (standalone) {
    return (
      <div style={{ ...rootVars, width: '100vw', height: '100dvh', overflow: 'hidden',
        boxSizing: 'border-box', background: 'var(--bg)',
        paddingTop: 'max(0px, calc(env(safe-area-inset-top, 0px) - 40px))' }}>
        {shell}
        {tweaks}
      </div>
    );
  }

  return (
    <DTStage w={dev.w} h={dev.h}>
      <div style={rootVars}>
        {t.device === 'Android'
          ? <AndroidDevice dark={statusDark}>{shell}</AndroidDevice>
          : <IOSDevice dark={statusDark}>{shell}</IOSDevice>}
        {tweaks}
      </div>
    </DTStage>
  );
}

function dtSlabel() {
  return { display: 'block', fontFamily: 'var(--f-sans)', fontSize: 13, fontWeight: 600,
    color: 'var(--ink)', marginBottom: 8, letterSpacing: 0.3 };
}
function dtInput() {
  return { width: '100%', boxSizing: 'border-box', border: '1px solid var(--line)', borderRadius: 14,
    padding: '13px 15px', fontFamily: 'var(--f-sans)', fontSize: 15, color: 'var(--ink)',
    background: 'var(--surface-2)', outline: 'none' };
}

ReactDOM.createRoot(document.getElementById('root')).render(<DTApp />);
