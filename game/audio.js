// Original three-beat score. Musical time stays independent of simulation speed.
const SoupAudio = (() => {
  let ctx,
    bus,
    timer,
    next = 0,
    beat = 0,
    enabled = false,
    playing = false,
    getState;
  const chords = [
    [50, 57, 62, 66],
    [47, 54, 59, 62],
    [43, 55, 59, 62],
    [45, 52, 57, 61],
    [50, 54, 57, 62],
    [43, 50, 55, 59],
    [40, 52, 55, 59],
    [45, 52, 57, 61],
  ];
  const day = [
    69, 66, 64, 62, 66, 69, 71, 67, 66, 64, 61, 64, 66, 69, 74, 71, 67, 62, 64, 67, 71, 69, 64, 61,
  ];
  const night = [66, 0, 62, 59, 62, 0, 67, 0, 64, 61, 0, 57, 62, 66, 0, 59, 0, 55, 59, 62, 0, 61, 0, 64];
  function unlock() {
    if (!ctx) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      ctx = new Audio();
      bus = ctx.createGain();
      bus.gain.value = 0.7;
      bus.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  }
  function note(midi, when, length, volume, type = 'sine') {
    if (!ctx || !midi) return;
    const osc = ctx.createOscillator(),
      amp = ctx.createGain(),
      filter = ctx.createBiquadFilter();
    osc.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
    osc.type = type;
    filter.type = 'lowpass';
    filter.frequency.value = 1450;
    filter.Q.value = 0.35;
    amp.gain.setValueAtTime(0.0001, when);
    amp.gain.exponentialRampToValueAtTime(volume, when + 0.018);
    amp.gain.exponentialRampToValueAtTime(0.0001, when + length);
    osc.connect(filter);
    filter.connect(amp);
    amp.connect(bus);
    osc.start(when);
    osc.stop(when + length + 0.03);
    osc.onended = () => {
      osc.disconnect();
      filter.disconnect();
      amp.disconnect();
    };
  }
  function schedule() {
    if (!ctx || ctx.state !== 'running') return;
    if (next < ctx.currentTime) next = ctx.currentTime + 0.05;
    while (next < ctx.currentTime + 0.22) {
      const s = getState(),
        light = SoupGame.phase(s).light,
        bar = Math.floor(beat / 3),
        slot = beat % 3;
      const chord = chords[bar % 8],
        line = light ? day : night;
      if (slot === 0) note(chord[0] - 12, next, 0.72, 0.105, 'triangle');
      else
        chord
          .slice(1)
          .forEach((pitch, i) => note(pitch, next + i * 0.024, 0.37, light ? 0.03 : 0.019, 'triangle'));
      const phrase = (beat + (Math.floor(bar / 8) % 2) * 6) % line.length;
      note(line[phrase], next + 0.06, slot === 2 ? 0.7 : 0.52, light ? 0.055 : 0.037);
      if (s.city.built.length >= 5 && bar % 2 && slot === 2)
        note(chord[2] + 12, next + 0.31, 0.57, 0.022);
      next += light ? 0.66 : 0.77;
      beat++;
    }
  }
  function sync(on, run, reader) {
    enabled = on;
    playing = run;
    getState = reader;
    if (enabled && playing && !document.hidden) {
      unlock();
      if (!ctx || timer) return;
      next = ctx.currentTime + 0.05;
      schedule();
      timer = setInterval(schedule, 105);
    } else {
      clearInterval(timer);
      timer = 0;
    }
  }
  function cue(index) {
    unlock();
    if (ctx) note([60, 64, 67, 72][index % 4], ctx.currentTime + 0.01, 0.32, 0.15, 'triangle');
  }
  return { sync, cue };
})();
