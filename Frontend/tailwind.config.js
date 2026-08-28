/** @type {import('tailwindcss').Config} */

/**
 * Design tokens — "game studio" direction.
 *
 * primary = violet (the brand), accent = cyan (the highlight the two
 * gradient into). Everything else is a tinted neutral so the violet reads
 * as intentional rather than as a stray accent on grey chrome.
 */
export default {
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
        },
        surface: '#F7F6FC',
        panel: '#FFFFFF',
        ink: '#1B1830',
        muted: '#6B6784',
        line: '#EAE7F5',
      },
      boxShadow: {
        card: '0 1px 2px rgba(27,24,48,0.04), 0 8px 24px -14px rgba(124,58,237,0.16)',
        'card-hover': '0 2px 4px rgba(27,24,48,0.05), 0 18px 40px -18px rgba(124,58,237,0.28)',
        glow: '0 10px 28px -12px rgba(124,58,237,0.55)',
        pop: '0 20px 50px -24px rgba(27,24,48,0.35)',
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
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        'fade-up': 'fade-up 0.35s ease-out both',
      },
    },
  },
  plugins: [],
};
