// Core: namespace, settings, progress, note helpers, tiny UI utilities.
window.PR = window.PR || {};
(function (PR) {
  'use strict';

  // ---------- Settings (persisted) ----------
  const SETTINGS_KEY = 'pianoRose.settings';
  const DEFAULTS = {
    naming: 'solfege',      // 'solfege' (Đô Rê Mi) | 'letter' (C D E)
    showNames: true,        // note names under notes on the staff
    keyLabels: 'notes',     // 'none' | 'notes' | 'keys' | 'both'
    playSound: true,        // play sound when a key is pressed
    volume: 0.8,
    sound: 'sample',        // 'sample' (real piano) | 'synth'
    midiInput: 'all',
    hints: true,            // highlight the next key on the piano
    metronome: true,
    octaveShift: 0,
    freeRange: '61',
  };
  let data = Object.assign({}, DEFAULTS);
  try { Object.assign(data, JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')); } catch (e) { /* ignore */ }
  const subs = [];
  PR.settings = {
    get: (k) => data[k],
    set(k, v) {
      data[k] = v;
      try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
      subs.forEach((f) => f(k, v));
    },
    onChange: (f) => subs.push(f),
  };

  // ---------- Lesson progress ----------
  const PROGRESS_KEY = 'pianoRose.progress';
  let progress = {};
  try { progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}'); } catch (e) { progress = {}; }
  PR.progress = {
    get: (id) => progress[id] || null,
    record(id, stars, acc) {
      const old = progress[id] || { stars: 0, best: 0 };
      progress[id] = { stars: Math.max(old.stars, stars), best: Math.max(old.best, acc), at: Date.now() };
      try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)); } catch (e) { /* ignore */ }
      return progress[id];
    },
  };

  // ---------- Notes ----------
  const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const LETTER_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const SOLFEGE = { C: 'Đô', D: 'Rê', E: 'Mi', F: 'Fa', G: 'Son', A: 'La', B: 'Si' };
  const PC_SPELL = [['C', 0], ['C', 1], ['D', 0], ['D', 1], ['E', 0], ['F', 0], ['F', 1], ['G', 0], ['G', 1], ['A', 0], ['A', 1], ['B', 0]];
  const BLACK = new Set([1, 3, 6, 8, 10]);

  function parsePitch(str) {
    const m = /^([A-G])(#|b)?(-?\d)$/.exec(str);
    if (!m) throw new Error('Nốt không hợp lệ: ' + str);
    const letter = m[1];
    const acc = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
    const oct = +m[3];
    return { letter, acc, oct, midi: (oct + 1) * 12 + LETTER_PC[letter] + acc, diatonic: oct * 7 + LETTERS.indexOf(letter) };
  }

  function spell(midi) {
    const [letter, acc] = PC_SPELL[((midi % 12) + 12) % 12];
    const oct = Math.floor(midi / 12) - 1;
    return { letter, acc, oct, midi, diatonic: oct * 7 + LETTERS.indexOf(letter) };
  }

  function keyLabel(key, withOctave) {
    const naming = PR.settings.get('naming');
    const base = naming === 'letter' ? key.letter : SOLFEGE[key.letter];
    const acc = key.acc > 0 ? '♯' : key.acc < 0 ? '♭' : '';
    return base + acc + (withOctave ? key.oct : '');
  }

  PR.Notes = {
    LETTERS, SOLFEGE,
    parsePitch, spell,
    isBlack: (midi) => BLACK.has(((midi % 12) + 12) % 12),
    label: (midi, withOctave) => keyLabel(spell(midi), withOctave),
    keyLabel,
    letterName: (pc) => { const [l, a] = PC_SPELL[pc]; return l + (a ? '♯' : ''); },
    solfegeName: (pc) => { const [l, a] = PC_SPELL[pc]; return SOLFEGE[l] + (a ? '♯' : ''); },
  };

  // ---------- Small UI helpers ----------
  PR.$ = (sel, root) => (root || document).querySelector(sel);
  PR.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  PR.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  let toastTimer = null;
  PR.toast = function (msg, ms) {
    let t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), ms || 2600);
  };

  // Modal: returns a close function. actions: [{label, cls, onClick}]
  PR.modal = function (html, actions) {
    const back = document.createElement('div');
    back.className = 'modal-back';
    back.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}<div class="modal-actions"></div></div>`;
    const box = back.querySelector('.modal-actions');
    const close = () => { back.remove(); document.removeEventListener('keydown', onKey); };
    (actions || [{ label: 'Đóng', cls: 'primary' }]).forEach((a) => {
      const b = document.createElement('button');
      b.className = 'btn ' + (a.cls || '');
      b.textContent = a.label;
      b.addEventListener('click', () => { close(); if (a.onClick) a.onClick(); });
      box.appendChild(b);
    });
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    back.addEventListener('pointerdown', (e) => { if (e.target === back) close(); });
    document.body.appendChild(back);
    return { close, el: back };
  };

  PR.views = {};
})(window.PR);
