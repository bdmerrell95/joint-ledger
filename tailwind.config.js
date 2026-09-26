/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}" // Add this line just in case App.jsx is not in the src folder
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
