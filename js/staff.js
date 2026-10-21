// Staff renderer: draws a single-line, horizontally scrolling score in SVG
// (treble, bass or grand staff), with a moving cursor and per-note states.
(function (PR) {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const S = 10; // distance between staff lines
  const CLEF = {
    treble: { bottomD: 30, glyph: '\u{1D11E}' }, // bottom line E4
    bass: { bottomD: 18, glyph: '\u{1D122}' },   // bottom line G2
  };

  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  function layoutStaves(names) {
    const out = {};
    let y = 62;
    names.forEach((name) => {
      const st = { name, top: y, bottom: y + 4 * S, bottomD: CLEF[name].bottomD };
      st.yOf = (d) => st.bottom - (d - st.bottomD) * S / 2;
      st.midD = st.bottomD + 4;
      out[name] = st;
      y += 4 * S + 100;
    });
    return out;
  }

  const spacing = (dt) => 24 + 30 * Math.sqrt(dt);

  function drawClef(g, st, x) {
    if (st.name === 'treble') {
      el('text', { x, y: st.bottom + 9, class: 'clef', 'font-size': 66 }, g).textContent = CLEF.treble.glyph;
    } else {
      el('text', { x: x + 2, y: st.top + 30, class: 'clef', 'font-size': 64 }, g).textContent = CLEF.bass.glyph;
    }
  }

  function drawRest(g, x, st, base) {
    const t = st.top;
    if (base === 'w') el('rect', { x: x - 7, y: t + 10, width: 14, height: 5, class: 'rest-shape' }, g);
    else if (base === 'h') el('rect', { x: x - 7, y: t + 15, width: 14, height: 5, class: 'rest-shape' }, g);
    else if (base === 'q') {
      el('path', { d: `M${x - 3} ${t + 6} l7 8.5 l-6 6.5 l7 8.5 c-6 -3 -10 1 -4 7.5`, class: 'rest-q' }, g);
    } else {
      el('circle', { cx: x - 2.5, cy: t + 16, r: 2.6, class: 'rest-shape' }, g);
      el('path', { d: `M${x - 2} ${t + 18} q4 1 6.5 -3.5 L${x - 0.5} ${t + 31}`, class: 'rest-e' }, g);
    }
  }

  function drawAccidental(g, ax, y, acc) {
    if (acc > 0) {
      el('path', { d: `M${ax - 2.2} ${y - 10} v19 M${ax + 2.2} ${y - 11} v19`, class: 'acc-line' }, g);
      el('path', { d: `M${ax - 5.5} ${y - 2.2} L${ax + 5.5} ${y - 5.2} v2.8 L${ax - 5.5} ${y + 0.6} Z` +
        `M${ax - 5.5} ${y + 4.8} L${ax + 5.5} ${y + 1.8} v2.8 L${ax - 5.5} ${y + 7.6} Z`, class: 'acc-fill' }, g);
    } else {
      el('path', { d: `M${ax - 3} ${y - 14} V${y + 5}`, class: 'acc-line' }, g);
      el('path', { d: `M${ax - 3} ${y + 5} C${ax + 6} ${y} ${ax + 5} ${y - 6} ${ax - 3} ${y - 1}`, class: 'acc-line' }, g);
    }
  }

  // Draw one note/chord/rest. Returns the group and the stem extent (for label placement).
  function drawNote(layer, n, x, st, opts) {
    const g = el('g', { class: 'note' + (n.rest ? ' is-rest' : ''), 'data-id': n.id }, layer);
    if (n.rest) { drawRest(g, x, st, n.base); return g; }

    const ds = n.keys.map((k) => k.diatonic);
    const minD = Math.min(...ds), maxD = Math.max(...ds);
    const topLineD = st.bottomD + 8;
    const lw = n.base === 'w' ? 11 : 9.5;
    for (let d = st.bottomD - 2; d >= minD; d -= 2) el('line', { x1: x - lw, x2: x + lw, y1: st.yOf(d), y2: st.yOf(d), class: 'ledger' }, g);
    for (let d = topLineD + 2; d <= maxD; d += 2) el('line', { x1: x - lw, x2: x + lw, y1: st.yOf(d), y2: st.yOf(d), class: 'ledger' }, g);

    // Notes a second apart can't share a column: shift one head beside the stem.
    const x0 = x;
    const stemUp = n.base === 'w' || (minD + maxD) / 2 < st.midD;
    const shiftOf = new Map();
    n.keys.slice().sort((a, b) => a.diatonic - b.diatonic).forEach((k, i, arr) => {
      if (i && k.diatonic - arr[i - 1].diatonic === 1 && !shiftOf.get(arr[i - 1])) {
        if (stemUp) shiftOf.set(k, n.base === 'w' ? 15 : 12.4); else shiftOf.set(arr[i - 1], -12.4);
      }
    });

    let accIdx = 0;
    n.keys.forEach((k) => {
      const y = st.yOf(k.diatonic);
      const x = x0 + (shiftOf.get(k) || 0);
      let head;
      if (n.base === 'w') head = el('ellipse', { cx: x, cy: y, rx: 7.4, ry: 4.9, class: 'head hollow whole' }, g);
      else head = el('ellipse', { cx: x, cy: y, rx: 6.3, ry: 4.5, transform: `rotate(-22 ${x} ${y})`, class: 'head ' + (n.base === 'h' ? 'hollow' : 'filled') }, g);
      head.dataset.midi = k.midi;
      if (k.acc) drawAccidental(g, x0 - 17 - (accIdx++ % 2) * 10, y, k.acc);
      if (n.dotted) {
        const onLine = (((k.diatonic - st.bottomD) % 2) + 2) % 2 === 0;
        el('circle', { cx: x + (n.base === 'w' ? 13 : 11), cy: y - (onLine ? S / 2 : 0), r: 1.9, class: 'dot' }, g);
      }
    });

    let stemTop = st.yOf(maxD), stemBottom = st.yOf(minD);
    if (n.base !== 'w') {
      const up = (minD + maxD) / 2 < st.midD;
      let sx, y1, y2;
      if (up) { sx = x + 5.5; y1 = st.yOf(minD) - 1; y2 = st.yOf(maxD) - 34; stemTop = y2; }
      else { sx = x - 5.5; y1 = st.yOf(maxD) + 1; y2 = st.yOf(minD) + 34; stemBottom = y2; }
      el('line', { x1: sx, x2: sx, y1, y2, class: 'stem' }, g);
      if (n.base === 'e') {
        const dir = up ? 1 : -1;
        el('path', {
          d: `M${sx} ${y2} C${sx} ${y2 + 6 * dir} ${sx + 10} ${y2 + 9 * dir} ${sx + 8} ${y2 + 21 * dir} ` +
            `C${sx + 8} ${y2 + 13 * dir} ${sx + 4} ${y2 + 11 * dir} ${sx} ${y2 + 9 * dir} Z`, class: 'flag',
        }, g);
      }
    }

    if (n.finger) {
      const fy = st.name === 'treble' ? Math.min(st.top - 10, stemTop - 8) : Math.max(st.bottom + 20, stemBottom + 16);
      el('text', { x, y: fy, class: 'finger-num' }, g).textContent = n.finger.replace(/\+/g, ' ');
    }
    if (opts.showNames) {
      const ny = st.name === 'treble' ? Math.max(st.bottom + 24, stemBottom + 18) : Math.min(st.top - 12, stemTop - 10);
      const txt = n.keys.slice().sort((a, b) => b.midi - a.midi).map((k) => PR.Notes.keyLabel(k)).join(' ');
      el('text', { x, y: ny, class: 'note-name' }, g).textContent = txt;
    }
    return g;
  }

  /**
   * score: { staves:['treble','bass'], notes:[{id, staff, keys, rest, base, dotted, beats, start, finger}], total, timeSig|null }
   * opts: { showNames, noBars, startX }
   */
  function renderScore(container, score, opts) {
    opts = opts || {};
    container.innerHTML = '';
    const L = layoutStaves(score.staves);
    const first = L[score.staves[0]], last = L[score.staves[score.staves.length - 1]];
    const H = last.bottom + 62;

    // Horizontal layout: note columns and barlines.
    const measure = score.timeSig ? score.timeSig[0] * 4 / score.timeSig[1] : 0;
    const times = [...new Set(score.notes.map((n) => n.start))].sort((a, b) => a - b);
    const accAt = new Set(score.notes.filter((n) => n.keys && n.keys.some((k) => k.acc)).map((n) => n.start));
    const items = times.map((t) => ({ t, kind: 'col' }));
    if (measure && !opts.noBars) for (let b = measure; b < score.total - 1e-6; b += measure) items.push({ t: b, kind: 'bar' });
    items.sort((a, b) => a.t - b.t || (a.kind === 'bar' ? -1 : 1));

    let x = opts.startX || (score.timeSig ? 122 : 92);
    let prev = null;
    const colX = new Map(), bars = [];
    for (const it of items) {
      if (prev) {
        if (prev.kind === 'col') x += it.kind === 'col' ? spacing(it.t - prev.t) : Math.max(20, spacing(it.t - prev.t) - 16);
        else x += 24;
      }
      if (it.kind === 'col' && accAt.has(it.t)) x += 10;
      if (it.kind === 'col') colX.set(it.t, x); else bars.push(x);
      prev = it;
    }
    const lastT = times.length ? times[times.length - 1] : 0;
    const endX = Math.max(x + Math.max(34, spacing(Math.max(0.5, score.total - lastT)) - 6), (opts.minWidth || 0) - 24);
    const W = endX + 24;

    const svg = el('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}`, class: 'score' });
    const bg = el('g', { class: 'staff-bg' }, svg);
    const curLayer = el('g', {}, svg);
    const notesLayer = el('g', { class: 'notes' }, svg);

    // Staff lines, clefs, time signatures
    score.staves.forEach((name) => {
      const st = L[name];
      for (let i = 0; i < 5; i++) el('line', { x1: 8, x2: endX, y1: st.top + i * S, y2: st.top + i * S, class: 'staff-line' }, bg);
      drawClef(bg, st, 14);
      if (score.timeSig) {
        el('text', { x: 80, y: st.top + 19, class: 'timesig' }, bg).textContent = score.timeSig[0];
        el('text', { x: 80, y: st.top + 39, class: 'timesig' }, bg).textContent = score.timeSig[1];
      }
    });
    el('line', { x1: 8, x2: 8, y1: first.top, y2: last.bottom, class: 'barline' }, bg);
    if (score.staves.length > 1) el('path', { d: `M4 ${first.top} q-7 ${(last.bottom - first.top) / 4} 0 ${(last.bottom - first.top) / 2} q-7 ${(last.bottom - first.top) / 4} 0 ${(last.bottom - first.top) / 2}`, class: 'brace' }, bg);
    bars.forEach((bx) => el('line', { x1: bx, x2: bx, y1: first.top, y2: last.bottom, class: 'barline' }, bg));
    if (!opts.noBars) {
      el('line', { x1: endX - 7, x2: endX - 7, y1: first.top, y2: last.bottom, class: 'barline' }, bg);
      el('rect', { x: endX - 4, y: first.top, width: 4, height: last.bottom - first.top, class: 'barline-thick' }, bg);
    }

    // Cursor
    const cursor = el('rect', { x: -15, y: first.top - 40, width: 30, height: last.bottom - first.top + 80, rx: 9, class: 'cursor' }, curLayer);

    // Notes
    const noteEls = new Map();
    score.notes.forEach((n) => noteEls.set(n.id, drawNote(notesLayer, n, colX.get(n.start), L[n.staff], opts)));

    container.appendChild(svg);

    const cols = times.map((t) => ({ t, x: colX.get(t) }));
    cols.push({ t: score.total, x: endX - 14 });
    function timeToX(t) {
      if (t <= cols[0].t) return cols[0].x;
      for (let i = 1; i < cols.length; i++) {
        if (t <= cols[i].t) {
          const a = cols[i - 1], b = cols[i];
          return a.x + (b.x - a.x) * (t - a.t) / (b.t - a.t || 1);
        }
      }
      return cols[cols.length - 1].x;
    }

    return {
      svg, width: W, cols, noteEls, timeToX,
      setCursor(t, o) {
        o = o || {};
        const cx = timeToX(t);
        cursor.classList.toggle('no-anim', !!o.instant);
        cursor.style.transform = `translateX(${cx}px)`;
        cursor.style.display = '';
        this.follow(cx, o);
      },
      hideCursor() { cursor.style.display = 'none'; },
      follow(cx, o) {
        const vw = container.clientWidth, left = container.scrollLeft;
        if (o.continuous) { container.scrollLeft = Math.max(0, cx - vw * 0.3); return; }
        if (cx < left + 70 || cx > left + vw * 0.7) {
          container.scrollTo({ left: Math.max(0, cx - vw * 0.3), behavior: o.instant ? 'auto' : 'smooth' });
        }
      },
      setState(id, state) {
        const g = noteEls.get(id);
        if (!g) return;
        g.classList.remove('st-current', 'st-ok', 'st-late', 'st-miss', 'st-auto', 'st-played');
        if (state) g.classList.add('st-' + state);
      },
      setHead(id, midi, state) {
        const g = noteEls.get(id);
        if (!g) return;
        g.querySelectorAll(`.head[data-midi="${midi}"]`).forEach((h) => h.classList.toggle('k-' + state, true));
      },
      flash(id, cls) {
        const g = noteEls.get(id);
        if (!g) return;
        g.classList.remove(cls);
        void g.getBoundingClientRect();
        g.classList.add(cls);
        setTimeout(() => g.classList.remove(cls), 450);
      },
      reset() {
        for (const g of noteEls.values()) {
          g.classList.remove('st-current', 'st-ok', 'st-late', 'st-miss', 'st-auto', 'st-played', 'shake');
          g.querySelectorAll('.head').forEach((h) => h.classList.remove('k-ok'));
        }
      },
    };
  }

  // Build a score from a sequence of chords (arrays of midi numbers), splitting at middle C.
  function chordsToScore(chords, base) {
    const notes = [];
    chords.forEach((c, i) => {
      const hi = c.filter((m) => m >= 60).sort((a, b) => a - b);
      const lo = c.filter((m) => m < 60).sort((a, b) => a - b);
      if (hi.length) notes.push({ id: `c${i}t`, staff: 'treble', keys: hi.map(PR.Notes.spell), base: base || 'w', beats: 1, start: i });
      if (lo.length) notes.push({ id: `c${i}b`, staff: 'bass', keys: lo.map(PR.Notes.spell), base: base || 'w', beats: 1, start: i });
    });
    return { staves: ['treble', 'bass'], notes, total: Math.max(1, chords.length), timeSig: null };
  }

  PR.Staff = { renderScore, chordsToScore };
})(window.PR);
