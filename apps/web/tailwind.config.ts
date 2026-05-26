import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary — warm electric indigo. Bold, modern, civic.
        primary: {
          DEFAULT: '#4F3DE0',
          50:  '#F4F2FE',
          100: '#ECE9FC',   // soft surface (chips, badges, tints)
          200: '#D8D2F8',
          300: '#B9ADF2',
          400: '#8A7BF0',
          500: '#4F3DE0',   // primary
          600: '#3A2BB8',   // primary-deep (buttons, hovers)
          700: '#2E2298',
          800: '#221A75',
          900: '#181252',
          dark: '#3A2BB8',
          light: '#8A7BF0',
        },
        // Secondary — turmeric gold. Warmth + Malaysian flag association.
        accent: {
          DEFAULT: '#E8A020',
          100: '#FBEFD3',
          500: '#E8A020',
          600: '#B47208',
          dark: '#B47208',
        },
        // Chili — legacy food community accent / hot badge
        chili: {
          DEFAULT: '#C0392B',
          soft:    '#FBE9E5',
          deep:    '#9C2A1F',
        },
        // Surface
        surface: {
          DEFAULT: '#FFFFFF',
          warm:    '#FAF8F3',  // surface-2
          bg:      '#F5F4F0',  // page background
        },
        // Dark mode (warm dark, not pure black)
        ink: {
          DEFAULT: '#1A1A1A',
          muted:   '#6B7280',
          soft:    '#9CA3AF',
          bg:      '#18171C',  // warm dark background
          surface: '#221F28',
          line:    '#2F2C38',
        },
        // Borders
        line: {
          DEFAULT: '#ECE8DF',
          strong:  '#DDD7C9',
        },
        // Muted (alias kept for backward compat)
        muted: '#6B7280',
      },
      fontFamily: {
        display: ['var(--font-sora)', 'system-ui', 'sans-serif'],
        body:    ['var(--font-plus-jakarta)', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        // Tighter, bigger display sizes for energetic Manglish-friendly UI
        'display-xl': ['2.25rem',  { lineHeight: '1.1',   letterSpacing: '-0.025em', fontWeight: '800' }],
        'display-lg': ['1.75rem',  { lineHeight: '1.15',  letterSpacing: '-0.025em', fontWeight: '800' }],
        'display-md': ['1.375rem', { lineHeight: '1.2',   letterSpacing: '-0.02em',  fontWeight: '700' }],
        'display-sm': ['1.0625rem',{ lineHeight: '1.25',  letterSpacing: '-0.015em', fontWeight: '700' }],
        'body-lg':    ['1rem',     { lineHeight: '1.55' }],
        'body':       ['0.875rem', { lineHeight: '1.5'  }],
        'meta':       ['0.75rem',  { lineHeight: '1.4'  }],
      },
      borderRadius: {
        'card': '0.875rem',   // 14px — slightly softer
        'pill': '9999px',
      },
      boxShadow: {
        'warm-sm': '0 1px 2px rgba(60,40,20,0.04), 0 1px 1px rgba(60,40,20,0.03)',
        'warm':    '0 2px 6px rgba(60,40,20,0.06), 0 8px 24px -10px rgba(60,40,20,0.08)',
        'warm-lg': '0 12px 32px -8px rgba(60,40,20,0.16)',
      },
    },
  },
  plugins: [],
};

export default config;
