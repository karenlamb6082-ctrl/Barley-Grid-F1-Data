/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        f1: {
          bg: '#fbf9f6',
          card: '#ffffff',
          text: '#1b1c1a',
          'text-muted': '#494740',
          red: '#aa3434',
          cyan: '#758A99',
          lime: '#C5A880',
          graphite: '#1e1d1b',
          gold: '#C5A880',
          bronze: '#9b815c',
          silver: '#8E8E93',
          darkcyan: '#36696A',
          danger: '#ba1a1a',
          outline: 'rgba(30, 29, 27, 0.05)',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        'apple-soft': '0 4px 20px rgba(16,16,16,0.02), 0 1px 0 rgba(255,255,255,0.8) inset',
        'apple-hover': '0 12px 36px rgba(16,16,16,0.045), 0 1px 0 rgba(255,255,255,0.8) inset',
      },
    },
  },
  plugins: [],
}
