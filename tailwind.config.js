/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
    extend: {
      colors: {
        'theme-dark': '#1a202c',
        'theme-retro-primary': '#f0e6d2',
        'theme-retro-secondary': '#c8b079',
      },
    },
  },
  plugins: [],
}

