/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{ts,tsx,html}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0D0D0D',
          light: '#1A1A1A',
          lighter: '#262626',
          border: '#333333'
        },
        muted: {
          DEFAULT: '#A1A1A1',
          dim: '#6B6B6B'
        }
      },
      borderRadius: {
        input: '24px'
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'Noto Sans SC',
          'sans-serif'
        ]
      }
    }
  },
  plugins: []
}
