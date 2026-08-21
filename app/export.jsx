// export.jsx — cycle summary as a shareable image (PNG) or PDF.

function dtRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function dtBlob(ctx, x, y, r, color, alpha) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
}

// Wrap into lines using the font already set on ctx.
function dtLines(ctx, font, text, maxW) {
  ctx.font = font;
  const words = String(text).split(' ');
  const out = []; let line = '';
  words.forEach(w => {
    const t = line ? line + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; }
    else line = t;
  });
  if (line) out.push(line);
  return out;
}

function dtDrawLines(ctx, lines, x, y, lh) {
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lh));
}

// Lay out the word cloud into rows; positions are relative to (0,0).
function dtCloudLayout(ctx, words, maxW) {
  if (!words.length) return { items: [], rows: 0 };
  const max = words[0].n, min = words[words.length - 1].n;
  const items = []; let x = 0, row = 0;
  words.forEach((w, i) => {
    const t = max === min ? 1 : (w.n - min) / (max - min);
    const fs = Math.round(28 + t * 34);
    ctx.font = `600 ${fs}px "Cormorant Garamond", Georgia, serif`;
    const ww = ctx.measureText(w.word).width;
    if (x + ww > maxW && x > 0) { x = 0; row += 1; }
    items.push({ word: w.word, fs, x, row, alpha: 0.6 + t * 0.4, tone: i });
    x += ww + 30;
  });
  return { items, rows: row + 1 };
}

const DT_POSTER = { W: 1080, M: 84, ROW: 68, MOOD_H: 300, STAT_H: 150, GAP: 28 };

// Build the poster at a height measured from its own content.
function dtBuildSummary(state, paletteKey, name) {
  const p = DT_PALETTES[paletteKey] || DT_PALETTES.rosa;
  const a = dtAnalyze(state.entries, state.cycleLength);
  const { W, M, ROW, MOOD_H, STAT_H, GAP } = DT_POSTER;
  const cardW = W - M * 2, innerW = cardW - 80;

  const F_HEAD = 'italic 600 68px "Cormorant Garamond", Georgia, serif';
  const F_INSIGHT = 'italic 500 38px "Cormorant Garamond", Georgia, serif';

  // ── measure pass ──
  const mc = document.createElement('canvas').getContext('2d');
  const headText = name ? `${name}, esto se repitió en vos` : 'Esto se repitió en vos';
  const headLines = dtLines(mc, F_HEAD, headText, cardW);
  const words = a.topWords.slice(0, 12);
  const cloud = dtCloudLayout(mc, words, innerW);
  const themes = a.themes.slice(0, 5);
  const keyInsight = a.insights.find(i => i.kind === 'theme') || a.insights[0];
  const insightLines = keyInsight ? dtLines(mc, F_INSIGHT, keyInsight.text, cardW) : [];

  const wordmarkY = 128;
  const metaY = wordmarkY + 46;
  const headY = metaY + 78;                       // first headline baseline
  const moodY = headY + headLines.length * 76 + 34;
  const statY = moodY + MOOD_H + GAP;
  const wordsY = statY + STAT_H + GAP;
  const wordsH = 128 + Math.max(0, cloud.rows - 1) * ROW + 36;
  const themesY = wordsY + wordsH + GAP;
  const themesH = 92 + themes.length * 62;
  const insightY = themesY + themesH + 34 + 38;   // first insight baseline
  const contentBottom = insightY + Math.max(0, insightLines.length - 1) * 50;
  const footerY = contentBottom + 96;
  const H = Math.round(footerY + 80);

  // ── draw pass ──
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = p.bg; ctx.fillRect(0, 0, W, H);
  dtBlob(ctx, W - 60, -40, 460, p.soft, 0.55);
  dtBlob(ctx, -80, H * 0.3, 420, p.primary, 0.16);
  dtBlob(ctx, W + 40, H - 180, 460, p.soft, 0.4);

  // wordmark + meta
  ctx.fillStyle = p.ink;
  ctx.font = '400 92px Parisienne, cursive';
  ctx.fillText('DescubrirTe', M, wordmarkY);
  ctx.fillStyle = p.primary;
  ctx.font = '600 24px Jost, sans-serif';
  const start = new Date(state.startDate);
  const end = new Date(start); end.setDate(end.getDate() + state.cycleLength - 1);
  const fmt = d => d.toLocaleDateString('es', { day: 'numeric', month: 'short' });
  ctx.fillText(`MI CICLO DE ${state.cycleLength} DÍAS · ${fmt(start)} — ${fmt(end)}`.toUpperCase(), M, metaY);

  // headline
  ctx.fillStyle = p.ink; ctx.font = F_HEAD;
  dtDrawLines(ctx, headLines, M, headY, 76);

  // ── mood card ──
  ctx.fillStyle = 'rgba(255,255,255,0.86)';
  dtRoundRect(ctx, M, moodY, cardW, MOOD_H, 36); ctx.fill();
  ctx.fillStyle = p.primary; ctx.font = '600 22px Jost, sans-serif';
  ctx.fillText('ÁNIMO EN EL TIEMPO', M + 40, moodY + 56);
  const avgTxt = a.moodAvg.toFixed(1);
  ctx.fillStyle = p.ink; ctx.font = '600 84px "Cormorant Garamond", Georgia, serif';
  ctx.fillText(avgTxt, M + 40, moodY + 148);
  const avgW = ctx.measureText(avgTxt).width;
  ctx.fillStyle = p.inkSoft; ctx.font = '400 26px Jost, sans-serif';
  ctx.fillText('promedio de 5', M + 40 + avgW + 28, moodY + 148);

  const series = a.moodNight.length ? a.moodNight : a.moodMorning;
  if (series.length > 1) {
    const cx0 = M + 40, cy0 = moodY + 186, cw = innerW, ch = 74;
    const maxDay = state.cycleLength;
    const px = d => cx0 + ((d - 1) / Math.max(1, maxDay - 1)) * cw;
    const py = v => cy0 + ch - ((v - 1) / 4) * ch;
    ctx.beginPath();
    series.forEach((s, i) => { const X = px(s.day), Y = py(s.v); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
    ctx.strokeStyle = p.primary; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
    series.forEach(s => {
      ctx.beginPath(); ctx.arc(px(s.day), py(s.v), 8, 0, Math.PI * 2);
      ctx.fillStyle = '#fff'; ctx.fill();
      ctx.strokeStyle = p.primary; ctx.lineWidth = 4; ctx.stroke();
    });
    ctx.fillStyle = p.inkFaint; ctx.font = '400 20px Jost, sans-serif';
    ctx.fillText('Día 1', cx0, cy0 + ch + 38);
    const lbl = 'Día ' + maxDay;
    ctx.fillText(lbl, cx0 + cw - ctx.measureText(lbl).width, cy0 + ch + 38);
  }

  // ── energy / sleep ──
  const halfW = (cardW - 24) / 2;
  [['ENERGÍA', a.energyAvg, p.primary, M], ['DESCANSO', a.sleepAvg, p.soft, M + halfW + 24]]
    .forEach(([lbl, val, col, x]) => {
      ctx.fillStyle = 'rgba(255,255,255,0.86)';
      dtRoundRect(ctx, x, statY, halfW, STAT_H, 32); ctx.fill();
      ctx.fillStyle = col; ctx.font = '600 20px Jost, sans-serif';
      ctx.fillText(lbl, x + 34, statY + 48);
      const v = val.toFixed(1);
      ctx.fillStyle = p.ink; ctx.font = '600 62px "Cormorant Garamond", Georgia, serif';
      ctx.fillText(v, x + 34, statY + 116);
      const vw = ctx.measureText(v).width;
      ctx.fillStyle = p.inkFaint; ctx.font = '400 24px Jost, sans-serif';
      ctx.fillText('/5', x + 34 + vw + 12, statY + 116);
    });

  // ── words card ──
  ctx.fillStyle = 'rgba(255,255,255,0.86)';
  dtRoundRect(ctx, M, wordsY, cardW, wordsH, 36); ctx.fill();
  ctx.fillStyle = p.primary; ctx.font = '600 22px Jost, sans-serif';
  ctx.fillText('PALABRAS QUE MÁS REPETÍ', M + 40, wordsY + 56);
  const tones = [p.ink, p.primary, p.soft, p.inkSoft, p.primaryDeep];
  cloud.items.forEach(it => {
    ctx.font = `600 ${it.fs}px "Cormorant Garamond", Georgia, serif`;
    ctx.fillStyle = tones[it.tone % tones.length];
    ctx.globalAlpha = it.alpha;
    ctx.fillText(it.word, M + 40 + it.x, wordsY + 128 + it.row * ROW);
    ctx.globalAlpha = 1;
  });

  // ── themes card ──
  ctx.fillStyle = 'rgba(255,255,255,0.86)';
  dtRoundRect(ctx, M, themesY, cardW, themesH, 36); ctx.fill();
  ctx.fillStyle = p.primary; ctx.font = '600 22px Jost, sans-serif';
  ctx.fillText('LO QUE MÁS APARECIÓ', M + 40, themesY + 56);
  const maxT = themes.length ? themes[0].count : 1;
  themes.forEach((t, i) => {
    const ty = themesY + 108 + i * 62;
    ctx.fillStyle = p.ink; ctx.font = '500 27px Jost, sans-serif';
    ctx.fillText(t.label, M + 40, ty);
    ctx.fillStyle = p.softBg;
    dtRoundRect(ctx, M + 40, ty + 14, innerW, 14, 7); ctx.fill();
    ctx.fillStyle = t.color;
    dtRoundRect(ctx, M + 40, ty + 14, Math.max(14, innerW * (t.count / maxT)), 14, 7); ctx.fill();
  });

  // ── closing insight ──
  if (insightLines.length) {
    ctx.fillStyle = p.ink; ctx.font = F_INSIGHT;
    dtDrawLines(ctx, insightLines, M, insightY, 50);
  }

  // ── footer ──
  ctx.fillStyle = p.primary;
  ctx.font = '400 46px Parisienne, cursive';
  const tag = 'Lo que se mide, se puede transformar.';
  ctx.fillText(tag, (W - ctx.measureText(tag).width) / 2, footerY);

  return c;
}

function dtDownloadCanvas(canvas, filename) {
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }, 'image/png');
}

// Print the poster as a single-page PDF via a hidden iframe.
function dtPrintCanvas(canvas) {
  const data = canvas.toDataURL('image/png');
  const f = document.createElement('iframe');
  f.style.cssText = 'position:fixed;width:0;height:0;border:0;left:-9999px';
  document.body.appendChild(f);
  const d = f.contentDocument;
  d.open();
  d.write(`<!DOCTYPE html><html><head><style>
    @page{size:${canvas.width}px ${canvas.height}px;margin:0}
    html,body{margin:0;padding:0}img{display:block;width:${canvas.width}px;height:${canvas.height}px}
  </style></head><body><img src="${data}"></body></html>`);
  d.close();
  const go = () => { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) {} setTimeout(() => f.remove(), 60000); };
  const img = d.querySelector('img');
  if (img && !img.complete) img.onload = () => setTimeout(go, 120); else setTimeout(go, 220);
}

Object.assign(window, { dtBuildSummary, dtDownloadCanvas, dtPrintCanvas, dtCloudLayout });
