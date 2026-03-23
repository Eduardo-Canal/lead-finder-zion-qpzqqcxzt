/**
 * Design Tokens - Lead Finder Zion
 * Centralizes all visual variables for the application following Tailwind CSS best practices.
 * Use these constants to maintain visual consistency across components and custom styles.
 */

export const COLORS = {
  // Brand Colors
  primary: {
    50: '#fef7e6',
    100: '#fdedcc',
    200: '#fbda99',
    300: '#f8c766',
    400: '#f6b433',
    500: '#f39200', // Base (Orange CTA)
    600: '#c27500',
    700: '#925800',
    800: '#613a00',
    900: '#311d00',
    950: '#180e00',
  },
  secondary: {
    50: '#e6f0fa',
    100: '#cce1f5',
    200: '#99c3ea',
    300: '#66a5e0',
    400: '#3387d5',
    500: '#0066cc', // Base (Main Blue)
    600: '#0052a3',
    700: '#003d7a',
    800: '#002952',
    900: '#001429',
    950: '#000a14',
  },

  // Functional Colors
  success: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981', // Base
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444', // Base
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Base
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  // Neutral / Grays (Slate scale for modern feel)
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
} as const

export const TYPOGRAPHY = {
  fontFamily: {
    sans: "'Inter var', 'SF Pro Display', system-ui, sans-serif",
    display: "'SF Pro Display', 'Inter var', system-ui, sans-serif",
  },
  fontSize: {
    xs: '0.75rem', // 12px - Captions, small labels
    sm: '0.875rem', // 14px - Secondary text, small buttons
    base: '1rem', // 16px - Body text, standard inputs/buttons
    lg: '1.125rem', // 18px - Large body, subtitles
    xl: '1.25rem', // 20px - Section headers (h4)
    '2xl': '1.5rem', // 24px - Card titles, modal headers (h3)
    '3xl': '1.875rem', // 30px - Page headers (h2)
    '4xl': '2.25rem', // 36px - Hero titles (h1)
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    none: '1',
    tight: '1.25', // Headings
    snug: '1.375',
    normal: '1.5', // Body text
    relaxed: '1.625',
    loose: '2',
  },
} as const

export const SPACING = {
  0: '0px',
  px: '1px',
  0.5: '0.125rem', // 2px
  1: '0.25rem', // 4px - Micro adjustments
  1.5: '0.375rem', // 6px
  2: '0.5rem', // 8px - Tight gaps
  2.5: '0.625rem', // 10px
  3: '0.75rem', // 12px
  4: '1rem', // 16px - Base padding/gap
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px - Standard component padding
  8: '2rem', // 32px - Section spacing
  10: '2.5rem', // 40px
  12: '3rem', // 48px - Large layout spacing
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
  32: '8rem', // 128px
} as const

export const BREAKPOINTS = {
  sm: '640px', // Mobile landscape & large phones
  md: '768px', // Tablets (iPad portrait)
  lg: '1024px', // Desktop small (iPad landscape)
  xl: '1280px', // Desktop standard (MacBook, average monitors)
  '2xl': '1400px', // Desktop large / Ultrawide
} as const

export const EFFECTS = {
  shadows: {
    none: '0 0 #0000',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)', // Cards, buttons
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', // Dropdowns, popovers
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', // Modals
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    subtle: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)', // Light elevation for inner cards
    elevation: '0 4px 20px rgba(0, 0, 0, 0.05)', // Floating elements
  },
  borderRadius: {
    none: '0px',
    sm: '0.25rem', // 4px - Checkboxes, small badges
    md: '0.375rem', // 6px - Inputs, buttons
    lg: '0.5rem', // 8px - Cards, dialogs
    xl: '0.75rem', // 12px - Large cards
    '2xl': '1rem', // 16px - Prominent containers
    full: '9999px', // Pill buttons, avatars
  },
  borderWidth: {
    DEFAULT: '1px',
    0: '0px',
    2: '2px',
    4: '4px',
    8: '8px',
  },
} as const

export const designTokens = {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BREAKPOINTS,
  EFFECTS,
  colors: COLORS,
  typography: TYPOGRAPHY,
  spacing: SPACING,
  breakpoints: BREAKPOINTS,
  effects: EFFECTS,
} as const
