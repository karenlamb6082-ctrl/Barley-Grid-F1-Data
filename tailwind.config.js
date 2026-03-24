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
          bg: '#F5F4F0',       // 带有非常微妙的暖纸温度的底色
          card: '#FFFFFF',     // 绝对纯白卡片
          text: '#1C1C1E',     // Apple 深幽炭黑
          'text-muted': '#8E8E93', // Apple 系统灰
          red: '#C83232',      // 降次的高级朱砂红
          cyan: '#36696A',     // 内敛黛青山色
        }
      },
      fontFamily: {
         sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"Inter"', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'apple-soft': '0 8px 30px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02)',
        'apple-hover': '0 20px 40px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.02)',
      }
    },
  },
  plugins: [],
}
