// ─── Brand Colours ────────────────────────────────────────────────────────────
export const colors = {
  // Primary greens
  primary: {
    50:  '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16',
  },
  // Warm earthy accent
  earth: {
    50:  '#fdf8f0',
    100: '#faeedd',
    200: '#f5d9b4',
    300: '#efbf7e',
    400: '#e89d4a',
    500: '#d97706',
    600: '#b45309',
    700: '#92400e',
    800: '#78350f',
    900: '#451a03',
  },
  // Neutrals
  neutral: {
    50:  '#fafaf9',
    100: '#f5f5f4',
    200: '#e7e5e4',
    300: '#d6d3d1',
    400: '#a8a29e',
    500: '#78716c',
    600: '#57534e',
    700: '#44403c',
    800: '#292524',
    900: '#1c1917',
  },
  // Semantic
  success: '#16a34a',
  warning: '#d97706',
  error:   '#dc2626',
  info:    '#2563eb',
  white:   '#ffffff',
  black:   '#000000',
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────
export const fonts = {
  sans:  'var(--font-geist-sans), system-ui, sans-serif',
  mono:  'var(--font-geist-mono), monospace',
} as const;

export const fontSizes = {
  xs:   '0.75rem',
  sm:   '0.875rem',
  base: '1rem',
  lg:   '1.125rem',
  xl:   '1.25rem',
  '2xl':'1.5rem',
  '3xl':'1.875rem',
  '4xl':'2.25rem',
  '5xl':'3rem',
} as const;

// ─── Spacing ──────────────────────────────────────────────────────────────────
export const spacing = {
  px:   '1px',
  0:    '0',
  0.5:  '0.125rem',
  1:    '0.25rem',
  2:    '0.5rem',
  3:    '0.75rem',
  4:    '1rem',
  5:    '1.25rem',
  6:    '1.5rem',
  8:    '2rem',
  10:   '2.5rem',
  12:   '3rem',
  16:   '4rem',
  20:   '5rem',
  24:   '6rem',
} as const;

// ─── Border Radius ────────────────────────────────────────────────────────────
export const borderRadius = {
  none:  '0',
  sm:    '0.125rem',
  base:  '0.25rem',
  md:    '0.375rem',
  lg:    '0.5rem',
  xl:    '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full:  '9999px',
} as const;

// ─── Shadows ──────────────────────────────────────────────────────────────────
export const shadows = {
  sm:  '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base:'0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md:  '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg:  '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl:  '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
} as const;

// ─── Breakpoints ──────────────────────────────────────────────────────────────
export const breakpoints = {
  sm:  '640px',
  md:  '768px',
  lg:  '1024px',
  xl:  '1280px',
  '2xl':'1536px',
} as const;
