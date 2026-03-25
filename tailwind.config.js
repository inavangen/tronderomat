// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        jersey: ['Jersey 15', 'sans-serif'],
        test: ['Comic Sans MS', 'cursive'],
      },
    },
  },
  plugins: [],
}