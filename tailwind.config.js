/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        protein: {
          light: '#fed7aa',
          DEFAULT: '#f97316',
          dark: '#ea580c',
        },
        fat: {
          light: '#fef08a',
          DEFAULT: '#eab308',
          dark: '#ca8a04',
        },
        carb: {
          light: '#bae6fd',
          DEFAULT: '#0284c7',
          dark: '#0369a1',
        },
      }
    },
  },
  plugins: [],
}
