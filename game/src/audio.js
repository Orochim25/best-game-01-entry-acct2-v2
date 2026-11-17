// LUMENFALL v2 — all sound is synthesized with WebAudio: no audio files, no network.
// SFX: shots, explosions, coins, wave horn, boss roar. Music: a slow ambient pad loop.

export class Sound {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicOn = true;
    this.sfxOn = true;
    this.musicTimer = null;
    this.chordIdx = 0;
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
  }

  tone(freq, dur, type, vol, slideTo, delay = 0) {
    if (!this.ctx || !this.sfxOn) return;
    const t0 = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(this.master);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  noise(dur, vol, lowpass, delay = 0) {
    if (!this.ctx || !this.sfxOn) return;
    const t0 = this.ctx.currentTime + delay;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = lowpass;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.master);
    src.start(t0);
  }

  shoot(kind) {
    if (kind === 'cannon') { this.noise(0.18, 0.25, 900); this.tone(120, 0.15, 'sine', 0.2, 50); }
    else if (kind === 'arc') { this.tone(1400, 0.08, 'sawtooth', 0.08, 300); this.noise(0.06, 0.08, 4000); }
    else if (kind === 'sniper') { this.tone(900, 0.12, 'square', 0.1, 150); this.noise(0.1, 0.15, 2500); }
    else if (kind === 'frost') { this.tone(1200, 0.1, 'sine', 0.07, 1800); }
    else { this.tone(700 + Math.random() * 200, 0.06, 'triangle', 0.08, 300); }
  }

  explode(big) {
    this.noise(big ? 0.6 : 0.3, big ? 0.4 : 0.22, big ? 700 : 1200);
    this.tone(big ? 90 : 140, big ? 0.5 : 0.25, 'sine', 0.3, 35);
  }

  coin() { this.tone(1320, 0.07, 'sine', 0.08); this.tone(1760, 0.09, 'sine', 0.07, null, 0.06); }
  place() { this.tone(520, 0.08, 'triangle', 0.12, 780); }
  upgrade() { this.tone(660, 0.1, 'triangle', 0.12); this.tone(880, 0.12, 'triangle', 0.12, null, 0.08); this.tone(1320, 0.16, 'triangle', 0.1, null, 0.16); }
  horn() { this.tone(196, 0.5, 'sawtooth', 0.12, 196); this.tone(294, 0.5, 'sawtooth', 0.1, 294, 0.05); }
  leak() { this.tone(220, 0.3, 'sawtooth', 0.16, 90); }
  meteor() { this.noise(0.8, 0.35, 500); this.tone(60, 0.7, 'sine', 0.35, 30); }
  freeze() { this.tone(1800, 0.5, 'sine', 0.1, 2400); this.tone(2400, 0.4, 'sine', 0.06, 3000, 0.1); }
  boss() { this.tone(55, 1.2, 'sawtooth', 0.3, 40); this.noise(1.0, 0.25, 300); }
  victory() {
    [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.35, 'triangle', 0.14, null, i * 0.14));
  }

  startMusic() {
    if (!this.ctx || this.musicTimer) return;
    const chords = [
      [220.0, 261.63, 329.63],
      [174.61, 220.0, 261.63],
      [196.0, 246.94, 293.66],
      [146.83, 220.0, 293.66],
    ];
    const playChord = () => {
      if (!this.musicOn || !this.ctx) return;
      const chord = chords[this.chordIdx % chords.length];
      this.chordIdx++;
      const t0 = this.ctx.currentTime;
      for (const f of chord) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'triangle';
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0, t0);
        g.gain.linearRampToValueAtTime(0.045, t0 + 1.2);
        g.gain.linearRampToValueAtTime(0.0, t0 + 3.8);
        o.connect(g);
        g.connect(this.master);
        o.start(t0);
        o.stop(t0 + 4);
      }
      // Sparse plucked arpeggio over the pad.
      const notes = [440, 523.25, 659.25, 880];
      const n = notes[Math.floor(Math.random() * notes.length)];
      this.tone(n, 0.5, 'sine', 0.03);
    };
    playChord();
    this.musicTimer = window.setInterval(playChord, 4000);
  }
}
