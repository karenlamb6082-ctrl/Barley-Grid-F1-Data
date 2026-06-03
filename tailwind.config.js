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
          bg: '#FAF8F5',
          card: '#FFFFFF',
          text: '#101010',
          'text-muted': '#7A7772',
          red: '#B33A3A',
          cyan: '#758A99',
          lime: '#C5A880',
          graphite: '#1E1D1B',
          gold: '#C5A880',
          silver: '#8E8E93',
          darkcyan: '#36696A',
          danger: '#B33A3A',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"Inter"', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'apple-soft': '0 10px 30px rgba(16,16,16,0.06), 0 1px 0 rgba(255,255,255,0.75) inset',
        'apple-hover': '0 18px 42px rgba(16,16,16,0.10), 0 1px 0 rgba(255,255,255,0.75) inset',
      },
    },
  },
  plugins: [],
}
