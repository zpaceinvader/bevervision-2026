/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        silver: {
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#BFBFBF',
          400: '#8A8A8A',
          500: '#5C5C5C',
          600: '#3D3D3D',
          700: '#2A2A2A',
          800: '#1A1A1A',
          900: '#0F0F0F',
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
