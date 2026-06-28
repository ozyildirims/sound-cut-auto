/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0b0d10',
          surface: '#14171c',
          elev: '#1c2027'
        },
        edge: '#2a2f38',
        accent: '#7c5cff'
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Inter',
          'system-ui',
          'sans-serif'
        ]
      }
    }
  },
  plugins: []
}
