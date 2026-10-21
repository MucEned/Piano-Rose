// Input: Web MIDI devices, computer keyboard and on-screen piano all funnel into one event stream.
(function (PR) {
  'use strict';

  // Physical key codes (layout independent). Lower row starts at C3, upper row at C4.
  const LOWER = ['KeyZ', 'KeyS', 'KeyX', 'KeyD', 'KeyC', 'KeyV', 'KeyG', 'KeyB', 'KeyH', 'KeyN', 'KeyJ', 'KeyM',
    'Comma', 'KeyL', 'Period', 'Semicolon', 'Slash'];
  const UPPER = ['KeyQ', 'Digit2', 'KeyW', 'Digit3', 'KeyE', 'KeyR', 'Digit5', 'KeyT', 'Digit6', 'KeyY', 'Digit7', 'KeyU',
    'KeyI', 'Digit9', 'KeyO', 'Digit0', 'KeyP', 'BracketLeft', 'Equal', 'BracketRight'];
  const CODE_CHAR = { Comma: ',', Period: '.', Semicolon: ';', Slash: '/', BracketLeft: '[', BracketRight: ']', Equal: '=' };
  const charOf = (code) => CODE_CHAR[code] || code.replace(/^Key|^Digit/, '');

  class Input {
    constructor() {
      this.handlers = {};
      this.midiAccess = null;
      this.midiState = 'pending'; // pending | unsupported | denied | ready
      this.kbdHeld = new Map();   // code -> midi
      this.octaveShift = PR.settings.get('octaveShift') || 0;
    }

    on(evt, fn) { (this.handlers[evt] = this.handlers[evt] || []).push(fn); }
    emit(evt, payload) { (this.handlers[evt] || []).forEach((f) => f(payload)); }

    noteOn(midi, vel, source) { this.emit('noteon', { midi, vel: vel == null ? 90 : vel, source }); }
    noteOff(midi, source) { this.emit('noteoff', { midi, source }); }

    // ---------- Computer keyboard ----------
    get lowerBase() { return 48 + 12 * this.octaveShift; }
    get upperBase() { return 60 + 12 * this.octaveShift; }

    codeToMidi(code) {
      let i = UPPER.indexOf(code);
      if (i >= 0) return this.upperBase + i;
      i = LOWER.indexOf(code);
      if (i >= 0) return this.lowerBase + i;
      return null;
    }

    // Label of the computer key that plays this midi note (or '').
    keyFor(midi) {
      const u = midi - this.upperBase;
      if (u >= 0 && u < UPPER.length) return charOf(UPPER[u]);
      const l = midi - this.lowerBase;
      if (l >= 0 && l < LOWER.length) return charOf(LOWER[l]);
      return '';
    }

    get kbdRange() { return [this.lowerBase, this.upperBase + UPPER.length - 1]; }

    setOctave(shift) {
      this.octaveShift = Math.max(-2, Math.min(3, shift));
      PR.settings.set('octaveShift', this.octaveShift);
      this.emit('octave', this.octaveShift);
    }

    initKeyboard() {
      const isTyping = (t) => t && (t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' ||
        (t.tagName === 'INPUT' && !['range', 'checkbox', 'radio', 'button'].includes(t.type)) || t.isContentEditable);

      window.addEventListener('keydown', (e) => {
        if (isTyping(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.code === 'Space') {
          e.preventDefault();
          if (!e.repeat) this.emit('sustain', true);
          return;
        }
        if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
          if (e.target && e.target.type === 'range') return;
          e.preventDefault();
          this.setOctave(this.octaveShift + (e.code === 'ArrowRight' ? 1 : -1));
          return;
        }
        const midi = this.codeToMidi(e.code);
        if (midi == null) return;
        e.preventDefault();
        if (e.repeat || this.kbdHeld.has(e.code)) return;
        this.kbdHeld.set(e.code, midi);
        this.noteOn(midi, 92, 'keyboard');
      });

      window.addEventListener('keyup', (e) => {
        if (e.code === 'Space') { this.emit('sustain', false); return; }
        const midi = this.kbdHeld.get(e.code);
        if (midi == null) return;
        this.kbdHeld.delete(e.code);
        this.noteOff(midi, 'keyboard');
      });

      window.addEventListener('blur', () => {
        for (const [code, midi] of this.kbdHeld) this.noteOff(midi, 'keyboard');
        this.kbdHeld.clear();
      });
    }

    // ---------- Web MIDI ----------
    initMIDI() {
      if (!navigator.requestMIDIAccess) {
        this.midiState = 'unsupported';
        this.emit('midistatus', this.midiStatus());
        return;
      }
      navigator.requestMIDIAccess({ sysex: false }).then((access) => {
        this.midiAccess = access;
        this.midiState = 'ready';
        access.onstatechange = () => { this.attachMIDI(); this.emit('midistatus', this.midiStatus()); };
        this.attachMIDI();
        this.emit('midistatus', this.midiStatus());
      }, () => {
        this.midiState = 'denied';
        this.emit('midistatus', this.midiStatus());
      });
    }

    listInputs() {
      if (!this.midiAccess) return [];
      return Array.from(this.midiAccess.inputs.values()).filter((i) => i.state === 'connected');
    }

    attachMIDI() {
      if (!this.midiAccess) return;
      const wanted = PR.settings.get('midiInput');
      for (const inp of this.midiAccess.inputs.values()) {
        const use = wanted === 'all' || wanted === inp.id;
        inp.onmidimessage = use ? (e) => this.handleMIDI(e) : null;
      }
    }

    handleMIDI(e) {
      const [status, d1, d2] = e.data;
      const cmd = status & 0xf0;
      if (cmd === 0x90 && d2 > 0) this.noteOn(d1, d2, 'midi');
      else if (cmd === 0x80 || (cmd === 0x90 && d2 === 0)) this.noteOff(d1, 'midi');
      else if (cmd === 0xb0 && d1 === 64) this.emit('sustain', d2 >= 64);
    }

    midiStatus() {
      const devices = this.listInputs();
      return { state: this.midiState, devices: devices.map((d) => ({ id: d.id, name: d.name })) };
    }
  }

  PR.input = new Input();
})(window.PR);
