/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        hud: {
          bg: '#05070c',
          panel: '#0b0f17',
          border: '#1c2433',
          accent: '#22d3ee',
          accent2: '#34d399',
          warn: '#f59e0b',
          danger: '#ef4444',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.4 },
        },
        dash: {
          to: { strokeDashoffset: 0 },
        },
        drawRoute: {
          to: { strokeDashoffset: 0 },
        },
        floatIn: {
          from: { opacity: 0, transform: 'translateY(6px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        pulseGlow: 'pulseGlow 1.6s ease-in-out infinite',
        dash: 'dash 2s linear forwards',
        drawRoute: 'drawRoute 1.2s ease-out forwards',
        floatIn: 'floatIn 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
