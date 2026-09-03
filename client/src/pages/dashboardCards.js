import { createElement } from 'react';

// Plain-JS module (no .jsx extension) — icons are built with
// createElement rather than JSX syntax, since Vite's default esbuild
// loader for a bare .js file does not parse JSX.
const ICON_PROPS = { className: 'h-6 w-6', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' };
const PATH_PROPS = { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 1.5 };

function icon(...paths) {
  return createElement(
    'svg',
    ICON_PROPS,
    ...paths.map((d, i) => createElement('path', { key: i, ...PATH_PROPS, d }))
  );
}

export const CARD_ICONS = {
  totalBuildings: icon('M3 21h18M6 21V7a1 1 0 011-1h4a1 1 0 011 1v14M15 21V4a1 1 0 011-1h3a1 1 0 011 1v17M9 9h.01M9 12h.01M9 15h.01'),
  totalFans: icon('M17.657 6.343a8 8 0 10-11.314 11.314M17.657 6.343L12 12m5.657-5.657L12 3m0 9l5.657 5.657M12 12L6.343 17.657'),
  totalStudents: icon('M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.42A12.06 12.06 0 0121 12c0 2.4-.9 4.6-2.4 6.3M12 14l-6.16-3.42A12.06 12.06 0 003 12c0 2.4.9 4.6 2.4 6.3M12 14v7'),
  totalCoordinators: icon('M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m5-3.13a4 4 0 100-8 4 4 0 000 8zm6 3.13a4 4 0 00-3-6.13'),
  totalClasses: icon('M12 3l9 5-9 5-9-5 9-5z', 'M3 13l9 5 9-5', 'M3 18l9 5 9-5'),
  totalSubjects: icon(
    'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25'
  ),
  totalResults: icon(
    'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14'
  ),
};

export const CARD_DEFS = [
  { key: 'totalBuildings', label: 'Total Masjids' },
  { key: 'totalFans', label: 'Total Fans' },
  { key: 'totalStudents', label: 'Total Students' },
  { key: 'totalCoordinators', label: 'Total GUDOOMIYE KUXIGEEN' },
  { key: 'totalClasses', label: 'Total Educational Stages' },
  { key: 'totalSubjects', label: 'Total Religious Books' },
  { key: 'totalResults', label: 'Total Results' },
];
