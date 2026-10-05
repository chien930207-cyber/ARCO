"use strict";
/** ARCO's 24-unit outline icons: optical padding, rounded joins, one weight.
 *  Icons are decorative; their parent controls always carry text/aria-labels. */
window.ArcoIcons = (() => {
  const paths = {
    ai: 'M8 3v3m8-3v3M5 7h14v12H5Zm3 4h1m6 0h1M9 15h6M2 10v5m20-5v5M8 19v3m8-3v3',
    spark: 'M12 3v4m0 10v4M3 12h4m10 0h4M6 6l2 2m8 8 2 2M18 6l-2 2M8 16l-2 2M12 8l1.2 2.8L16 12l-2.8 1.2L12 16l-1.2-2.8L8 12l2.8-1.2Z',
    wave: 'M3 10v4m4-7v10m5-14v18m5-14v10m4-7v4',
    trophy: 'M7 3h10v6a5 5 0 0 1-10 0ZM7 6H3v3a4 4 0 0 0 4 4m10-7h4v3a4 4 0 0 1-4 4m-5 1v5m-4 2h8',

    arrow: 'M4.5 12h14.75M14 6.75 19.25 12 14 17.25',
    back: 'M19.5 12H4.75M10 6.75 4.75 12 10 17.25',
    play: 'M8 5.5 18.5 12 8 18.5Z',
    stop: 'M6.75 6.75h10.5v10.5H6.75Z',
    check: 'm5 12 4.5 4.5L19 7',
    close: 'm6.5 6.5 11 11m-11 0 11-11',
    book: 'M12 5.5C9.5 3.75 6 3.75 3 4.5v15c3-.75 6.5-.75 9 1 2.5-1.75 6-1.75 9-1v-15c-3-.75-6.5-.75-9 1Zm0 0v15M6 8.5h3m-3 4h3m6-4h3m-3 4h3',
    music: 'M9 17V5.25L20 3.5v11.75M9 8.75 20 7M9 17c0 1.4-1.6 2.5-3.5 2.5S2 18.9 2 17.5 3.6 15 5.5 15 9 15.6 9 17Zm11-1.75c0 1.4-1.6 2.5-3.5 2.5s-3.5-.6-3.5-2 1.6-2.5 3.5-2.5 3.5.6 3.5 2Z',
    headphones: 'M4 14v-2a8 8 0 0 1 16 0v2M4 12H3a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h3v-7Zm16 0h1a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-3v-7Z',
    lock: 'M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5Zm7 5v2',
    unlock: 'M7 10V7a5 5 0 0 1 9.2-2.7M5 10h14v11H5Zm7 5v2',
    external: 'M14 4h6v6m0-6L10 14M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5',
    search: 'M16.25 16.25 21 21M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0',
    users: 'M15 20v-2a6 6 0 0 0-12 0v2m10-13.5a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM17 3a4 4 0 0 1 0 8m1 3a5 5 0 0 1 3 4.5V20',
    clock: 'M12 6.5V12l3.5 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
    download: 'M12 3v12m-4-4 4 4 4-4M4 16v4h16v-4',
    upload: 'M12 15V3m-4 4 4-4 4 4M4 16v4h16v-4',
    flag: 'M5 21V3h14l-3 4 3 4H5',
    home: 'M3 10.5 12 3l9 7.5M5 9v11h5v-6h4v6h5V9',
    review: 'M5 3.5h14v17l-7-3-7 3Zm3.5 5h7m-7 3.5h5',
    settings: 'M3 6h4m4 0h10M3 12h10m4 0h4M3 18h6m4 0h8M11 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm6 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm-4 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z',
    shuffle: 'M3 6h3c4 0 8 12 12 12h3m-4-4 4 4-4 4M3 18h3c1.5 0 3-1.7 4.5-4M13.5 10C15 7.7 16.5 6 18 6h3m-4-4 4 4-4 4',
    refresh: 'M19.5 8A8 8 0 1 0 20 14M15 8h5V3',
    placement: 'M4 20V14h4v6m0 0V9h4v11m0 0V4h4v16m0 0h4M3 20h18',
    metronome: 'M5 21 9 3h6l4 18ZM8 15h8M11 18l7-12',
    piano: 'M3 4h18v16H3ZM7.5 12v8m4.5-8v8m4.5-8v8M6 4v8h3V4m6 0v8h3V4',
    layers: 'm12 3 9 5-9 5-9-5Zm-9 9 9 5 9-5m-18 5 9 5 9-5'
  };
  function render(name, cls='') {
    return `<svg class="arco-icon ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${paths[name] || paths.music}"/></svg>`;
  }
  function mark(cls='') {
    return `<svg xmlns="http://www.w3.org/2000/svg" class="brand-mark calligraphic ${cls}" viewBox="0 0 174 168" aria-hidden="true" focusable="false"><image href="./icons/arco-gold-512-r3.png" x="3" y="0" width="168" height="168" preserveAspectRatio="xMidYMid meet"/></svg>`;
  }
  return {render,mark,paths};
})();
