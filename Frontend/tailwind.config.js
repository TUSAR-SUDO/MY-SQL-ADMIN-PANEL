/** @type {import('tailwindcss').Config} */

/**
 * Anthropic-Inspired Design System:
 * Signature warm terracotta (#C15C3D / #D97757), warm sandstone oyster neutrals,
 * and deep espresso stone dark mode surfaces.
 */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FBF6F1',
          100: '#F5EBE1',
          200: '#EBD5C2',
          300: '#DCB697',
          400: '#CE926B',
          500: '#C15C3D', // Anthropic signature terracotta
          600: '#B04D30',
          700: '#933C23',
          800: '#78321F',
          900: '#622B1D',
          950: '#36130B',
        },
        accent: {
          50: '#FEF9EE',
          100: '#FDF0D5',
          200: '#FBE0AA',
          300: '#F7CA74',
          400: '#F2B042',
          500: '#D99B43', // Warm golden amber
          600: '#C2822E',
          700: '#9E6424',
          800: '#7F4F21',
          900: '#69411E',
          950: '#3D220C',
        },
        surface: 'var(--color-surface)',
        panel: 'var(--color-panel)',
        ink: 'var(--color-ink)',
        muted: 'var(--color-muted)',
        line: 'var(--color-line)',
      },
      boxShadow: {
        card: '0 1px 3px rgba(28,25,23,0.06), 0 8px 24px -14px rgba(193,92,61,0.12)',
        'card-hover': '0 4px 14px rgba(28,25,23,0.08), 0 16px 36px -12px rgba(193,92,61,0.22)',
        glow: '0 0 20px -3px rgba(193,92,61,0.4)',
        'glow-accent': '0 0 20px -3px rgba(217,155,67,0.4)',
        'glow-emerald': '0 0 20px -3px rgba(74,124,89,0.4)',
        pop: '0 25px 60px -20px rgba(20,19,18,0.5)',
      },
      fontFamily: {
        heading: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Newsreader', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        '4xl': '1.75rem',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #C15C3D 0%, #D97757 50%, #E89E6C 100%)',
        'brand-soft': 'linear-gradient(135deg, #FBF6F1 0%, #F5EBE1 100%)',
        'clay-glow': 'radial-gradient(circle at 50% 50%, rgba(193,92,61,0.14) 0%, rgba(217,155,67,0.06) 50%, transparent 100%)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.03)' },
        },
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        'fade-up': 'fade-up 0.3s ease-out both',
        shimmer: 'shimmer 2.5s infinite',
        'pulse-slow': 'pulse-slow 3.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
