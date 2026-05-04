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
          bg: '#F7F4EE',
          card: '#FFFFFF',
          text: '#101010',
          'text-muted': '#77746F',
          red: '#FF2D2D',
          cyan: '#20D7FF',
          lime: '#D7FF38',
          graphite: '#171717',
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
