/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        accent: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        surface: '#f2f1ee',
        ink: {
          DEFAULT: '#1c1a2e',
          muted:   '#6b6480',
          faint:   '#c0bad6',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      letterSpacing: {
        tight: '-0.02em',
        snug:  '-0.01em',
      },
      boxShadow: {
        card:       '0 2px 8px rgba(28,26,46,0.06), 0 8px 28px rgba(28,26,46,0.08)',
        'card-lg':  '0 8px 20px rgba(28,26,46,0.07), 0 24px 56px rgba(28,26,46,0.12)',
        float:      '0 1px 3px rgba(28,26,46,0.05), 0 4px 12px rgba(28,26,46,0.04)',
        brand:      '0 4px 20px rgba(79,70,229,0.28)',
      },
      borderRadius: {
        '2.5xl': '20px',
        '3xl':   '24px',
      },
    },
  },
  plugins: [],
};
