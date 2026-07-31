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
          bg: '#f2f0e9',
          card: '#f8f7f2',
          text: '#151615',
          'text-muted': '#77766f',
          red: '#f03a25',
          cyan: '#397c8c',
          lime: '#c9f43c',
          graphite: '#151615',
          gold: '#d7a72f',
          bronze: '#9a6b43',
          silver: '#9197a3',
          darkcyan: '#2e6f7d',
          danger: '#d92d20',
          outline: '#cac7bd',
        },
      },
      fontFamily: {
        sans: ['"Segoe UI"', '"Microsoft YaHei UI"', '"PingFang SC"', 'sans-serif'],
        serif: ['"Segoe UI"', '"Microsoft YaHei UI"', 'sans-serif'],
      },
      boxShadow: {
        'apple-soft': '0 1px 2px rgba(17,19,24,0.025)',
        'apple-hover': '0 12px 32px rgba(17,19,24,0.055)',
      },
    },
  },
  plugins: [],
}
