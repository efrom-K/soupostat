// Cut-paper silhouettes, drawn at the same scale for visits and diary entries.
(function () {
  const lada = `<g class="micro-swim">
    <g class="micro-flagellum" fill="none"><path d="M48 82C30 77 36 99 20 99S8 88 3 95" stroke-width="3"/><path d="M46 85C31 83 33 104 18 103" stroke="#ad8553" stroke-width="1.3"/></g>
    <path d="M35 78C27 58 47 31 74 25c18-5 35 1 38 15 3 12-7 23-21 24-19 2-26 10-33 19-7 10-20 7-23-5Z" fill="#e7ad4d"/>
    <path d="M40 74c-3-15 13-37 36-43 15-4 27-1 30 8 2 8-5 16-17 18-18 2-28 10-37 21-5 6-10 6-12-4Z" fill="#f8ce78" stroke="#ac793e" stroke-width="1.3"/>
    <path d="M52 65c-7-6 4-17 10-13s-2 12-6 8c-5-7 9-21 18-16 8 5-2 11-5 7s9-14 15-11" fill="none" stroke="#93673c" stroke-width="2"/>
    <g fill="#b57642" stroke="none"><circle cx="89" cy="48" r="3"/><circle cx="96" cy="40" r="2"/><circle cx="49" cy="73" r="1.8"/><circle cx="74" cy="35" r="1.7"/><circle cx="60" cy="66" r="2"/></g>
    <path d="m43 53 4-6m-1 10 5-7m40-17 5 1" fill="none" stroke="#fff1ac" stroke-width="2.5"/>
  </g>`;
  function coccus(x, y, size, tint) {
    return `<g transform="translate(${x} ${y}) scale(${size})"><path d="M-21-9c5-13 24-16 34-6 12 11 9 26-2 33-13 8-30 2-34-11-2-5-1-11 2-16Z" fill="${tint}"/>
      <path d="M-17-7c3-6 8-10 15-10" fill="none" stroke="#ffe3ae" stroke-width="3"/>
      <path d="M-12 4c4-7 9 2 13-4s9-4 10 0" fill="none" stroke="#9c5740" stroke-width="1.6"/>
      <g fill="#aa5c40" stroke="none"><circle cx="7" cy="9" r="3.1"/><circle cx="13" cy="5" r="1.7"/><circle cx="-7" cy="11" r="2"/></g></g>`;
  }
  const mira = `<g class="micro-cluster"><path d="M35 36Q53 18 72 34q23-6 31 16t-2 33q-2 24-26 23-19 8-32-7-23 1-25-19-10-20 6-34Z" fill="#f4d59d" stroke="#c69866" stroke-dasharray="3 3" stroke-width="1.5"/>
    ${coccus(54, 49, .94, '#d88759')}${coccus(80, 59, .91, '#e9a46f')}
    ${coccus(43, 75, .97, '#edac78')}${coccus(71, 82, 1, '#de9267')}</g>`;
  const tim = `<g class="micro-drift"><g transform="rotate(14 64 62)">
    <g class="micro-fibres" fill="none" stroke="#476b64"><path d="m61 87-20 9-8 16m29-24-9 17 1 12m13-29 18 8 8 16m-27-24 8 17-1 12"/><path d="m63 88-2 17-7 7m11-24 3 15 7 6" stroke-width="1.4"/></g>
    <path d="M58 55h12l-2 32-4 6-5-6Z" fill="#92b9a8"/><path d="m59 60 10 3m-10 3 10 3m-10 3 9 3m-9 3 9 3" fill="none" stroke="#557e70"/>
    <path d="m56 84 16 1 3 4-21-1Z" fill="#d6cc87"/>
    <path d="m63 12 22 10 6 23-17 17-23-2-14-19 5-20Z" fill="#79a993"/>
    <path d="m63 12 9 18 13-8m-48 19 16-10-11-10m9 39 5-14-19-5m37 21-3-15 20-2" fill="#acc9a5"/>
    <path d="m53 31 19-1 7 12-8 5-15-1Z" fill="#ccd49e"/><path d="m63 12-10 19m19-1 19 15m-35 1 18 16" fill="none" stroke-width="1.4"/>
    <path d="m47 26 6-4m-8 9 6-4" fill="none" stroke="#ecedbf" stroke-width="2"/>
  </g></g>`;
  const art = { lada, mira, tim };
  window.SoupPortrait = (id) => art[id] ? `<svg class="soup-portrait soup-portrait-${id}" viewBox="0 0 128 128" aria-hidden="true" focusable="false">${art[id]}</svg>` : '';
})();
