// All drawing coordinates use the original illustration's 640 × 426 composition.
function startScene(canvas, getState) {
  const ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let previous = -100,
    frame = 0,
    lastTurn = -1,
    burst = null;
  function oval(x, y, rx, ry, fill, stroke, angle = 0) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, angle, 0, 2 * Math.PI);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.35;
      ctx.stroke();
    }
  }
  function line(points, color, width = 1.3, fill = null) {
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    points.slice(1).forEach((p) => ctx.lineTo(...p));
    if (fill) {
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  function bug(x, y, size, t, index) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(index * 3.2 + t * 0.45) * 0.38);
    ctx.scale(size, size);
    const ink = '#555433',
      body = index % 3 === 0 ? '#d5d887' : '#bdcc76';
    for (let i = 0; i < 5; i++) {
      const a = i * 1.21 + 0.2;
      line(
        [
          [Math.cos(a) * 6, Math.sin(a) * 3],
          [Math.cos(a) * 8, Math.sin(a) * 5],
        ],
        ink,
        1,
      );
    }
    oval(0, 0, 6.2, 3.7, body, ink);
    oval(-2, -0.7, 0.8, 1, ink);
    oval(1.5, -0.8, 0.8, 1, ink);
    ctx.restore();
  }
  function village(x, y, scale, count) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    for (let i = 0; i < count; i++) {
      const a = i * 11,
        h = 8 + ((i * 7) % 13),
        b = (i % 3) * 1.5;
      line(
        [
          [a, b],
          [a + 0.6, -h],
          [a + 8, -h + 1],
          [a + 9, b],
        ],
        '#5d5234',
        1,
        '#d6c58c',
      );
      line(
        [
          [a - 1, -h],
          [a + 4, -h - 5],
          [a + 10, -h + 1],
        ],
        '#665533',
        1,
        i % 2 ? '#98a56c' : '#c97d51',
      );
      for (let w = 0; w < (h > 12 ? 2 : 1); w++)
        oval(a + 4, -h + 3 + w * 5, 1.3, 1.6, '#ffe895', '#876947');
    }
    line(
      [
        [1, -8],
        [0, -29],
        [10, -26],
        [1, -22],
      ],
      '#694d37',
      1.25,
      '#d06d45',
    );
    ctx.restore();
  }
  function draw(now) {
    const s = getState();
    const t = reduced.matches ? 0 : now / 1000;
    ctx.setTransform(canvas.width / 640, 0, 0, canvas.height / 426, 0, 0);
    ctx.clearRect(0, 0, 640, 426);
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(312, 193, 178, 62, -0.02, 0, Math.PI * 2);
    ctx.clip();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(80,173,53,' + s.pigment * 0.007 + ')';
    ctx.fillRect(110, 113, 410, 162);
    ctx.globalCompositeOperation = 'source-over';
    if (s.cloud) {
      ctx.fillStyle = 'rgba(197,168,108,' + s.cloud * 0.004 + ')';
      ctx.fillRect(110, 113, 410, 162);
    }
    const count = Math.min(24, Math.max(1, Math.ceil(s.pop / 3) - 1));
    for (let i = 0; i < count; i++) {
      const a = i * 2.4 + 1,
        r = Math.sqrt(((i % 13) + 1) / 15);
      bug(
        313 + 153 * r * Math.cos(a) + 2 * Math.sin(t * 0.6 + i),
        192 + 49 * r * Math.sin(a) + 1.5 * Math.cos(t * 0.55 + i),
        0.72 + (i % 3) * 0.12,
        t,
        i,
      );
    }
    for (let i = 0; i < Math.floor(s.food / 3); i++) {
      const a = i * 2.4 + 0.4,
        x = 309 + Math.cos(a) * 123,
        y = 196 + Math.sin(a) * 43 + Math.sin(t * 0.7 + i);
      oval(x, y, 4.8, 2.8, i % 2 ? '#eed288' : '#e89542', '#a46d34', a * 0.2);
    }
    ctx.restore();
    if (s.stage >= 1) {
      bug(213, 252, 1, t, 4);
      bug(229, 257, 0.8, t, 3);
      village(250, 259, 0.58, 1);
    }
    if (s.stage >= 2) {
      village(19, 146, 0.85, 4);
      bug(43, 192, 0.85, t, 1);
    }
    if (s.stage >= 3) {
      village(525, 313, 0.78, 5);
      village(95, 384, 0.65, 3);
    }
    if (s.stage >= 4) {
      village(183, 387, 1.22, 11);
      village(444, 386, 1.05, 8);
      village(492, 91, 0.82, 4);
    }
    if (burst && now - burst.at < 1350 && !reduced.matches) {
      const k = (now - burst.at) / 1350;
      ctx.save();
      ctx.globalAlpha = Math.min(1, (1 - k) * 2);
      ctx.font = 'bold 16px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#593f2c';
      ctx.fillStyle = '#fff3c7';
      ctx.strokeText(burst.label, 315, 177 - 15 * k);
      ctx.fillText(burst.label, 315, 177 - 15 * k);
      ctx.restore();
    }
    lastTurn = s.turn;
  }
  function loop(now) {
    if (now - previous >= 80 && (!reduced.matches || lastTurn !== getState().turn)) {
      draw(now);
      previous = now;
    }
    frame = requestAnimationFrame(loop);
  }
  function resume() {
    cancelAnimationFrame(frame);
    if (!document.hidden) {
      draw(performance.now());
      frame = requestAnimationFrame(loop);
    }
  }
  document.addEventListener('visibilitychange', resume);
  resume();
  return (label) => {
    burst = label ? { label, at: performance.now() } : null;
    draw(performance.now());
  };
}
