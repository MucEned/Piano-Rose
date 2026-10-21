// Free play: big keyboard, live note/chord names, staff history, metronome, record & export MIDI.
(function (PR) {
  'use strict';
  const { $, esc } = PR;

  const RANGES = {
    '37': [48, 84, '37 phím (Đô3–Đô6)'],
    '49': [36, 84, '49 phím (Đô2–Đô6)'],
    '61': [36, 96, '61 phím (Đô2–Đô7)'],
    '88': [21, 108, '88 phím (La0–Đô8)'],
  };

  const CHORDS = [
    [[0, 4, 7], '', 'trưởng'], [[0, 3, 7], 'm', 'thứ'], [[0, 3, 6], 'dim', 'giảm'], [[0, 4, 8], 'aug', 'tăng'],
    [[0, 2, 7], 'sus2', 'sus2'], [[0, 5, 7], 'sus4', 'sus4'],
    [[0, 4, 7, 10], '7', 'bảy (át)'], [[0, 4, 7, 11], 'maj7', 'bảy trưởng'], [[0, 3, 7, 10], 'm7', 'thứ bảy'],
    [[0, 3, 6, 10], 'm7♭5', 'bảy nửa giảm'], [[0, 3, 6, 9], 'dim7', 'bảy giảm'],
    [[0, 4, 7, 9], '6', 'sáu'], [[0, 3, 7, 9], 'm6', 'thứ sáu'], [[0, 7], '5', 'quãng 5 (power)'],
  ];
  const INTERVALS = ['Đồng âm / quãng 8', 'Quãng 2 thứ', 'Quãng 2 trưởng', 'Quãng 3 thứ', 'Quãng 3 trưởng', 'Quãng 4 đúng',
    'Quãng 4 tăng', 'Quãng 5 đúng', 'Quãng 6 thứ', 'Quãng 6 trưởng', 'Quãng 7 thứ', 'Quãng 7 trưởng'];

  function detectChord(midis) {
    if (midis.length < 2) return null;
    const sorted = midis.slice().sort((a, b) => a - b);
    const pcs = [...new Set(sorted.map((m) => m % 12))];
    const bass = sorted[0] % 12;
    const naming = PR.settings.get('naming');
    const nm = (pc) => (naming === 'letter' ? PR.Notes.letterName(pc) : PR.Notes.solfegeName(pc));
    if (pcs.length === 2 && sorted.length === 2) {
      const iv = (sorted[1] - sorted[0]) % 12;
      return { symbol: '', desc: INTERVALS[iv] };
    }
    const roots = [bass, ...pcs.filter((p) => p !== bass)];
    for (const root of roots) {
      const rel = pcs.map((p) => (p - root + 12) % 12).sort((a, b) => a - b).join(',');
      for (const [tpl, suf, desc] of CHORDS) {
        if (tpl.join(',') === rel) {
          return {
            symbol: PR.Notes.letterName(root) + suf + (bass !== root ? '/' + PR.Notes.letterName(bass) : ''),
            desc: `Hợp âm ${nm(root)} ${desc}` + (bass !== root ? ` – thể đảo (bass ${nm(bass)})` : ''),
          };
        }
      }
    }
    return null;
  }

  // Standard MIDI File (type 0) from [{midi, vel, on, dur}] in seconds.
  function toMidiFile(notes) {
    const tpq = 480, ticksPerSec = tpq * 2; // 120 BPM
    const evs = [];
    notes.forEach((n) => {
      evs.push({ tick: Math.round(n.on * ticksPerSec), d: [0x90, n.midi, n.vel] });
      evs.push({ tick: Math.round((n.on + n.dur) * ticksPerSec), d: [0x80, n.midi, 0] });
    });
    evs.sort((a, b) => a.tick - b.tick || (a.d[0] === 0x80 ? -1 : 1));
    const vlq = (v) => { const out = [v & 0x7f]; while ((v >>= 7)) out.unshift((v & 0x7f) | 0x80); return out; };
    const trk = [0, 0xff, 0x51, 0x03, 0x07, 0xa1, 0x20];
    let last = 0;
    evs.forEach((e) => { trk.push(...vlq(e.tick - last), ...e.d); last = e.tick; });
    trk.push(0, 0xff, 0x2f, 0x00);
    const len = trk.length;
    return new Uint8Array([0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, tpq >> 8, tpq & 0xff,
      0x4d, 0x54, 0x72, 0x6b, (len >>> 24) & 255, (len >>> 16) & 255, (len >>> 8) & 255, len & 255, ...trk]);
  }

  PR.views.free = function (root) {
    root.innerHTML = `
      <section class="free-view">
        <div class="free-head">
          <div class="now">
            <div class="now-label">Đang chơi</div>
            <div class="now-notes">—</div>
            <div class="now-chord"></div>
          </div>
          <div class="score-card free-score"><div class="score-wrap"></div></div>
        </div>
        <div class="toolbar">
          <select class="range">${Object.entries(RANGES).map(([k, r]) => `<option value="${k}">${r[2]}</option>`).join('')}</select>
          <span class="pill sustain-pill" title="Phím Space hoặc pedal MIDI">Pedal: <b>tắt</b></span>
          <span class="sep"></span>
          <button class="btn small metro-btn">♩ Máy đếm nhịp</button>
          <label class="tempo-ctl"><input type="range" min="40" max="200" value="90"><b class="bpm">90</b></label>
          <select class="beats"><option value="2">2/4</option><option value="3">3/4</option><option value="4" selected>4/4</option></select>
          <span class="sep"></span>
          <button class="btn small rec-btn">● Ghi âm</button>
          <button class="btn small play-btn" disabled>▶ Phát lại</button>
          <button class="btn small dl-btn" disabled title="Tải bản ghi về dạng .mid">⬇ MIDI</button>
          <button class="btn small ghost clear-btn">Xóa khuông</button>
        </div>
        <div class="piano-wrap big"></div>
        <p class="tip">Bàn phím máy tính: hàng <kbd>Z X C V B N M</kbd> = quãng tám thấp, hàng <kbd>Q W E R T Y U I</kbd> = quãng tám cao (hàng số là phím đen).
          <kbd>←</kbd> <kbd>→</kbd> đổi quãng tám, <kbd>Space</kbd> = pedal ngân.</p>
      </section>`;

    const rangeSel = $('.range', root);
    rangeSel.value = RANGES[PR.settings.get('freeRange')] ? PR.settings.get('freeRange') : '61';
    const pianoWrap = $('.piano-wrap', root);
    let piano;
    const buildPiano = () => {
      pianoWrap.innerHTML = '';
      const [lo, hi] = RANGES[rangeSel.value];
      piano = new PR.Piano(pianoWrap, lo, hi);
      api.piano = piano;
      held.forEach((m) => piano.press(m));
      requestAnimationFrame(() => piano.centerOn(60));
    };

    const held = new Set();
    let history = [];      // array of chords (arrays of midi)
    let openChord = null;  // {midis, at}
    const wrap = $('.score-wrap', root);

    function renderStaff() {
      const maxItems = Math.max(4, Math.floor((wrap.clientWidth - 110) / 52));
      const shown = history.slice(-maxItems);
      const sc = PR.Staff.chordsToScore(shown);
      const view = PR.Staff.renderScore(wrap, sc, { showNames: PR.settings.get('showNames'), noBars: true, minWidth: wrap.clientWidth - 2 });
      view.hideCursor();
      if (shown.length) {
        const lastIdx = shown.length - 1;
        ['t', 'b'].forEach((s) => view.setState(`c${lastIdx}${s}`, 'current'));
      }
    }

    function renderNow() {
      const notes = [...held].sort((a, b) => a - b);
      $('.now-notes', root).innerHTML = notes.length
        ? notes.map((m) => `<span>${esc(PR.Notes.label(m))}<sub>${Math.floor(m / 12) - 1}</sub></span>`).join(' ')
        : '—';
      const ch = detectChord(notes);
      $('.now-chord', root).innerHTML = ch ? `${ch.symbol ? `<b>${esc(ch.symbol)}</b> ` : ''}${esc(ch.desc)}` : '';
    }

    // ---------- Metronome ----------
    const metro = new PR.Metronome(PR.audio);
    const metroBtn = $('.metro-btn', root);
    const tempo = $('.tempo-ctl input', root);
    const beatsSel = $('.beats', root);
    metroBtn.addEventListener('click', () => {
      metroBtn.blur();
      if (metro.running) metro.stop(); else metro.start(+tempo.value, +beatsSel.value);
      metroBtn.classList.toggle('on', metro.running);
    });
    tempo.addEventListener('input', () => { $('.bpm', root).textContent = tempo.value; metro.setBpm(+tempo.value); });
    beatsSel.addEventListener('change', () => { if (metro.running) metro.start(+tempo.value, +beatsSel.value); });
    metro.onBeat = (n) => { metroBtn.classList.toggle('accent', n === 0); metroBtn.classList.add('tick'); setTimeout(() => metroBtn.classList.remove('tick'), 90); };

    // ---------- Recording ----------
    let rec = null;          // {start, events, sustain}
    let recording = null;    // finished: [{midi, vel, on, dur}]
    let playback = null;     // {raf, t0, notes}
    const recBtn = $('.rec-btn', root), playBtn = $('.play-btn', root), dlBtn = $('.dl-btn', root);

    function recTime() { return (performance.now() - rec.start) / 1000; }

    function finishRecording() {
      const t = recTime();
      const notes = [];
      const open = new Map();
      let sustain = false;
      const pending = [];
      const close = (n, at) => { n.dur = Math.max(0.05, at - n.on); notes.push(n); };
      rec.events.push({ t, type: 'end' });
      rec.events.forEach((e) => {
        if (e.type === 'on') {
          if (open.has(e.midi)) close(open.get(e.midi), e.t);
          const pi = pending.findIndex((p) => p.midi === e.midi);
          if (pi >= 0) close(pending.splice(pi, 1)[0], e.t);
          open.set(e.midi, { midi: e.midi, vel: e.vel, on: e.t });
        } else if (e.type === 'off') {
          const n = open.get(e.midi);
          if (!n) return;
          open.delete(e.midi);
          if (sustain) pending.push(n); else close(n, e.t);
        } else if (e.type === 'sus') {
          sustain = e.on;
          if (!sustain) pending.splice(0).forEach((n) => close(n, e.t));
        } else if (e.type === 'end') {
          open.forEach((n) => close(n, e.t));
          pending.forEach((n) => close(n, e.t));
        }
      });
      notes.sort((a, b) => a.on - b.on);
      const first = notes.length ? notes[0].on : 0;
      notes.forEach((n) => { n.on -= first; });
      recording = notes.length ? notes : null;
      rec = null;
    }

    function stopPlayback() {
      if (!playback) return;
      cancelAnimationFrame(playback.raf);
      PR.audio.stopScheduled();
      piano.setAuto(new Set());
      playback = null;
    }

    function updateRecButtons() {
      recBtn.textContent = rec ? '■ Dừng ghi' : '● Ghi âm';
      recBtn.classList.toggle('recording', !!rec);
      playBtn.disabled = !recording || !!rec;
      playBtn.textContent = playback ? '■ Dừng' : '▶ Phát lại';
      dlBtn.disabled = !recording || !!rec;
    }

    recBtn.addEventListener('click', () => {
      recBtn.blur();
      stopPlayback();
      if (rec) {
        finishRecording();
        PR.toast(recording ? `Đã ghi ${recording.length} nốt.` : 'Không có nốt nào được ghi.');
      } else {
        rec = { start: performance.now(), events: [] };
        if (PR.audio.sustain) rec.events.push({ t: 0, type: 'sus', on: true });
        PR.toast('Đang ghi… hãy chơi đàn.');
      }
      updateRecButtons();
    });

    playBtn.addEventListener('click', () => {
      playBtn.blur();
      if (playback) { stopPlayback(); updateRecButtons(); return; }
      if (!recording) return;
      PR.audio.ensure();
      const t0 = PR.audio.now + 0.15;
      recording.forEach((n) => PR.audio.playNote(n.midi, n.vel, t0 + n.on, n.dur));
      const end = Math.max(...recording.map((n) => n.on + n.dur));
      playback = { t0 };
      const loop = () => {
        const t = PR.audio.now - t0;
        piano.setAuto(new Set(recording.filter((n) => t >= n.on && t < n.on + n.dur).map((n) => n.midi)));
        if (t > end + 0.2) { stopPlayback(); updateRecButtons(); return; }
        playback.raf = requestAnimationFrame(loop);
      };
      playback.raf = requestAnimationFrame(loop);
      updateRecButtons();
    });

    dlBtn.addEventListener('click', () => {
      if (!recording) return;
      const blob = new Blob([toMidiFile(recording)], { type: 'audio/midi' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'piano-rose-' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-') + '.mid';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    });

    $('.clear-btn', root).addEventListener('click', () => { history = []; openChord = null; renderStaff(); });
    rangeSel.addEventListener('change', () => { PR.settings.set('freeRange', rangeSel.value); buildPiano(); });

    const onResize = () => renderStaff();
    window.addEventListener('resize', onResize);

    const api = {
      piano: null,
      onNoteOn(m, vel) {
        held.add(m);
        const now = performance.now();
        if (openChord && now - openChord.at < 70) {
          if (!openChord.midis.includes(m)) openChord.midis.push(m);
        } else {
          openChord = { midis: [m], at: now };
          history.push(openChord.midis);
          if (history.length > 64) history.shift();
        }
        renderNow();
        renderStaff();
        if (rec) rec.events.push({ t: recTime(), type: 'on', midi: m, vel });
      },
      onNoteOff(m) {
        held.delete(m);
        renderNow();
        if (rec) rec.events.push({ t: recTime(), type: 'off', midi: m });
      },
      onSustain(on) {
        $('.sustain-pill', root).classList.toggle('on', on);
        $('.sustain-pill b', root).textContent = on ? 'bật' : 'tắt';
        if (rec) rec.events.push({ t: recTime(), type: 'sus', on });
      },
      onSettings(k) {
        if (k === 'keyLabels' || k === 'naming') piano.updateLabels();
        renderNow();
        renderStaff();
      },
      destroy() {
        metro.stop();
        stopPlayback();
        window.removeEventListener('resize', onResize);
      },
    };

    buildPiano();
    renderStaff();
    api.onSustain(PR.audio.sustain);
    return api;
  };

  PR.detectChord = detectChord;
})(window.PR);
