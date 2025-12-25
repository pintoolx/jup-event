/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'outfit': ['Outfit', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      colors: {
        'jup': {
          'green': '#7FE787',
          'green-dark': '#5ED065',
          'blue': '#BAE6FD',
          'blue-dark': '#7DD3FC',
          'dark': '#0A0F1A',
          'card': '#111827',
        }
      },
    },
  },
  plugins: [],
}


