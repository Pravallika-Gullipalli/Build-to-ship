/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        border: "rgba(255, 255, 255, 0.1)",
        background: "rgba(15, 23, 42, 0.95)",
        foreground: "rgba(248, 250, 252, 1)",
        brand: {
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
        civic: {
          blue: {
            DEFAULT: '#2563eb',
            hover: '#1d4ed8',
            light: '#60a5fa',
            glow: 'rgba(37, 99, 235, 0.15)',
          },
          emerald: {
            DEFAULT: '#059669',
            hover: '#047857',
            light: '#34d399',
          },
          amber: {
            DEFAULT: '#d97706',
            hover: '#b45309',
            light: '#fbbf24',
          },
          rose: {
            DEFAULT: '#e11d48',
            hover: '#be123c',
            light: '#fb7185',
          }
        }
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-light': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'glow-blue': '0 0 20px rgba(37, 99, 235, 0.25)',
        'glow-emerald': '0 0 20px rgba(5, 150, 105, 0.25)',
        'glow-rose': '0 0 20px rgba(225, 29, 72, 0.25)',
      },
      backdropFilter: {
        'none': 'none',
        'blur': 'blur(20px)',
      }
    },
  },
  plugins: [],
}
