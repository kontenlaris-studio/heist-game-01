// GILDED HOUR — synthesized sound, no audio files. A tiny WebAudio kit: every
// cue is an oscillator shape, so the game ships as pure text and still ticks,
// rings and wails like a casino at 3 a.m.

let ctx = null;
let master = null;

export function initAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.16;
    master.connect(ctx.destination);
  } catch { ctx = null; }
}

function tone(freq, at, dur, type = 'sine', vol = 1, slideTo = null) {
  if (!ctx) return;
  const t0 = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain); gain.connect(master);
  osc.start(t0); osc.stop(t0 + dur + 0.05);
}

export function playCue(name) {
  if (!ctx) return;
  if (name === 'coin') { tone(1560, 0, 0.09, 'sine', 0.7); tone(2090, 0.07, 0.14, 'sine', 0.6); }
  else if (name === 'grab') { tone(660, 0, 0.08, 'triangle', 0.8); tone(880, 0.06, 0.1, 'triangle', 0.8); tone(1320, 0.12, 0.16, 'triangle', 0.7); }
  else if (name === 'emp') { tone(1200, 0, 0.35, 'sawtooth', 0.35, 120); }
  else if (name === 'spot') { tone(980, 0, 0.07, 'square', 0.4); }
  else if (name === 'laser') { tone(220, 0, 0.22, 'sawtooth', 0.5, 180); tone(233, 0, 0.22, 'sawtooth', 0.4, 190); }
  else if (name === 'win') { [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.11, 0.24, 'triangle', 0.8)); }
  else if (name === 'caught') { [392, 330, 262, 196].forEach((f, i) => tone(f, i * 0.14, 0.3, 'sawtooth', 0.45)); }
}

/** The alarm's own voice: a beep that quickens as the meter climbs. */
export function alarmBeep(intensity) {
  tone(740 + intensity * 3, 0, 0.08, 'square', 0.22);
}
