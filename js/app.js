// App shell: routing, home page, settings, header status, global input wiring.
(function (PR) {
  'use strict';
  const { $, $$, esc } = PR;

  // ---------------- Home ----------------
  PR.views.home = function (root) {
    const done = PR.LESSONS.filter((l) => PR.progress.get(l.id));
    const nextLesson = PR.LESSONS.find((l) => !PR.progress.get(l.id)) || PR.LESSONS[0];
    const totalStars = PR.LESSONS.reduce((s, l) => s + ((PR.progress.get(l.id) || {}).stars || 0), 0);

    root.innerHTML = `
      <section class="home">
        <div class="hero">
          <div>
            <h1>Học piano theo <em>Méthode Rose</em></h1>
            <p>Từng bước nhỏ, từ nốt Đô đầu tiên đến chơi hai tay. Cắm đàn MIDI vào máy, hoặc dùng bàn phím máy tính và chuột.</p>
            <div class="hero-actions">
              <a class="btn primary" href="#/lesson/${nextLesson.id}">${done.length ? 'Học tiếp' : 'Bắt đầu học'}: ${esc(nextLesson.title)} ›</a>
              <a class="btn" href="#/free">🎹 Chơi tự do</a>
              <a class="btn" href="#/drill">🎼 Luyện đọc nốt</a>
            </div>
          </div>
          <div class="hero-stats">
            <div><b>${done.length}/${PR.LESSONS.length}</b><span>bài đã hoàn thành</span></div>
            <div><b>${totalStars} ★</b><span>trên ${PR.LESSONS.length * 3} sao</span></div>
          </div>
        </div>
        ${PR.PARTS.map((p) => `
          <div class="part">
            <div class="part-head"><span class="part-num">${p.id}</span><div><h2>${esc(p.title)}</h2><p>${esc(p.desc)}</p></div></div>
            <div class="lesson-grid">
              ${PR.LESSONS.filter((l) => l.part === p.id).map((l, i) => {
                const pr = PR.progress.get(l.id);
                const hands = [...new Set(l.voices.map((v) => v.hand))];
                const handTxt = hands.length > 1 ? 'Hai tay' : hands[0] === 'R' ? 'Tay phải' : 'Tay trái';
                return `<a class="lesson-card ${pr ? 'done' : ''} ${l === nextLesson ? 'next' : ''}" href="#/lesson/${l.id}">
                  <span class="lc-num">${i + 1}</span>
                  <span class="lc-title">${esc(l.title)}</span>
                  <span class="lc-meta">${handTxt} · ${l.time[0]}/${l.time[1]} · ♩=${l.tempo}</span>
                  <span class="lc-stars">${[1, 2, 3].map((s) => `<i class="${pr && pr.stars >= s ? 'on' : ''}">★</i>`).join('')}</span>
                </a>`;
              }).join('')}
            </div>
          </div>`).join('')}
        <div class="help card">
          <h2>Kết nối & điều khiển</h2>
          <div class="help-grid">
            <div><h3>🎹 Đàn MIDI / USB</h3>
              <p>Cắm đàn (hoặc keyboard controller) qua cáp USB/MIDI rồi mở trang bằng <b>Chrome</b> hoặc <b>Edge</b> và cho phép truy cập MIDI. Trạng thái hiển thị ở góc trên. Pedal ngân (sustain) được hỗ trợ.</p>
              <p class="muted">Nếu đàn của bạn đã có loa, có thể tắt "Phát âm thanh khi nhấn phím" trong Cài đặt.</p></div>
            <div><h3>⌨️ Bàn phím máy tính</h3>
              <p><kbd>Z</kbd><kbd>X</kbd><kbd>C</kbd><kbd>V</kbd><kbd>B</kbd><kbd>N</kbd><kbd>M</kbd> = Đô3 → Si3 (phím đen: <kbd>S</kbd><kbd>D</kbd><kbd>G</kbd><kbd>H</kbd><kbd>J</kbd>)</p>
              <p><kbd>Q</kbd><kbd>W</kbd><kbd>E</kbd><kbd>R</kbd><kbd>T</kbd><kbd>Y</kbd><kbd>U</kbd><kbd>I</kbd> = Đô4 → Đô5 (phím đen: <kbd>2</kbd><kbd>3</kbd><kbd>5</kbd><kbd>6</kbd><kbd>7</kbd>)</p>
              <p><kbd>←</kbd><kbd>→</kbd> đổi quãng tám · <kbd>Space</kbd> pedal. <span class="muted">Hãy tắt bộ gõ tiếng Việt (Unikey/EVKey) khi chơi.</span></p></div>
            <div><h3>🖱️ Chuột / cảm ứng</h3>
              <p>Bấm trực tiếp lên phím đàn trên màn hình. Bấm gần mép dưới phím để chơi mạnh hơn, kéo ngang để vuốt phím.</p></div>
          </div>
        </div>
      </section>`;
    return {};
  };

  // ---------------- Settings ----------------
  function openSettings() {
    const s = PR.settings;
    const midi = PR.input.midiStatus();
    const sel = (k, opts) => `<select data-k="${k}">${opts.map(([v, l]) => `<option value="${v}" ${String(s.get(k)) === String(v) ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
    const chk = (k, l) => `<label class="chk"><input type="checkbox" data-k="${k}" ${s.get(k) ? 'checked' : ''}> ${l}</label>`;
    const m = PR.modal(`
      <h2>Cài đặt</h2>
      <div class="settings">
        <div class="field"><span>Tên nốt</span>${sel('naming', [['solfege', 'Đô Rê Mi (Solfège)'], ['letter', 'C D E (chữ cái)']])}</div>
        <div class="field"><span>Nhãn trên phím đàn</span>${sel('keyLabels', [['none', 'Không'], ['notes', 'Tên nốt'], ['keys', 'Phím máy tính'], ['both', 'Cả hai']])}</div>
        ${chk('showNames', 'Hiện tên nốt dưới khuông nhạc')}
        ${chk('hints', 'Gợi ý phím cần bấm (kèm số ngón)')}
        <hr>
        <div class="field"><span>Âm thanh</span>${sel('sound', [['sample', 'Piano thật (tải mẫu từ Internet)'], ['synth', 'Piano tổng hợp (offline)']])}</div>
        <div class="field"><span>Âm lượng</span><input type="range" min="0" max="1" step="0.05" data-k="volume" value="${s.get('volume')}"></div>
        ${chk('playSound', 'Phát âm thanh khi nhấn phím (tắt nếu đàn MIDI đã có loa)')}
        <hr>
        <div class="field"><span>Thiết bị MIDI</span>${midi.state === 'ready'
          ? sel('midiInput', [['all', 'Tất cả thiết bị'], ...midi.devices.map((d) => [d.id, d.name])])
          : `<span class="muted">${midi.state === 'unsupported' ? 'Trình duyệt không hỗ trợ Web MIDI – dùng Chrome hoặc Edge.' : midi.state === 'denied' ? 'Đã bị từ chối quyền MIDI.' : 'Đang chờ quyền truy cập…'}</span>`}</div>
        <p class="muted small">${midi.devices.length ? 'Đã kết nối: ' + midi.devices.map((d) => esc(d.name)).join(', ') : 'Chưa phát hiện đàn MIDI nào.'}</p>
        <hr>
        <button class="btn ghost small reset-progress">Xóa tiến độ học</button>
      </div>`);
    $$('[data-k]', m.el).forEach((inp) => {
      inp.addEventListener(inp.type === 'range' ? 'input' : 'change', () => {
        const k = inp.dataset.k;
        const v = inp.type === 'checkbox' ? inp.checked : inp.type === 'range' ? +inp.value : inp.value;
        s.set(k, v);
      });
    });
    $('.reset-progress', m.el).addEventListener('click', () => {
      if (!confirm('Xóa toàn bộ sao và tiến độ các bài học?')) return;
      try { localStorage.removeItem('pianoRose.progress'); } catch (e) { /* ignore */ }
      location.reload();
    });
  }

  // ---------------- Header status ----------------
  function renderMidiPill(st) {
    const pill = $('#midi-pill');
    if (!pill) return;
    const n = st.devices.length;
    pill.className = 'pill status ' + (n ? 'ok' : st.state === 'unsupported' || st.state === 'denied' ? 'off' : '');
    pill.innerHTML = n
      ? `<i></i> ${esc(st.devices.length === 1 ? st.devices[0].name : n + ' thiết bị MIDI')}`
      : `<i></i> ${st.state === 'unsupported' ? 'Không hỗ trợ MIDI' : st.state === 'denied' ? 'MIDI bị chặn' : 'Chưa có đàn MIDI'}`;
  }

  function renderKbdPill() {
    const pill = $('#kbd-pill');
    const [lo, hi] = PR.input.kbdRange;
    pill.innerHTML = `⌨️ ${PR.Notes.label(lo, true)}–${PR.Notes.label(hi, true)}`;
    pill.title = 'Phạm vi bàn phím máy tính (← → để đổi quãng tám)';
  }

  function renderSoundPill(state, n, total) {
    const pill = $('#sound-pill');
    if (PR.settings.get('sound') !== 'sample') { pill.hidden = true; return; }
    pill.hidden = state === 'ready' || state === 'idle';
    if (state === 'loading') pill.textContent = `🔊 Đang tải tiếng piano ${Math.round(100 * n / total)}%`;
    if (state === 'failed') { pill.hidden = false; pill.textContent = '🔊 Dùng piano tổng hợp (không tải được mẫu)'; }
  }

  // ---------------- Router ----------------
  let current = null;
  function route() {
    if (current && current.destroy) current.destroy();
    current = null;
    PR.audio.stopScheduled();
    const h = location.hash || '#/';
    const main = $('#view');
    main.innerHTML = '';
    let name = 'home';
    if (h.startsWith('#/lesson/')) { name = 'lessons'; current = PR.views.lesson(main, decodeURIComponent(h.slice(9))); }
    else if (h === '#/free') { name = 'free'; current = PR.views.free(main); }
    else if (h === '#/drill') { name = 'drill'; current = PR.views.drill(main); }
    else { name = 'lessons'; current = PR.views.home(main); }
    $$('.nav a').forEach((a) => a.classList.toggle('on', a.dataset.nav === name));
    window.scrollTo(0, 0);
  }

  // ---------------- Wiring ----------------
  function init() {
    const input = PR.input;
    let warnedSuspended = false;

    input.on('noteon', ({ midi, vel }) => {
      if (PR.settings.get('playSound')) {
        PR.audio.noteOn(midi, vel);
        if (PR.audio.suspended && !warnedSuspended) {
          warnedSuspended = true;
          PR.toast('Bấm chuột vào trang một lần để bật âm thanh 🔊', 4000);
        }
      }
      if (current && current.piano) current.piano.press(midi);
      if (current && current.onNoteOn) current.onNoteOn(midi, vel);
    });
    input.on('noteoff', ({ midi }) => {
      PR.audio.noteOff(midi);
      if (current && current.piano) current.piano.release(midi);
      if (current && current.onNoteOff) current.onNoteOff(midi);
    });
    input.on('sustain', (on) => {
      PR.audio.setSustain(on);
      if (current && current.onSustain) current.onSustain(on);
    });
    input.on('midistatus', (st) => {
      renderMidiPill(st);
      const names = st.devices.map((d) => d.name).join(',');
      if (names && names !== init.lastDevices) PR.toast('Đã kết nối: ' + names);
      init.lastDevices = names;
    });
    input.on('octave', () => {
      renderKbdPill();
      if (current && current.piano) current.piano.updateLabels();
    });

    PR.settings.onChange((k, v) => {
      if (k === 'volume') PR.audio.setVolume(v);
      if (k === 'sound' && v === 'sample' && PR.audio.ctx) PR.audio.loadSamples();
      if (k === 'midiInput') input.attachMIDI();
      if (k === 'naming') renderKbdPill();
      if (current && current.onSettings) current.onSettings(k, v);
    });
    PR.audio.onStatus(renderSoundPill);

    // Audio can only start after a user gesture.
    ['pointerdown', 'keydown'].forEach((ev) => window.addEventListener(ev, () => PR.audio.ensure(), { capture: true }));

    $('#settings-btn').addEventListener('click', openSettings);
    $('#midi-pill').addEventListener('click', openSettings);

    input.initKeyboard();
    input.initMIDI();
    renderMidiPill(input.midiStatus());
    renderKbdPill();
    window.addEventListener('hashchange', route);
    route();
  }

  document.addEventListener('DOMContentLoaded', init);
})(window.PR);
