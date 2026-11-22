// Small layered SVG puppets in the game's ink-and-enamel style.
window.SoupPortrait = function SoupPortrait(id) {
  const art = {
    lada: `<g class="sp-lada">
      <path class="sp-ink sp-limb" d="M39 94Q25 104 31 121l13 4m24-29q18 6 21 20l-8 8"/>
      <path class="sp-body sp-amber" d="M40 56Q52 44 69 52q13 7 10 26l-5 30q-13 9-29 0l-7-27q-3-17 2-25Z"/>
      <path class="sp-hatch" d="m46 83 20 20m-19-9 13 13m-8-28 16 17"/>
      <path class="sp-ink" d="M47 67q10-9 23 0m-21 5q9-8 18 0"/>
      <g class="sp-map">
        <path class="sp-paper" d="m77 107 15-7 13 5 14-7 2 25-15 6-13-5-14 6Z"/>
        <path class="sp-hatch" d="m79 110 9 12m0-17 11 18m4-14 10 11"/>
        <path class="sp-ink" d="m92 103 1 23m13-21 1 22m-24-9 6-3 7 2 7-5"/>
      </g>
      <path class="sp-scarf" d="M41 60q15-12 33 0l-5 10q-14-8-24 1Z"/>
      <path class="sp-scarf-tail" d="m46 65-12 8 13 1Z"/>
      <path class="sp-ink" d="M42 60q14-10 31 0m-27 4 5 2"/>
      <ellipse class="sp-face" cx="60" cy="48" rx="17" ry="15"/>
      <path class="sp-ink" d="M48 46q3-3 6 0m10 0q3-3 6 0"/>
      <path class="sp-blink" d="M48 46h6m10 0h6"/>
      <circle class="sp-cheek" cx="49" cy="52" r="2"/><circle class="sp-cheek" cx="70" cy="52" r="2"/>
      <path class="sp-ink" d="M57 54q3 3 6 0"/>
      <path class="sp-capline" d="M47 41q13-13 25 1"/>
      <path class="sp-ink" d="M44 99q-7 3-8 8m43-7 7 6"/>
    </g>`,
    mira: `<g class="sp-mira">
      <path class="sp-ink sp-limb" d="M42 95q-16 7-15 19l13 5m39-22q16 5 17 18l-12 5"/>
      <path class="sp-body sp-terracotta" d="M38 64q4-17 22-18 22 0 25 20l-3 39q-19 13-42 0Z"/>
      <path class="sp-hatch" d="m46 74 27 26m-28-14 18 19m-9-35 19 23"/>
      <path class="sp-apron" d="M46 73q14 5 29 0l5 32q-20 9-38 0Z"/>
      <path class="sp-ink" d="m49 75 4-11q9 5 15 0l5 11m-20 7 13 1m-12 6 13 1"/>
      <g class="sp-scales">
        <path class="sp-ink" d="M94 74v35m-10 1h21m-23-24h26"/>
        <path class="sp-scale-pan" d="M83 84q1 11 10 11t10-11Z"/>
        <path class="sp-scale-pan" d="M92 84q1 11 10 11t10-11Z"/>
        <circle class="sp-pea" cx="89" cy="84" r="3"/><circle class="sp-pea sp-pea-two" cx="100" cy="83" r="3"/>
        <path class="sp-ink" d="M90 111v5m-5 0h10"/>
      </g>
      <path class="sp-arm" d="M40 91q-14 4-15-8l7-7 9 9m39 3q10-9 15-20"/>
      <path class="sp-face" d="M43 45q2-19 19-19 17 0 19 19-1 18-19 19-18-1-19-19Z"/>
      <path class="sp-ink" d="M49 45q3-3 6 0m13 0q3-3 6 0"/>
      <path class="sp-blink" d="M49 45h6m13 0h6"/>
      <circle class="sp-cheek" cx="49" cy="51" r="2"/><circle class="sp-cheek" cx="74" cy="51" r="2"/>
      <path class="sp-ink" d="M59 54q4 3 8 0M45 35q17-8 33 0"/>
      <path class="sp-cap" d="M43 34q2-14 18-14 17 0 20 14l-8 4q-12-5-24 0Z"/>
      <path class="sp-ink" d="M42 35q17-5 41 0m-19-14v7"/>
    </g>`,
    tim: `<g class="sp-tim">
      <path class="sp-ink sp-limb" d="M48 91Q32 98 33 111l11 5m32-25q13 9 7 20l-12 5"/>
      <path class="sp-body sp-teal" d="M54 48q-20-5-24 12-4 18 14 18 14 0 11-12-2-8-10-5-7 3-3 8 3 3 6 0"/>
      <path class="sp-hatch" d="m39 61 13 8m-19 0 12 7m-5-20 13 7"/>
      <path class="sp-body sp-teal sp-tail" d="M66 63q20-7 22 8 2 15-13 14-12-1-8-11 3-6 9-3 5 3 1 6"/>
      <path class="sp-hatch" d="m73 66 10 7m-13 2 11 7"/>
      <g class="sp-flags">
        <path class="sp-ink" d="M50 46V18m31 35V23"/>
        <path class="sp-flag" d="M51 19q12-6 23 0l-4 12q-9 4-19-1Z"/>
        <path class="sp-flag sp-flag-two" d="M82 24q11-6 22 0l-5 12q-9 3-17-1Z"/>
        <path class="sp-ink" d="m55 21 11 8m-9-9-4 8m34-2 10 8m-8-10-5 8"/>
      </g>
      <g class="sp-head">
        <path class="sp-face" d="M44 54q0-17 16-19 17-1 19 16-1 16-18 17-16-1-17-14Z"/>
        <path class="sp-ink" d="M50 51q3-3 6 0m12 0q3-3 6 0"/>
        <path class="sp-blink" d="M50 51h6m12 0h6"/>
        <path class="sp-cheek" d="M48 57q4-3 7 0m17 0q4-3 7 0"/>
        <path class="sp-ink" d="M59 60q4 3 8 0"/>
        <path class="sp-cap" d="M43 43q3-16 18-16 16 0 20 15-18-6-38 1Z"/>
        <path class="sp-ink" d="M43 43q19-7 39-1m-20-14v7"/>
      </g>
    </g>`,
  };
  const drawing = art[id];
  return drawing
    ? `<svg class="soup-portrait soup-portrait-${id}" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${drawing}</svg>`
    : '';
};
