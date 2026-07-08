/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{jsx,js,ts,tsx}', './index.html'],
  theme: {
    extend: {
      colors: {
        dark: { 900: '#0B132B', 800: '#1C2541', 700: '#3A506B', 600: '#5A7A96' },
        gold: { 400: '#f59e0b', 500: '#d97706' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      keyframes: {
        'card-entry': {
          '0%': { opacity: '0', transform: 'translateY(16px) scale(0.92)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'deck-slide': {
          '0%': { opacity: '0', transform: 'translateX(40px) rotate(3deg)' },
          '100%': { opacity: '1', transform: 'translateX(0) rotate(0deg)' },
        },
      },
      animation: {
        'card-entry': 'card-entry 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'deck-slide': 'deck-slide 0.5s ease-out forwards',
      },
    },
  },
  plugins: [],
  corePlugins: { preflight: false },
}
