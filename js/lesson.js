// Lesson view: score + piano, with three practice modes:
//  wait  – the cursor waits until you play the right note(s)
//  tempo – play along with the metronome, judged on timing
//  demo  – listen to the piece with the cursor following
(function (PR) {
  'use strict';
  const { $, $$, esc } = PR;

  const MODES = [
    { v: 'wait', label: 'Chờ nốt', tip: 'Con trỏ dừng lại chờ bạn chơi đúng nốt' },
    { v: 'tempo', label: 'Theo nhịp', tip: 'Chơi theo máy đếm nhịp, chấm điểm theo thời gian' },
    { v: 'demo', label: 'Nghe mẫu', tip: 'Nghe bản mẫu, con trỏ chạy theo' },
  ];
  const HAND_LABEL = { R: 'Tay phải', L: 'Tay trái', B: 'Hai tay' };

  PR.views.lesson = function (root, id) {
    const idx = PR.LESSONS.findIndex((l) => l.id === id);
    if (idx < 0) { location.hash = '#/'; return null; }
    const lesson = PR.LESSONS[idx];
    const part = PR.PARTS.find((p) => p.id === lesson.part);
    const prevL = PR.LESSONS[idx - 1], nextL = PR.LESSONS[idx + 1];
    const partIdx = PR.LESSONS.filter((l) => l.part === lesson.part).indexOf(lesson) + 1;
    const score = PR.buildScore(lesson);
    const measure = score.timeSig[0] * 4 / score.timeSig[1];
    const lessonHands = [...new Set(lesson.voices.map((v) => v.hand))];

    let mode = 'wait';
    let hand = lessonHands.length > 1 ? 'B' : lessonHands[0];
    let bpm = lesson.tempo;

    root.innerHTML = `
      <section class="lesson-view">
        <div class="lesson-head">
          <a class="back" href="#/">← Danh sách bài</a>
          <div class="lesson-title">
            <div class="eyebrow">Phần ${part.id} · ${esc(part.title)} · Bài ${partIdx}</div>
            <h1>${esc(lesson.title)}</h1>
          </div>
          <div class="lesson-nav">
            <a class="btn ghost small ${prevL ? '' : 'disabled'}" href="${prevL ? '#/lesson/' + prevL.id : '#/'}">‹ Bài trước</a>
            <a class="btn ghost small ${nextL ? '' : 'disabled'}" href="${nextL ? '#/lesson/' + nextL.id : '#/'}">Bài sau ›</a>
          </div>
        </div>
        <details class="theory" open><summary>📖 Lý thuyết</summary><div class="theory-body">${lesson.theory}</div></details>
        <div class="toolbar">
          <div class="seg" data-group="mode">${MODES.map((m) => `<button data-v="${m.v}" title="${m.tip}">${m.label}</button>`).join('')}</div>
          ${lessonHands.length > 1 ? `<div class="seg" data-group="hand">${['R', 'L', 'B'].map((h) => `<button data-v="${h}">${HAND_LABEL[h]}</button>`).join('')}</div>`
            : `<span class="pill">${HAND_LABEL[hand]}</span>`}
          <label class="tempo-ctl">♩ = <input type="range" min="40" max="160" step="2" value="${bpm}"><b class="bpm">${bpm}</b></label>
          <label class="chk"><input type="checkbox" class="metro" ${PR.settings.get('metronome') ? 'checked' : ''}> Máy đếm nhịp</label>
          <button class="btn primary go"></button>
        </div>
        <div class="score-card">
          <div class="score-wrap"></div>
          <div class="score-status"><span class="status-text"></span><span class="feedback"></span></div>
        </div>
        <div class="stats">
          <div><span>Tiến độ</span><b class="s-prog">0 / 0</b></div>
          <div><span>Đúng</span><b class="s-ok">0</b></div>
          <div><span>Sai</span><b class="s-bad">0</b></div>
          <div><span>Chính xác</span><b class="s-acc">–</b></div>
          <div class="bar"><i class="s-bar"></i></div>
        </div>
        <div class="piano-wrap"></div>
      </section>`;

    const wrap = $('.score-wrap', root);
    const statusText = $('.status-text', root);
    const feedback = $('.feedback', root);
    const goBtn = $('.go', root);
    const tempoInput = $('.tempo-ctl input', root);
    const metroInput = $('.metro', root);

    // Piano range: at least C3–C6, extended to cover the lesson.
    const midis = score.notes.flatMap((n) => n.keys.map((k) => k.midi));
    const lo = Math.min(48, Math.floor(Math.min(...midis) / 12) * 12);
    const hi = Math.max(84, Math.ceil((Math.max(...midis) + 1) / 12) * 12);
    const piano = new PR.Piano($('.piano-wrap', root), lo, hi);

    let view = null;
    const draw = () => { view = PR.Staff.renderScore(wrap, score, { showNames: PR.settings.get('showNames') }); };
    draw();

    // Onsets: every start time that has sounding notes.
    const onsetMap = new Map();
    score.notes.forEach((n) => {
      if (n.rest) return;
      if (!onsetMap.has(n.start)) onsetMap.set(n.start, []);
      onsetMap.get(n.start).push(n);
    });
    const onsets = [...onsetMap.keys()].sort((a, b) => a - b).map((t) => ({ t, notes: onsetMap.get(t) }));
    const isMine = (n) => hand === 'B' || n.hand === hand;

    let steps = [];
    let run = null;

    function buildSteps() {
      steps = onsets.filter((o) => o.notes.some(isMine)).map((o) => {
        const mine = o.notes.filter(isMine);
        return {
          t: o.t, mine, others: o.notes.filter((n) => !isMine(n)),
          req: new Set(mine.flatMap((n) => n.keys.map((k) => k.midi))),
          got: new Set(), done: false, ok: false, err: false,
        };
      });
    }

    function hintsFor(step) {
      const map = new Map();
      step.mine.forEach((n) => {
        const fingers = n.finger ? n.finger.split('+') : [];
        n.keys.forEach((k, i) => map.set(k.midi, fingers[i] || ''));
      });
      return map;
    }

    function describe(step) {
      return step.mine.map((n) => n.keys.map((k) => PR.Notes.keyLabel(k, true)).join(' + ') + (n.finger ? ` (ngón ${n.finger})` : '')).join('  ·  ');
    }

    function updateStats() {
      const done = steps.filter((s) => s.done).length;
      const ok = steps.filter((s) => s.ok).length;
      $('.s-prog', root).textContent = `${done} / ${steps.length}`;
      $('.s-ok', root).textContent = ok;
      $('.s-bad', root).textContent = run ? run.wrong : 0;
      $('.s-acc', root).textContent = done ? Math.round(100 * ok / done) + '%' : '–';
      $('.s-bar', root).style.width = (steps.length ? 100 * done / steps.length : 0) + '%';
    }

    function setFeedback(txt, cls) {
      feedback.textContent = txt;
      feedback.className = 'feedback show ' + (cls || '');
      clearTimeout(setFeedback.t);
      setFeedback.t = setTimeout(() => feedback.classList.remove('show'), 700);
    }

    function stopRun() {
      if (run) {
        cancelAnimationFrame(run.raf);
        run.timers.forEach(clearTimeout);
      }
      PR.audio.stopScheduled();
      run = null;
    }

    function reset() {
      stopRun();
      buildSteps();
      score.notes.forEach((n) => delete n._shown);
      view.reset();
      piano.clearAll();
      run = { mode, active: false, idx: 0, wrong: 0, timers: [], raf: 0 };
      view.setCursor(steps.length ? steps[0].t : 0, { instant: true });
      updateStats();
      updateButtons();
      if (mode === 'wait') {
        run.active = true;
        waitEnter(0);
      } else {
        statusText.textContent = mode === 'tempo'
          ? `Nhấn "Bắt đầu": máy đếm ${score.timeSig[0]} phách rồi bạn chơi theo nhịp.`
          : 'Nhấn "Nghe mẫu" để nghe bài nhạc.';
        piano.setHints(PR.settings.get('hints') && steps[0] ? hintsFor(steps[0]) : null);
      }
    }

    function updateButtons() {
      $$('.seg[data-group="mode"] button', root).forEach((b) => b.classList.toggle('on', b.dataset.v === mode));
      $$('.seg[data-group="hand"] button', root).forEach((b) => b.classList.toggle('on', b.dataset.v === hand));
      const running = run && run.active && mode !== 'wait';
      goBtn.textContent = mode === 'wait' ? '↺ Làm lại' : running ? '■ Dừng' : mode === 'tempo' ? '▶ Bắt đầu' : '▶ Nghe mẫu';
      tempoInput.disabled = !!running;
    }

    // ---------------- Wait mode ----------------
    function waitEnter(i) {
      run.idx = i;
      if (i >= steps.length) {
        piano.setHints(null);
        run.timers.push(setTimeout(finish, 450));
        return;
      }
      const s = steps[i];
      s.mine.forEach((n) => view.setState(n.id, 'current'));
      view.setCursor(s.t);
      piano.setHints(PR.settings.get('hints') ? hintsFor(s) : null);
      statusText.innerHTML = `Hãy chơi: <b>${esc(describe(s))}</b>`;
    }

    function waitNoteOn(m) {
      const s = steps[run.idx];
      if (!s) return;
      if (s.req.has(m)) {
        if (s.got.has(m)) return;
        s.got.add(m);
        s.mine.forEach((n) => { if (n.keys.some((k) => k.midi === m)) view.setHead(n.id, m, 'ok'); });
        piano.flash(m, 'ok');
        if (s.got.size === s.req.size) completeWaitStep(s);
      } else {
        run.wrong++;
        s.err = true;
        piano.flash(m, 'bad');
        s.mine.forEach((n) => view.flash(n.id, 'shake'));
        setFeedback(`${PR.Notes.label(m, true)} – chưa đúng`, 'bad');
        updateStats();
      }
    }

    function completeWaitStep(s) {
      s.done = true;
      s.ok = !s.err;
      s.mine.forEach((n) => view.setState(n.id, s.err ? 'late' : 'ok'));
      const spb = 60 / bpm;
      // Accompaniment: other hand at this onset now, later other-hand-only onsets in tempo.
      playOthers(s.others, 0, spb);
      const next = steps[run.idx + 1];
      const tEnd = next ? next.t : score.total;
      onsets.filter((o) => o.t > s.t && o.t < tEnd && !o.notes.some(isMine))
        .forEach((o) => playOthers(o.notes, (o.t - s.t) * spb, spb));
      updateStats();
      waitEnter(run.idx + 1);
    }

    function playOthers(notes, delay, spb) {
      if (!notes.length) return;
      PR.audio.ensure();
      const when = PR.audio.now + delay;
      notes.forEach((n) => {
        n.keys.forEach((k) => PR.audio.playNote(k.midi, 68, when, n.beats * spb * 0.95));
        run.timers.push(setTimeout(() => {
          view.setState(n.id, 'auto');
          n.keys.forEach((k) => piano.flash(k.midi, 'autoflash', Math.min(900, n.beats * spb * 900)));
        }, delay * 1000));
      });
    }

    // ---------------- Tempo & demo modes ----------------
    function startTimed() {
      reset();
      PR.audio.ensure();
      const spb = 60 / bpm;
      const now = PR.audio.now;
      const countIn = mode === 'tempo' ? measure : 0;
      run.t0 = now + 0.2 + countIn * spb;
      run.active = true;
      run.lastBeat = -99;
      const metro = metroInput.checked;
      for (let b = -countIn; b < Math.ceil(score.total); b++) {
        if (b < 0 || metro) PR.audio.click(run.t0 + b * spb, ((b % measure) + measure) % measure === 0);
      }
      score.notes.forEach((n) => {
        if (n.rest || (mode === 'tempo' && isMine(n))) return;
        n.keys.forEach((k) => PR.audio.playNote(k.midi, mode === 'demo' ? 84 : 66, run.t0 + n.start * spb, n.beats * spb * 0.93));
      });
      statusText.textContent = mode === 'tempo' ? 'Chuẩn bị…' : 'Đang phát bản mẫu…';
      updateButtons();
      run.raf = requestAnimationFrame(tick);
    }

    function tick() {
      if (!run || !run.active) return;
      const spb = 60 / bpm;
      const beat = (PR.audio.now - run.t0) / spb;
      const win = Math.min(0.32, 0.12 + 0.25 * spb);
      view.setCursor(Math.max(0, beat), { instant: true, continuous: true });

      // Sounding non-judged notes → piano highlight + state
      const sounding = new Set();
      score.notes.forEach((n) => {
        if (n.rest || (mode === 'tempo' && isMine(n))) return;
        if (beat >= n.start) {
          if (!n._shown) { view.setState(n.id, mode === 'demo' ? 'played' : 'auto'); n._shown = true; }
          if (beat < n.start + n.beats * 0.93) n.keys.forEach((k) => sounding.add(k.midi));
        }
      });
      piano.setAuto(sounding);

      if (mode === 'tempo') {
        if (beat < 0) {
          statusText.innerHTML = `Đếm: <b class="count">${Math.floor(beat + measure) + 1}</b>`;
        } else if (run.lastBeat < 0) {
          statusText.textContent = 'Chơi nào!';
        }
        steps.forEach((s) => {
          if (!s.done && (beat - s.t) * spb > win) {
            s.done = true;
            s.ok = false;
            s.mine.forEach((n) => view.setState(n.id, 'miss'));
            updateStats();
          }
        });
        const upcoming = steps.find((s) => !s.done);
        if (upcoming !== run.upcoming) {
          run.upcoming = upcoming;
          if (upcoming) upcoming.mine.forEach((n) => view.setState(n.id, 'current'));
          piano.setHints(PR.settings.get('hints') && upcoming ? hintsFor(upcoming) : null);
        }
      }
      run.lastBeat = beat;
      if (beat > score.total + 0.4) {
        if (mode === 'tempo') finish();
        else { reset(); statusText.textContent = 'Hết bài. Thử chế độ "Chờ nốt" để tự chơi nhé!'; }
        return;
      }
      run.raf = requestAnimationFrame(tick);
    }

    function tempoNoteOn(m) {
      if (!run.active) return;
      const spb = 60 / bpm;
      const beat = (PR.audio.now - run.t0) / spb;
      const win = Math.min(0.32, 0.12 + 0.25 * spb);
      let best = null, bd = Infinity;
      steps.forEach((s) => {
        if (s.done || !s.req.has(m) || s.got.has(m)) return;
        const d = Math.abs(s.t - beat) * spb;
        if (d <= win && d < bd) { bd = d; best = s; }
      });
      if (best) {
        best.got.add(m);
        best.mine.forEach((n) => { if (n.keys.some((k) => k.midi === m)) view.setHead(n.id, m, 'ok'); });
        piano.flash(m, 'ok');
        const diff = (beat - best.t) * spb;
        if (Math.abs(diff) < 0.07) setFeedback('Chuẩn!', 'good');
        else setFeedback(diff < 0 ? 'Hơi sớm' : 'Hơi trễ', 'meh');
        if (best.got.size === best.req.size) {
          best.done = true;
          best.ok = true;
          best.mine.forEach((n) => view.setState(n.id, 'ok'));
          updateStats();
        }
      } else {
        run.wrong++;
        piano.flash(m, 'bad');
        setFeedback(beat < -0.5 ? 'Chưa đến lúc' : `${PR.Notes.label(m, true)} – sai`, 'bad');
        updateStats();
      }
    }

    // ---------------- Results ----------------
    function finish() {
      if (!run) return;
      run.active = false;
      cancelAnimationFrame(run.raf);
      piano.clearAll();
      updateButtons();
      const ok = steps.filter((s) => s.ok).length;
      const acc = steps.length ? Math.round(100 * ok / steps.length) : 0;
      const stars = acc >= 90 ? 3 : acc >= 70 ? 2 : acc >= 40 ? 1 : 0;
      const counts = hand === 'B' || lessonHands.length === 1;
      if (counts && stars) PR.progress.record(lesson.id, stars, acc);
      const msg = stars === 3 ? 'Tuyệt vời! 🎉' : stars === 2 ? 'Rất tốt!' : stars === 1 ? 'Khá lắm, tập thêm nhé!' : 'Cố lên, thử chậm lại nhé!';
      statusText.textContent = `Hoàn thành – chính xác ${acc}%`;
      PR.modal(`
        <div class="result">
          <div class="stars">${[1, 2, 3].map((i) => `<span class="${i <= stars ? 'on' : ''}">★</span>`).join('')}</div>
          <h2>${msg}</h2>
          <p class="big">${acc}%</p>
          <p>${ok}/${steps.length} nốt chơi đúng ngay lần đầu${mode === 'tempo' ? ' và đúng nhịp' : ''} · ${run.wrong} lần bấm sai</p>
          ${!counts ? '<p class="muted">Luyện một tay không tính sao – hãy thử "Hai tay" để ghi nhận tiến độ.</p>' : ''}
          ${mode === 'wait' && stars >= 2 ? '<p class="muted">Gợi ý: thử chế độ <b>Theo nhịp</b> để luyện đều tay.</p>' : ''}
        </div>`, [
        { label: 'Làm lại', onClick: () => reset() },
        ...(nextL ? [{ label: 'Bài tiếp theo ›', cls: 'primary', onClick: () => { location.hash = '#/lesson/' + nextL.id; } }] : []),
      ]);
    }

    // ---------------- Controls ----------------
    $$('.seg[data-group="mode"] button', root).forEach((b) => b.addEventListener('click', () => { mode = b.dataset.v; reset(); }));
    $$('.seg[data-group="hand"] button', root).forEach((b) => b.addEventListener('click', () => { hand = b.dataset.v; reset(); }));
    tempoInput.addEventListener('input', () => { bpm = +tempoInput.value; $('.bpm', root).textContent = bpm; });
    metroInput.addEventListener('change', () => PR.settings.set('metronome', metroInput.checked));
    goBtn.addEventListener('click', () => {
      goBtn.blur();
      if (mode === 'wait') reset();
      else if (run && run.active) { reset(); }
      else startTimed();
    });

    reset();
    piano.centerOn(60);

    return {
      piano,
      onNoteOn(m) {
        if (!run) return;
        if (mode === 'wait' && run.active) waitNoteOn(m);
        else if (mode === 'tempo') tempoNoteOn(m);
      },
      onSettings(k) {
        if (k === 'showNames' || k === 'naming') { draw(); reset(); }
        if (k === 'keyLabels' || k === 'naming') piano.updateLabels();
      },
      destroy() { stopRun(); score.notes.forEach((n) => delete n._shown); },
    };
  };
})(window.PR);
