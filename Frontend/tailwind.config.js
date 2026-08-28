/** @type {import('tailwindcss').Config} */

/**
 * Design tokens — "game studio" direction.
 *
 * primary = violet (the brand), accent = cyan (the highlight the two
 * gradient into). Everything else is a tinted neutral so the violet reads
 * as intentional rather than as a stray accent on grey chrome.
 */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        accent: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#083344',
        },
        surface: 'var(--color-surface)',
        panel: 'var(--color-panel)',
        ink: 'var(--color-ink)',
        muted: 'var(--color-muted)',
        line: 'var(--color-line)',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 8px 24px -14px rgba(124,58,237,0.18)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.1), 0 20px 48px -16px rgba(124,58,237,0.35)',
        glow: '0 0 24px -4px rgba(124,58,237,0.5)',
        'glow-cyan': '0 0 24px -4px rgba(6,182,212,0.45)',
        'glow-emerald': '0 0 24px -4px rgba(16,185,129,0.45)',
        'glow-amber': '0 0 24px -4px rgba(245,158,11,0.45)',
        pop: '0 25px 60px -20px rgba(0,0,0,0.5)',
      },
      fontFamily: {
        heading: ['Outfit', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        '4xl': '1.75rem',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 45%, #22d3ee 100%)',
        'brand-soft': 'linear-gradient(135deg, #f5f3ff 0%, #ecfeff 100%)',
        'aurora-glow': 'radial-gradient(circle at 50% 50%, rgba(124,58,237,0.18) 0%, rgba(6,182,212,0.08) 50%, transparent 100%)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        'fade-up': 'fade-up 0.35s ease-out both',
        shimmer: 'shimmer 2.5s infinite',
        'pulse-slow': 'pulse-slow 3s ease-in-out infinite',
        'spin-slow': 'spin-slow 20s linear infinite',
      },
    },
  },
  plugins: [],
};
