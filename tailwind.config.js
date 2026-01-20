/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'soft-pink': '#FFF5F8',
        'pink-accent': '#FFB3C6',
        'butter-yellow': '#FFF4B3',
        'baby-blue': '#B3E5FF',
        'text-dark': '#333333',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 6px rgba(0, 0, 0, 0.1)',
      },
      dropShadow: {
        'soft': '0 4px 6px rgba(255, 179, 198, 0.2)',
      },
      backgroundImage: {
        'hero-pattern': "url('/images/hero-bg.jpg')",
      },
    },
  },
  plugins: [],
}