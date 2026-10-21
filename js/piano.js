// On-screen piano keyboard: renders keys, shows pressed/hint/feedback states, accepts mouse & touch.
(function (PR) {
  'use strict';
  const { isBlack } = PR.Notes;

  class Piano {
    constructor(container, low, high) {
      this.low = low;
      this.high = high;
      this.keys = new Map();
      this.hints = new Set();
      this.auto = new Set();
      this.el = document.createElement('div');
      this.el.className = 'piano';
      this.build();
      const scroller = document.createElement('div');
      scroller.className = 'piano-scroll';
      scroller.appendChild(this.el);
      container.appendChild(scroller);
      this.scroller = scroller;
      this.attachPointer();
      this.updateLabels();
    }

    build() {
      let whites = 0;
      for (let m = this.low; m <= this.high; m++) if (!isBlack(m)) whites++;
      this.el.style.setProperty('--whites', whites);
      const W = 100 / whites;
      let wi = 0;
      for (let m = this.low; m <= this.high; m++) {
        const k = document.createElement('div');
        k.dataset.midi = m;
        if (!isBlack(m)) {
          k.className = 'key white';
          k.style.left = (wi * W) + '%';
          k.style.width = W + '%';
          wi++;
        } else {
          const bw = W * 0.6;
          k.className = 'key black';
          k.style.left = (wi * W - bw / 2) + '%';
          k.style.width = bw + '%';
        }
        if (m === 60) k.classList.add('middle-c');
        k.innerHTML = '<span class="finger"></span><span class="lbl"></span>';
        this.el.appendChild(k);
        this.keys.set(m, k);
      }
    }

    attachPointer() {
      const active = new Map(); // pointerId -> midi
      const keyAt = (x, y) => {
        const el = document.elementFromPoint(x, y);
        const k = el && el.closest && el.closest('.key');
        return k && this.el.contains(k) ? +k.dataset.midi : null;
      };
      const velAt = (m, y) => {
        const r = this.keys.get(m).getBoundingClientRect();
        return Math.round(55 + 65 * Math.min(1, Math.max(0, (y - r.top) / r.height)));
      };
      this.el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        try { this.el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        const m = keyAt(e.clientX, e.clientY);
        if (m == null) return;
        active.set(e.pointerId, m);
        PR.input.noteOn(m, velAt(m, e.clientY), 'pointer');
      });
      this.el.addEventListener('pointermove', (e) => {
        if (!active.has(e.pointerId)) return;
        const prev = active.get(e.pointerId);
        const m = keyAt(e.clientX, e.clientY);
        if (m === prev) return;
        if (prev != null) PR.input.noteOff(prev, 'pointer');
        if (m != null) PR.input.noteOn(m, velAt(m, e.clientY), 'pointer');
        active.set(e.pointerId, m);
      });
      const end = (e) => {
        if (!active.has(e.pointerId)) return;
        const m = active.get(e.pointerId);
        if (m != null) PR.input.noteOff(m, 'pointer');
        active.delete(e.pointerId);
      };
      this.el.addEventListener('pointerup', end);
      this.el.addEventListener('pointercancel', end);
      this.el.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    updateLabels() {
      let mode = PR.settings.get('keyLabels');
      if (this.hideNoteNames) mode = mode === 'both' || mode === 'keys' ? 'keys' : 'none';
      for (const [m, k] of this.keys) {
        const note = (mode === 'notes' || mode === 'both') && (!isBlack(m) || mode === 'both')
          ? PR.Notes.label(m) + (m % 12 === 0 ? `<sub>${Math.floor(m / 12) - 1}</sub>` : '') : '';
        const key = (mode === 'keys' || mode === 'both') ? PR.input.keyFor(m) : '';
        k.querySelector('.lbl').innerHTML =
          (note ? `<b>${note}</b>` : '') + (key ? `<i>${PR.esc(key)}</i>` : '');
      }
    }

    press(m) { const k = this.keys.get(m); if (k) k.classList.add('down'); }
    release(m) { const k = this.keys.get(m); if (k) k.classList.remove('down'); }

    flash(m, cls, ms) {
      const k = this.keys.get(m);
      if (!k) return;
      k.classList.remove(cls);
      void k.offsetWidth; // restart animation
      k.classList.add(cls);
      clearTimeout(k['_t' + cls]);
      k['_t' + cls] = setTimeout(() => k.classList.remove(cls), ms || 420);
    }

    // hints: Map midi -> finger label
    setHints(hints) {
      for (const m of this.hints) {
        const k = this.keys.get(m);
        if (k) { k.classList.remove('hint'); k.querySelector('.finger').textContent = ''; }
      }
      this.hints = new Set();
      if (!hints) return;
      for (const [m, f] of hints) {
        const k = this.keys.get(m);
        if (!k) continue;
        k.classList.add('hint');
        k.querySelector('.finger').textContent = f || '';
        this.hints.add(m);
      }
      this.reveal([...this.hints]);
    }

    setAuto(set) {
      for (const m of this.auto) if (!set.has(m)) { const k = this.keys.get(m); if (k) k.classList.remove('auto'); }
      for (const m of set) if (!this.auto.has(m)) { const k = this.keys.get(m); if (k) k.classList.add('auto'); }
      this.auto = new Set(set);
    }

    clearAll() {
      this.setHints(null);
      this.setAuto(new Set());
      for (const k of this.keys.values()) k.classList.remove('down', 'ok', 'bad');
    }

    // Keep given keys visible when the keyboard is wider than the screen.
    reveal(midis) {
      if (!midis.length || this.scroller.scrollWidth <= this.scroller.clientWidth) return;
      const k = this.keys.get(midis[0]);
      if (!k) return;
      const kr = k.getBoundingClientRect(), sr = this.scroller.getBoundingClientRect();
      if (kr.left < sr.left + 20 || kr.right > sr.right - 20) {
        this.scroller.scrollBy({ left: kr.left - sr.left - sr.width / 2, behavior: 'smooth' });
      }
    }

    centerOn(midi) {
      const k = this.keys.get(midi);
      if (!k || this.scroller.scrollWidth <= this.scroller.clientWidth) return;
      this.scroller.scrollLeft = k.offsetLeft - this.scroller.clientWidth / 2;
    }
  }

  PR.Piano = Piano;
})(window.PR);
