// Note-reading drill (solfège, in the spirit of the Méthode Rose): a note appears, play it.
(function (PR) {
  'use strict';
  const { $, $$, esc } = PR;

  const LEVELS = {
    1: { label: 'Vị trí Đô (5 nốt)', treble: ['C4', 'G4'], bass: ['C3', 'G3'] },
    2: { label: 'Một quãng tám', treble: ['C4', 'C5'], bass: ['C3', 'C4'] },
    3: { label: 'Cả khuông nhạc', treble: ['C4', 'G5'], bass: ['F2', 'C4'] },
    4: { label: 'Thêm dòng kẻ phụ', treble: ['A3', 'C6'], bass: ['C2', 'E4'] },
  };
  const COUNT = 20;

  function pool(clef, level) {
    const [a, b] = LEVELS[level][clef].map(PR.Notes.parsePitch);
    const out = [];
    for (let d = a.diatonic; d <= b.diatonic; d++) {
      const letter = PR.Notes.LETTERS[((d % 7) + 7) % 7];
      out.push(PR.Notes.parsePitch(letter + Math.floor(d / 7)));
    }
    return out.map((k) => ({ clef, key: k }));
  }

  PR.views.drill = function (root) {
    let cfg = { clef: 'treble', level: 1, strict: true };
    try { Object.assign(cfg, JSON.parse(localStorage.getItem('pianoRose.drill') || '{}')); } catch (e) { /* ignore */ }

    root.innerHTML = `
      <section class="drill-view">
        <div class="drill-setup card">
          <h1>Luyện đọc nốt</h1>
          <p class="muted">Một nốt nhạc hiện lên – hãy chơi đúng phím đó càng nhanh càng tốt. ${COUNT} câu mỗi lượt.</p>
          <div class="field"><span>Khóa nhạc</span>
            <div class="seg" data-group="clef">
              <button data-v="treble">Khóa Son</button><button data-v="bass">Khóa Fa</button><button data-v="both">Cả hai</button>
            </div></div>
          <div class="field"><span>Mức độ</span>
            <div class="seg" data-group="level">${Object.entries(LEVELS).map(([k, l]) => `<button data-v="${k}">${l.label}</button>`).join('')}</div></div>
          <label class="chk"><input type="checkbox" class="strict"> Bắt buộc đúng quãng tám (tắt nếu bàn phím của bạn ít phím)</label>
          <div><button class="btn primary start">▶ Bắt đầu</button></div>
        </div>
        <div class="drill-play" hidden>
          <div class="drill-top">
            <div class="drill-meta"><span>Câu <b class="q-num">1</b>/${COUNT}</span><span>Đúng <b class="q-ok">0</b></span><span>Chuỗi <b class="q-streak">0</b> 🔥</span></div>
            <button class="btn ghost small stop">Kết thúc</button>
          </div>
          <div class="score-card drill-score"><div class="score-wrap"></div><div class="drill-fb"></div></div>
        </div>
        <div class="piano-wrap"></div>
      </section>`;

    const piano = new PR.Piano($('.piano-wrap', root), 36, 84);
    piano.centerOn(60);
    // Note names on the keys would give the answer away during a round.
    const showKeyNames = (on) => { piano.hideNoteNames = !on; piano.updateLabels(); };
    const setupEl = $('.drill-setup', root), playEl = $('.drill-play', root);
    const wrap = $('.score-wrap', root), fb = $('.drill-fb', root);

    function syncSetup() {
      $$('.seg[data-group="clef"] button', root).forEach((b) => b.classList.toggle('on', b.dataset.v === cfg.clef));
      $$('.seg[data-group="level"] button', root).forEach((b) => b.classList.toggle('on', +b.dataset.v === +cfg.level));
      $('.strict', root).checked = cfg.strict;
      try { localStorage.setItem('pianoRose.drill', JSON.stringify(cfg)); } catch (e) { /* ignore */ }
    }
    $$('.seg[data-group="clef"] button', root).forEach((b) => b.addEventListener('click', () => { cfg.clef = b.dataset.v; syncSetup(); }));
    $$('.seg[data-group="level"] button', root).forEach((b) => b.addEventListener('click', () => { cfg.level = +b.dataset.v; syncSetup(); }));
    $('.strict', root).addEventListener('change', (e) => { cfg.strict = e.target.checked; syncSetup(); });
    syncSetup();

    let game = null;

    function start() {
      const items = cfg.clef === 'both' ? [...pool('treble', cfg.level), ...pool('bass', cfg.level)] : pool(cfg.clef, cfg.level);
      game = { items, n: 0, ok: 0, streak: 0, best: 0, times: [], cur: null, tries: 0, at: 0, lock: false };
      setupEl.hidden = true;
      playEl.hidden = false;
      showKeyNames(false);
      next();
    }

    function next() {
      if (game.n >= COUNT) return end();
      let pick;
      do { pick = game.items[Math.floor(Math.random() * game.items.length)]; }
      while (game.cur && game.items.length > 1 && pick.key.midi === game.cur.key.midi);
      game.cur = pick;
      game.tries = 0;
      game.lock = false;
      game.at = performance.now();
      const staves = cfg.clef === 'both' ? ['treble', 'bass'] : [pick.clef];
      const sc = { staves, notes: [{ id: 'q', staff: pick.clef, keys: [pick.key], base: 'w', beats: 1, start: 0 }], total: 1, timeSig: null };
      const v = PR.Staff.renderScore(wrap, sc, { showNames: false, noBars: true, startX: 120 });
      v.hideCursor();
      const zoom = 1.6;
      v.svg.setAttribute('width', v.width * zoom);
      v.svg.setAttribute('height', v.svg.getAttribute('height') * zoom);
      game.view = v;
      piano.setHints(null);
      fb.textContent = '';
      fb.className = 'drill-fb';
      $('.q-num', root).textContent = game.n + 1;
      $('.q-ok', root).textContent = game.ok;
      $('.q-streak', root).textContent = game.streak;
    }

    function answer(m) {
      if (!game || game.lock || !game.cur) return;
      const target = game.cur.key.midi;
      const right = cfg.strict ? m === target : m % 12 === target % 12;
      if (right) {
        game.lock = true;
        const dt = (performance.now() - game.at) / 1000;
        if (game.tries === 0) { game.ok++; game.streak++; game.best = Math.max(game.best, game.streak); game.times.push(dt); }
        game.n++;
        piano.flash(m, 'ok');
        game.view.setState('q', 'ok');
        fb.innerHTML = `✓ ${esc(PR.Notes.keyLabel(game.cur.key, true))} <small>${dt.toFixed(1)} giây</small>`;
        fb.className = 'drill-fb good';
        setTimeout(next, 650);
      } else {
        game.tries++;
        game.streak = 0;
        piano.flash(m, 'bad');
        game.view.flash('q', 'shake');
        fb.textContent = `✗ Không phải ${PR.Notes.label(m, true)}`;
        fb.className = 'drill-fb bad';
        if (game.tries >= 2) {
          piano.setHints(new Map([[target, '']]));
          fb.textContent += ` – gợi ý: ${PR.Notes.keyLabel(game.cur.key, true)}`;
        }
        $('.q-streak', root).textContent = 0;
      }
    }

    function end() {
      const g = game;
      game = null;
      piano.setHints(null);
      setupEl.hidden = false;
      playEl.hidden = true;
      showKeyNames(true);
      if (!g || !g.n) return;
      const avg = g.times.length ? (g.times.reduce((a, b) => a + b, 0) / g.times.length).toFixed(1) : '–';
      PR.modal(`
        <div class="result">
          <h2>Kết quả</h2>
          <p class="big">${g.ok}/${g.n}</p>
          <p>đúng ngay lần đầu · trung bình <b>${avg} giây</b>/nốt · chuỗi dài nhất <b>${g.best}</b></p>
        </div>`, [{ label: 'Chơi lại', cls: 'primary', onClick: start }, { label: 'Đóng' }]);
    }

    $('.start', root).addEventListener('click', start);
    $('.stop', root).addEventListener('click', end);

    return {
      piano,
      onNoteOn: answer,
      onSettings(k) { if (k === 'keyLabels' || k === 'naming') piano.updateLabels(); },
      destroy() { game = null; },
    };
  };
})(window.PR);
