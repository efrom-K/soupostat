// A small ink-and-enamel palette keeps the controls readable at game-piece size.
const iconArt = {
  logo: '<path fill="#eedfc2" d="M11 13q-1-4 2-6m5 6q-2-3 1-6" fill-opacity="0"/><path d="m22 17 9-12" stroke-width="3.2"/><path fill="#c35536" d="M3 16q13-5 25 0l-2 9q-5 6-16 3-5-2-7-12Z"/><ellipse cx="15.5" cy="16" rx="12.7" ry="3.6" fill="#f4b846"/><path d="M4 18q-5-3-3 2l4 2m22-5q6-3 4 2l-4 2"/><path d="m12 23 2 2 4-2" stroke="#fff0cf" fill="none"/><path d="m10 15 3-1m6 2h2" stroke="#64854b"/>',
  bolt: '<path fill="#efbd40" d="m18 2-13 17 9 1-2 11 15-20-10 1z"/><path stroke="#fff4bb" d="m14 13-4 4"/>',
  carrot:
    '<path fill="#98aa58" d="M18 12Q15 3 19 3q2 0 3 6 4-9 7-7 2 2-4 9 8-3 7 1-3 4-11 4Z"/><path fill="#e88a43" d="M4 29q-2-3 6-15 7-11 12-3 5 7-8 14-6 4-10 4Z"/><path d="m12 15 4 2m-7 3 3 2m4-11 4 2" stroke="#905438"/>',
  sun: '<circle cx="16" cy="16" r="7" fill="#f4c04d"/><path d="M16 1v4m0 22v4M1 16h4m22 0h4M5 5l3 3m16 16 3 3M5 27l3-3M24 8l3-3"/><path d="M13 15v1m6-1v1" stroke-width="2"/>',
  moon: '<path d="M23 3A13 13 0 1 0 28 23Q11 24 13 9q1-4 4-7" fill="#a4a9cb"/><path d="m23 7 1 3 3 1-3 1-1 3-1-3-3-1 3-1z" fill="#ead28b"/>',
  eye: '<path d="M2 17Q15 1 30 16 16 31 2 17Z" fill="none"/><circle cx="16" cy="16.5" r="4.3" fill="currentColor" stroke="none"/><path d="m9 6-1-2m8 0V2m7 5 2-2"/>',
  divide:
    '<g fill="#b3c87e"><path d="M3 16q1-6 7-10 7-4 10 2 2 4-6 11-8 6-11-3Z"/><path d="M14 23q-2-4 5-9 7-5 10 1 2 5-4 11-8 7-11-3Z"/></g><path d="m7 9-2-2m6-2V3m16 11 2-2m-8 16 1 3M8 14h.5m4-3h.5m7 11h.5m4-3h.5" stroke-width="2"/>',
  hide: '<path d="M4 22q2-10 12-13 10-2 13 8l-7 8-15 1Z" fill="#abc2be"/><path d="M7 23q7-15 18-10M8 22q-2 9 5 8 9-3 10-10-10-1-15 2Z" fill="#d7d6aa"/><path d="M12 25h.4m5-2h.4" stroke-width="2.4"/>',
  bulb: '<path d="M10 19C-1 5 21-3 25 9c2 7-5 9-5 14l-9 1Z" fill="#f2cb5b"/><path d="m11 23 9-1v4l-8 2ZM14 29l4-1m-5-14 3 7 2-9" fill="#b4bd9b"/><path d="m4 4 2 2m21-2-2 2M1 13h3m24 2 3 1"/>',
  pot: '<path fill="#cb7955" d="M4 11q12-5 24 0l-2 13q-10 7-20 0Z"/><ellipse cx="16" cy="11" rx="12" ry="4" fill="#edbe61"/><path d="M4 14q-6-1-3 4l4 1m23-5q6-1 3 4l-4 1"/><path d="m13 19 3 2 3-2" stroke="#ffe5b7"/>',
  rim: '<ellipse cx="16" cy="18" rx="14" ry="7" fill="#c47e57"/><ellipse cx="16" cy="16" rx="11" ry="4" fill="#efc276"/><path d="M15 15V4l9 3-9 3" fill="#a0ae73"/>',
  jar: '<path d="M8 10 7 25q0 4 9 4t9-4l-1-15Z" fill="#c4c48b"/><path d="M11 22q-2-6 4-8m2 9q1-7 4-9" stroke="#779060" stroke-width="3"/><path d="M7 5q9-3 18 0v5q-9 3-18 0Z" fill="#7da49a"/>',
  cheese:
    '<path d="m3 16 16-12 11 8-1 13L3 29Z" fill="#efbb60"/><path d="m3 16 27-4"/><circle cx="10" cy="21" r="2" fill="#b7864b"/><circle cx="23" cy="18" r="2" fill="#b7864b"/>',
  fridge:
    '<path d="M7 4q8-3 17 0l1 23q-7 3-18 1Z" fill="#a7bcab"/><path d="m8 13 16-1m-13-5v3m0 7v5m-2 6v2m13-3v3"/>',
  map: '<path d="m2 7 9-4 10 4 9-4v22l-9 4-10-4-9 4Z" fill="none"/><path d="M11 3v22M21 7v22"/>',
  book: '<path d="M2 6q7-3 14 2 8-5 14-2v20q-7-3-14 1-8-4-14-1Z" fill="none"/><path d="M16 8v19M5 11l6 1m9 1 6-2"/>',
  calendar:
    '<rect x="4" y="6" width="24" height="23" rx="3" fill="none"/><path d="M5 13h22M10 3v7m12-7v7m-10 9h5"/>',
  sound: '<path d="M3 13h6l8-7v20l-8-7H3Z" fill="none"/><path d="M21 11q5 5 0 10m4-15q9 10 0 20"/>',
  mute: '<path d="M3 13h6l8-7v20l-8-7H3Z" fill="none"/><path d="m22 12 7 8m0-8-7 8"/>',
  pencil:
    '<path d="m4 23 17-18q3-3 6 0l1 2q1 2-1 4L10 28l-8 2z" fill="none"/><path d="m5 22 6 5M19 8l6 5"/>',
  flush:
    '<path d="M3 4h10v12H5Z" fill="#b9ccc4"/><path d="M3 4q5-3 11 0v2H3Z" fill="#f4efe4"/><path d="M4 15q13-4 25-2 0 10-10 12l2 4-11 1 1-7q-5-1-7-8Z" fill="#eee8d7"/><ellipse cx="18" cy="14" rx="11" ry="3.5" fill="#a7c6bb"/><path d="M12 14q11-4 11 0-1 2-7 1" stroke="#5c877c"/><path d="m20 5 2 3m5-7-2 5" stroke="#ac7a3b"/>',
  flag: '<path d="M7 29V4m1 1q5-5 11 0t10 0l-3 12q-5 3-10-1t-9 1Z" fill="#c86e4d"/><path d="M2 29h12"/>',
};
function icon(name) {
  return (
    '<svg aria-hidden="true" focusable="false" viewBox="0 0 32 32" stroke="currentColor" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
    (iconArt[name] || '') +
    '</svg>'
  );
}
