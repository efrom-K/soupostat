// All drawing coordinates use the original illustration's 640 × 426 composition.
function startScene(canvas, getState, getTime) {
  const ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let last = null,
    lastDraw = -1000,
    burst = null;
  let foodPulseAt = -10,
    energyPulseAt = -10,
    birthAt = -10,
    stagePulseAt = -10;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
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
  function drawEvent(ev, t) {
    if (!ev || !ev.id) return;
    const progress = reduced.matches ? 0.5 : clamp((t - ev.start) / (ev.until - ev.start), 0, 1);
    const p = progress,
      fade = Math.min(1, 0.25 + progress * 7, 0.25 + (1 - progress) * 7);
    ctx.save();
    ctx.globalAlpha = fade;
    if (ev.id === 'stir') {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(312, 193, 176, 60, -0.02, 0, Math.PI * 2);
      ctx.clip();
      const a = progress * Math.PI * 6;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.ellipse(312, 193, 35 + i * 19, 12 + i * 7, a + i * 0.3, 0, Math.PI * 1.5);
        ctx.strokeStyle = `rgba(255,242,182,${0.64 - i * 0.12})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      for (let i = 0; i < 7; i++) {
        const q = a + (i * Math.PI * 2) / 7,
          r = 25 + (i % 3) * 18;
        oval(
          312 + Math.cos(q) * r,
          193 + Math.sin(q) * r * 0.34,
          5,
          3,
          i % 2 ? '#e89542' : '#91a74b',
          '#775334',
          q,
        );
        bug(312 + Math.cos(q + 1) * r * 0.6, 193 + Math.sin(q + 1) * r * 0.22, 0.56, t, i + 4);
      }
      ctx.restore();
      const sx = 312 + Math.cos(a) * 38,
        sy = 191 + Math.sin(a) * 14;
      line(
        [
          [464 + Math.cos(a) * 9, 61],
          [sx, sy],
        ],
        '#64492e',
        8,
      );
      line(
        [
          [464 + Math.cos(a) * 9, 61],
          [sx, sy],
        ],
        '#cbb390',
        4.5,
      );
      oval(sx, sy, 15, 7, '#d6c4a1', '#694d39', -0.44);
      oval(sx - 1, sy - 1, 10, 4, '#b69d77', null, -0.44);
    } else if (ev.id === 'crumbs') {
      for (let i = 0; i < 8; i++) {
        const q = (p * 1.7 + i * 0.17) % 1,
          x = 214 + i * 28,
          y = 108 + q * 72;
        oval(x, y, 1.5 + (i % 3), 1.2, '#9a6f43');
        const rr = Math.max(0, (q - 0.3) * 22);
        if (rr) {
          ctx.beginPath();
          ctx.ellipse(x, 193, rr, rr * 0.29, 0, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255,244,190,.7)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    } else if (ev.id === 'lamp') {
      const pulse = 0.5 + 0.5 * Math.sin(p * Math.PI * 3);
      const g = ctx.createRadialGradient(469, 42, 6, 436, 130, 211);
      g.addColorStop(0, `rgba(255,244,177,${0.22 + 0.14 * pulse})`);
      g.addColorStop(1, 'rgba(255,236,163,0)');
      ctx.fillStyle = g;
      ctx.fillRect(180, 0, 460, 335);
      for (let i = 0; i < 5; i++) {
        const x = 205 + i * 53,
          y = 102 + (i % 2) * 8,
          len = 30 + 12 * Math.sin(p * 6 + i);
        line(
          [
            [x, y],
            [x + Math.sin(p * 2 + i) * 10, y + len],
          ],
          'rgba(255,242,176,.4)',
          1.4,
        );
      }
    } else if (ev.id === 'fog') {
      const g = ctx.createRadialGradient(312, 198, 92, 312, 198, 270);
      g.addColorStop(0, 'rgba(230,240,229,0)');
      g.addColorStop(1, 'rgba(210,225,222,.66)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 640, 426);
      for (let i = 0; i < 11; i++) {
        const x = 14 + ((i * 59) % 610),
          y = 28 + ((i * 71) % 360),
          q = (p * 0.35 + i * 0.11) % 1;
        oval(x, y + q * 13, 2, 3, 'rgba(226,242,239,.7)', '#dbe9df');
      }
    } else if (ev.id === 'frost') {
      for (let i = 0; i < 12; i++) {
        const x = i % 2 ? 638 - ((i * 41) % 100) : (i * 37) % 110,
          y = 24 + ((i * 53) % 380),
          reach = 8 + progress * 30;
        for (let j = -1; j <= 1; j++) {
          line(
            [
              [x, y],
              [x + j * reach * 0.45, y + reach],
              [x + j * reach, y + reach * 1.45],
            ],
            'rgba(226,244,241,.72)',
            1.1,
          );
        }
      }
      const g = ctx.createRadialGradient(320, 205, 120, 320, 205, 310);
      g.addColorStop(0, 'rgba(224,242,241,0)');
      g.addColorStop(1, 'rgba(209,231,230,.35)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 640, 426);
    } else if (ev.id === 'warm') {
      const g = ctx.createRadialGradient(320, 400, 8, 320, 400, 310);
      g.addColorStop(0, `rgba(255,178,63,${0.25 + 0.1 * Math.sin(p * 4)})`);
      g.addColorStop(1, 'rgba(255,178,63,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 100, 640, 326);
      for (let i = 0; i < 8; i++) {
        const x = 145 + i * 48,
          y = 365 - ((p * 36 + i * 19) % 180);
        oval(x, y, 2, 5, 'rgba(255,191,87,.55)');
      }
    }
    ctx.restore();
  }
  function draw(s) {
    const time = getTime(),
      staticMotion = reduced.matches,
      t = staticMotion ? 0 : time;
    if (last && s.seconds < last.seconds) {
      foodPulseAt = energyPulseAt = birthAt = stagePulseAt = -10;
      burst = null;
    }
    if (last && s.meals > last.meals) foodPulseAt = time;
    if (last && s.lightMeals > last.lightMeals) energyPulseAt = time;
    if (last && s.pop > last.pop) birthAt = time;
    if (last && s.stage > last.stage) stagePulseAt = time;
    ctx.setTransform(canvas.width / 640, 0, 0, canvas.height / 426, 0, 0);
    ctx.clearRect(0, 0, 640, 426);
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(312, 193, 178, 62, -0.02, 0, Math.PI * 2);
    ctx.clip();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(80,173,53,' + (s.pigment || 0) * 0.007 + ')';
    ctx.fillRect(110, 113, 410, 162);
    ctx.globalCompositeOperation = 'source-over';
    if (s.cloud) {
      ctx.fillStyle = 'rgba(197,168,108,' + s.cloud * 0.004 + ')';
      ctx.fillRect(110, 113, 410, 162);
    }
    if (s.event?.id === 'warm') {
      ctx.fillStyle = 'rgba(244,164,64,.09)';
      ctx.fillRect(110, 113, 410, 162);
    }
    const count = Math.min(32, Math.max(1, Math.ceil((s.pop || 0) / 3) - 1));
    for (let i = 0; i < count; i++) {
      const a = i * 2.4 + 1 + (s.event?.id === 'stir' && !staticMotion ? (t - s.event.start) * 0.9 : 0),
        r = Math.sqrt(((i % 13) + 1) / 15),
        w = staticMotion ? 0 : 1;
      bug(
        313 + 153 * r * Math.cos(a) + 2 * Math.sin(t * 0.6 + i) * w,
        192 + 49 * r * Math.sin(a) + 1.5 * Math.cos(t * 0.55 + i) * w,
        0.72 + (i % 3) * 0.12,
        t,
        i,
      );
    }
    const foodCount = Math.min(48, Math.max(0, Math.floor((s.food || 0) / 3)));
    for (let i = 0; i < foodCount; i++) {
      const a =
          i * 2.4 + 0.4 + (s.event?.id === 'stir' && !staticMotion ? (t - s.event.start) * 0.9 : 0),
        x = 309 + Math.cos(a) * 123,
        y = 196 + Math.sin(a) * 43 + (staticMotion ? 0 : Math.sin(t * 0.7 + i));
      oval(x, y, 4.8, 2.8, i % 2 ? '#eed288' : '#e89542', '#a46d34', a * 0.2);
    }
    if (!staticMotion) {
      const bite = time - foodPulseAt;
      if (bite >= 0 && bite < 1) {
        for (let i = 0; i < 5; i++) {
          const a = i * 1.25;
          oval(
            307 + Math.cos(a) * (1 - bite) * 16,
            199 + Math.sin(a) * (1 - bite) * 8,
            2,
            1.6,
            '#edbc63',
          );
        }
      }
      const shine = time - energyPulseAt;
      if (shine >= 0 && shine < 1.5) {
        for (let i = 0; i < 5; i++) {
          const x = 244 + i * 27;
          line(
            [
              [454 + i * 5, 77],
              [x + 15, 157],
              [x, 180],
            ],
            'rgba(255,234,142,' + 0.4 * (1 - shine / 1.5) + ')',
            1.8,
          );
        }
      }
      const split = time - birthAt;
      if (split >= 0 && split < 1.8) {
        for (const sign of [-1, 1])
          bug(328 + sign * (1 + split * 6), 205 + sign * split * 2, 1.1, t, sign + 2);
      }
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
    drawEvent(s.event, time);
    if (!staticMotion) {
      const age = t - stagePulseAt;
      if (age < 3) {
        const alpha = clamp(1 - age / 3, 0, 1),
          x = [0, 250, 80, 540, 320][Math.min(4, s.stage)],
          y = [0, 240, 125, 290, 370][Math.min(4, s.stage)];
        ctx.save();
        ctx.globalAlpha = alpha;
        for (let i = 0; i < 12; i++) {
          const a = (i * Math.PI) / 6 + t * 1.8;
          line(
            [
              [x, y],
              [x + Math.cos(a) * (12 + age * 12), y + Math.sin(a) * (12 + age * 7)],
            ],
            '#f7d875',
            1.7,
          );
        }
        ctx.font = '16px serif';
        ctx.fillText('✦', x, y - 32 - age * 5);
        ctx.restore();
      }
    }
    if (burst && !staticMotion && time - burst.at < 1.35) {
      const k = (time - burst.at) / 1.35;
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
    last = s;
  }
  return function paint(label) {
    const s = getState(),
      now = performance.now();
    if (label) burst = { label, at: getTime() };
    if (label === undefined && (reduced.matches ? last === s : now - lastDraw < 50)) return;
    lastDraw = now;
    draw(s);
  };
}
