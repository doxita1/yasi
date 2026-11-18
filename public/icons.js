const paths = {
  home: '<rect x="3" y="3" width="7" height="7" rx="1.4"/><rect x="14" y="3" width="7" height="7" rx="1.4"/><rect x="3" y="14" width="7" height="7" rx="1.4"/><rect x="14" y="14" width="7" height="7" rx="1.4"/>',
  book: '<path d="M3 4c3 0 6 0 9 3 3-3 6-3 9-3v15c-3 0-6 0-9 3-3-3-6-3-9-3zM12 7v15"/>',
  layers: '<path d="m3 8 9-5 9 5-9 5zM3 12l9 5 9-5M3 16l9 5 9-5"/>',
  words:
    '<path d="M4 19 9.5 5 15 19M6 14h7M15 13c3-3 6-1 6 2v5M21 16c-6-2-7 5-2 4l2-2"/>',
  grammar: '<path d="M20 6H4M4 11h11M4 16h7m4 2 2 2 5-6"/>',
  headphones:
    '<path d="M3 15v-3a9 9 0 0 1 18 0v3"/><rect x="3" y="12" width="4" height="8" rx="2"/><rect x="17" y="12" width="4" height="8" rx="2"/>',
  chat: '<path d="M21 11a8 8 0 0 1-8 8H8l-5 3 1-6a8 8 0 0 1-1-5 9 9 0 0 1 18 0Z"/><path d="M7 11h.01m5 0h.01m5 0h.01" stroke-width="2.8"/>',
  review: '<path d="M4 10a8 8 0 1 1 1 8M3 4v6h6m3-3v6l4 2"/>',
  chart: '<path d="M3 3v18h18M7 16l4-6 4 3 6-8"/>',
  settings:
    '<path d="M4 7h5m4 0h7M4 17h9m4 0h3"/><circle cx="11" cy="7" r="2.5"/><circle cx="15" cy="17" r="2.5"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  right: '<path d="m9 5 7 7-7 7"/>',
  left: '<path d="m15 5-7 7 7 7"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  calendar:
    '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/>',
  flag: '<path d="M5 21V4c5-3 9 3 15 0v11c-5 3-9-3-15 0"/>',
  spark:
    '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/>',
  leaf: '<path d="M5 18C1 9 12 3 21 3c0 9-3 18-12 16m-5 2 12-12"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  close: '<path d="m5 5 14 14m0-14L5 19"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
  stack:
    '<rect x="6" y="7" width="15" height="14" rx="2"/><path d="M17 3H4a1 1 0 0 0-1 1v12"/>',
  target:
    '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  globe:
    '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  pen: '<path d="m5 15 11-11 4 4L9 19l-6 2zM13 7l4 4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  mic: '<rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 11a7 7 0 0 0 14 0m-7 7v4m-4 0h8"/>',
  play: '<path d="m8 4 12 8-12 8z"/>',
};
export const icon = (name, size = 20) =>
  '<svg aria-hidden="true" width="' +
  size +
  '" height="' +
  size +
  '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">' +
  (paths[name] || paths.book) +
  "</svg>";
export const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
