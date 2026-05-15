/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        purple: {
          950: '#1a0038',
          900: '#2d0060',
          800: '#3B0764',
          700: '#5b0f9e',
        },
        gold: {
          400: '#fbbf24',
          500: '#F59E0B',
          600: '#d97706',
        },
      },
      fontFamily: {
        display: ['Protest Riot', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
