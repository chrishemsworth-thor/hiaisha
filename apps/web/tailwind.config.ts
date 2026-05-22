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
        primary: { DEFAULT: '#C0392B', dark: '#A93226', light: '#E74C3C' },
        accent: { DEFAULT: '#E8A020', dark: '#D4911B' },
        surface: { DEFAULT: '#FFFFFF', bg: '#F5F4F0', warm: '#FAFAF7' },
        muted: '#6B7280',
      },
      fontFamily: {
        display: ['var(--font-sora)', 'sans-serif'],
        body: ['var(--font-plus-jakarta)', 'sans-serif'],
      },
      borderRadius: {
        card: '0.75rem',
      },
    },
  },
  plugins: [],
};
export default config;
