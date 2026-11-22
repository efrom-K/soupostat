const townSites = {
  dock: [198, 245],
  pantry: [137, 374],
  atlas: [214, 365],
  battery: [182, 366],
  port: [31, 145],
  archive: [75, 145],
  mill: [500, 318],
  rail: [150, 380],
  assembly: [359, 377],
  press: [393, 368],
  bridge: [490, 363],
  capital: [307, 371],
};
// The settlement is attached to landmarks in the painted refrigerator.
function drawTown(ctx, s, time) {
  const built = s.city.built,
    ink = '#55462e';
  const has = (id) => built.includes(id);
  function poly(pts, fill, stroke = ink, width = 1) {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    if (fill) {
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
    }
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke();
  }
  function box(x, y, w, h, fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
  }
  function disc(x, y, r, fill) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
  function hut(x, y, w, color) {
    box(x, y - 11, w, 11, '#e4d39d');
    poly(
      [
        [x - 2, y - 11],
        [x + w * 0.46, y - 20],
        [x + w + 2, y - 11],
      ],
      color,
    );
    box(x + 3, y - 8, 4, 4, '#ffd86e');
  }
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  function bunting(x1, y1, x2, y2) {
    const marks = [];
    for (let i = 0; i <= 12; i++) {
      const k = i / 12;
      marks.push([x1 + (x2 - x1) * k, y1 + (y2 - y1) * k + Math.sin(k * Math.PI) * 12]);
    }
    poly(marks, null, ink, 1.3);
    for (let i = 1; i < 12; i += 2) {
      const [x, y] = marks[i];
      poly(
        [
          [x, y],
          [x + 8, y + 1],
          [x + 4 + Math.sin(time + i) * 2, y + 10],
        ],
        ['#bf5c41', '#e4bc56', '#82a68e'][i % 3],
      );
    }
  }
  if (has('port')) bunting(47, 129, 193, 221);
  if (has('assembly')) bunting(361, 358, 496, 303);
  if (has('bridge')) bunting(490, 340, 584, 337);
  if (s.city.work) {
    const p = SoupCity.projects.find((item) => item.id === s.city.work.id),
      [x, y] = townSites[p.id];
    const k = 1 - Math.max(0, s.city.work.until - s.seconds) / p.duration;
    const h = 8 + 14 * k;
    poly(
      [
        [x - 9, y],
        [x - 9, y - h],
        [x + 11, y - h],
        [x + 11, y],
        [x - 9, y - h],
        [x + 11, y - h],
      ],
      null,
      '#795e42',
      2,
    );
    poly(
      [
        [x - 13, y + 2],
        [x + 14, y + 2],
      ],
      null,
      '#d3a259',
      3,
    );
    disc(x + Math.sin(time) * 3, y - h - 2, 2.3, '#c6ce81');
  }
  if (has('dock')) {
    for (let i = 0; i < 6; i++) box(187 + i * 6, 244 + i * 0.8, 6, 4, '#ad7d54');
    poly(
      [
        [190, 245],
        [186, 230],
        [222, 238],
        [222, 250],
      ],
      null,
      ink,
    );
  }
  if (has('pantry')) {
    hut(126, 375, 24, '#ad6444');
    for (let j = 0; j < 3; j++) disc(156 + j * 4, 372, 4, '#e3b75f');
  }
  if (has('atlas')) {
    poly(
      [
        [206, 367],
        [229, 361],
        [244, 372],
        [219, 377],
      ],
      '#f3e1b0',
    );
    poly(
      [
        [212, 368],
        [218, 366],
        [227, 370],
        [234, 368],
      ],
      null,
      '#aa5941',
    );
  }
  if (has('battery')) {
    box(181, 362, 12, 15, '#839d90');
    for (let i = 0; i < 3; i++) box(183, 365 + i * 4, 8, 2, '#e9bd62');
  }
  if (has('port')) {
    poly(
      [
        [29, 147],
        [31, 112],
        [71, 120],
        [47, 125],
        [32, 116],
      ],
      null,
      ink,
      2,
    );
    const slide = Math.sin(time * 0.65) * 6;
    poly(
      [
        [64, 119],
        [64, 132 + slide],
      ],
      null,
      ink,
    );
    box(58, 132 + slide, 12, 7, '#d2ad6e');
  }
  if (has('archive')) {
    hut(65, 149, 22, '#729280');
    for (let i = 0; i < 4; i++) box(69 + i * 4, 140, 2, 7, ['#9b583c', '#c6a45c', '#55766a'][i % 3]);
  }
  if (has('mill')) {
    hut(492, 326, 20, '#ab6d45');
    ctx.save();
    ctx.translate(501, 309);
    ctx.rotate(time * 0.7);
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      poly(
        [
          [0, -1],
          [4, -13],
          [10, -14],
          [5, -4],
        ],
        '#d9c297',
      );
    }
    disc(0, 0, 2, '#96734c');
    ctx.restore();
  }
  if (has('rail')) {
    for (let i = 0; i < 31; i++)
      poly(
        [
          [138 + i * 10, 382],
          [142 + i * 10, 387],
        ],
        null,
        '#99744e',
        2,
      );
    poly(
      [
        [130, 382],
        [455, 382],
      ],
      null,
      ink,
      1.5,
    );
    poly(
      [
        [130, 387],
        [455, 387],
      ],
      null,
      ink,
      1.5,
    );
    const x = 139 + (1 - Math.cos(time * 0.22)) * 147;
    box(x, 372, 18, 9, '#ab6041');
    disc(x + 4, 381, 2.5, ink);
    disc(x + 15, 381, 2.5, ink);
  }
  if (has('assembly')) {
    hut(345, 377, 35, '#748555');
    for (let j = 0; j < 4; j++) box(350 + j * 8, 367, 2, 10, '#f2dda2');
  }
  if (has('press')) {
    box(385, 365, 20, 11, '#8da399');
    box(389, 361, 13, 5, '#d4bb82');
    const y = Math.sin(time * 1.6) * 2;
    poly(
      [
        [400, 364 + y],
        [411, 363 + y],
        [413, 367 + y],
        [400, 369 + y],
      ],
      '#f6edcd',
    );
  }
  if (has('bridge')) {
    const pts = [];
    for (let i = 0; i <= 18; i++) pts.push([454 + i * 7, 363 + Math.sin((i * Math.PI) / 18) * 6]);
    poly(pts, null, '#8b6441', 4);
    poly(
      pts.map(([x, y]) => [x, y - 10]),
      null,
      ink,
    );
    for (let i = 0; i < pts.length; i += 3) poly([pts[i], [pts[i][0], pts[i][1] - 12]], null, ink);
  }
  if (has('capital')) {
    hut(290, 379, 36, '#a25740');
    poly(
      [
        [308, 362],
        [308, 324],
        [327, 329 + Math.sin(time) * 2],
        [308, 335],
      ],
      '#b55739',
    );
  }
  if (s.city.voyage && s.seconds < s.city.voyage.until) {
    const x = 74 + (1 - Math.cos(time * 0.18)) * 43;
    disc(x, 351, 2.2, '#a5b875');
    disc(x - 5, 353, 2, '#cfce88');
  }
  ctx.restore();
}
