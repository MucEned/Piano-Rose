// Audio engine: sampled grand piano (Salamander, loaded from the web) with a synth fallback.
(function (PR) {
  'use strict';

  const SAMPLE_BASE = 'https://tonejs.github.io/audio/salamander/';
  const SAMPLE_NAMES = ['A0', 'C1', 'Ds1', 'Fs1', 'A1', 'C2', 'Ds2', 'Fs2', 'A2', 'C3', 'Ds3', 'Fs3', 'A3',
    'C4', 'Ds4', 'Fs4', 'A4', 'C5', 'Ds5', 'Fs5', 'A5', 'C6', 'Ds6', 'Fs6', 'A6', 'C7', 'Ds7', 'Fs7', 'A7', 'C8'];
  const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const sampleMidi = (n) => { const m = /^([A-G])(s?)(\d)$/.exec(n); return (+m[3] + 1) * 12 + PC[m[1]] + (m[2] ? 1 : 0); };
  const freqOf = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

  class AudioEngine {
    constructor() {
      this.ctx = null;
      this.buffers = [];          // [{midi, buf}] sorted
      this.live = new Map();      // midi -> voice (live input)
      this.scheduled = new Set(); // voices from playNote/click
      this.sustain = false;
      this.pendingRelease = new Set();
      this.loadState = 'idle';
      this.listeners = [];
    }

    ensure() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC({ latencyHint: 'interactive' });
        this.master = this.ctx.createGain();
        this.master.gain.value = PR.settings.get('volume');
        const comp = this.ctx.createDynamicsCompressor();
        comp.threshold.value = -12;
        comp.ratio.value = 4;
        this.master.connect(comp).connect(this.ctx.destination);
        const real = new Float32Array([0, 1, 0.45, 0.25, 0.14, 0.09, 0.05, 0.03, 0.02]);
        this.wave = this.ctx.createPeriodicWave(real, new Float32Array(real.length));
        if (PR.settings.get('sound') === 'sample') this.loadSamples();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return this.ctx;
    }

    get now() { return this.ctx ? this.ctx.currentTime : 0; }
    get suspended() { return !this.ctx || this.ctx.state !== 'running'; }

    setVolume(v) { if (this.master) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.02); }

    onStatus(f) { this.listeners.push(f); }
    _status() { this.listeners.forEach((f) => f(this.loadState, this.buffers.length, SAMPLE_NAMES.length)); }

    loadSamples() {
      if (this.loadState !== 'idle' || !this.ctx) return;
      this.loadState = 'loading';
      this._status();
      let done = 0;
      SAMPLE_NAMES.forEach((n) => {
        fetch(SAMPLE_BASE + n + '.mp3')
          .then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
          .then((ab) => this.ctx.decodeAudioData(ab))
          .then((buf) => {
            this.buffers.push({ midi: sampleMidi(n), buf });
            this.buffers.sort((a, b) => a.midi - b.midi);
          })
          .catch(() => { /* fall back to synth for this range */ })
          .finally(() => {
            done++;
            if (done === SAMPLE_NAMES.length) this.loadState = this.buffers.length ? 'ready' : 'failed';
            this._status();
          });
      });
    }

    _nearest(midi) {
      let best = null, bd = 1e9;
      for (const b of this.buffers) {
        const d = Math.abs(b.midi - midi);
        if (d < bd) { bd = d; best = b; }
      }
      return bd <= 4 ? best : null;
    }

    _voice(midi, vel, when) {
      const ctx = this.ensure();
      const t = Math.max(when || 0, ctx.currentTime);
      const amp = 0.12 + 0.88 * Math.pow(Math.max(1, vel) / 127, 1.5);
      const g = ctx.createGain();
      g.connect(this.master);
      const sample = PR.settings.get('sound') === 'sample' ? this._nearest(midi) : null;
      let src;
      if (sample) {
        src = ctx.createBufferSource();
        src.buffer = sample.buf;
        src.playbackRate.value = Math.pow(2, (midi - sample.midi) / 12);
        src.connect(g);
        g.gain.setValueAtTime(amp, t);
      } else {
        const f = freqOf(midi);
        src = ctx.createOscillator();
        src.setPeriodicWave(this.wave);
        src.frequency.value = f;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(Math.min(12000, f * 9), t);
        lp.frequency.setTargetAtTime(Math.min(8000, f * 2.5), t, 0.35);
        src.connect(lp).connect(g);
        const decay = 0.6 + Math.max(0, 108 - midi) / 45;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(amp * 0.45, t + 0.006);
        g.gain.setTargetAtTime(0, t + 0.006, decay);
      }
      src.start(t);
      return { src, g };
    }

    _release(v, when, fast) {
      const t = Math.max(when || 0, this.ctx.currentTime);
      const tau = fast ? 0.025 : 0.12;
      try {
        if (v.g.gain.cancelAndHoldAtTime) v.g.gain.cancelAndHoldAtTime(t);
        else v.g.gain.cancelScheduledValues(t);
      } catch (e) { /* ignore */ }
      v.g.gain.setTargetAtTime(0, t, tau);
      try { v.src.stop(t + tau * 10); } catch (e) { /* ignore */ }
    }

    // Live input (tracked per key, respects sustain pedal)
    noteOn(midi, vel) {
      const old = this.live.get(midi);
      if (old) this._release(old, 0, true);
      this.pendingRelease.delete(midi);
      this.live.set(midi, this._voice(midi, vel == null ? 90 : vel, 0));
    }

    noteOff(midi) {
      const v = this.live.get(midi);
      if (!v) return;
      if (this.sustain) { this.pendingRelease.add(midi); return; }
      this._release(v);
      this.live.delete(midi);
    }

    setSustain(on) {
      this.sustain = on;
      if (on) return;
      for (const m of this.pendingRelease) {
        const v = this.live.get(m);
        if (v) { this._release(v); this.live.delete(m); }
      }
      this.pendingRelease.clear();
    }

    // Scheduled playback (demo, accompaniment, recordings)
    playNote(midi, vel, when, dur) {
      const v = this._voice(midi, vel, when);
      this._release(v, Math.max(when, this.ctx.currentTime) + dur);
      this.scheduled.add(v);
      v.src.onended = () => this.scheduled.delete(v);
      return v;
    }

    click(when, accent) {
      const ctx = this.ensure();
      const t = Math.max(when, ctx.currentTime);
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = accent ? 1760 : 1175;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(accent ? 0.5 : 0.3, t + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
      o.connect(g).connect(this.master);
      o.start(t);
      o.stop(t + 0.08);
      const v = { src: o, g };
      this.scheduled.add(v);
      o.onended = () => this.scheduled.delete(v);
    }

    stopScheduled() {
      if (!this.ctx) return;
      for (const v of this.scheduled) this._release(v, 0, true);
      this.scheduled.clear();
    }
  }

  // Free-running metronome with a look-ahead scheduler.
  class Metronome {
    constructor(audio) { this.audio = audio; this.timer = null; this.bpm = 80; this.beats = 4; }
    start(bpm, beats) {
      this.stop();
      this.bpm = bpm; this.beats = beats || 4;
      const ctx = this.audio.ensure();
      this.next = ctx.currentTime + 0.08;
      this.count = 0;
      this.timer = setInterval(() => this._tick(), 25);
      this._tick();
    }
    setBpm(bpm) { this.bpm = bpm; }
    _tick() {
      const ctx = this.audio.ctx;
      while (this.next < ctx.currentTime + 0.12) {
        this.audio.click(this.next, this.count % this.beats === 0);
        if (this.onBeat) {
          const n = this.count % this.beats, delay = (this.next - ctx.currentTime) * 1000;
          setTimeout(() => this.onBeat && this.onBeat(n), Math.max(0, delay));
        }
        this.next += 60 / this.bpm;
        this.count++;
      }
    }
    stop() { clearInterval(this.timer); this.timer = null; }
    get running() { return !!this.timer; }
  }

  PR.audio = new AudioEngine();
  PR.Metronome = Metronome;
})(window.PR);
