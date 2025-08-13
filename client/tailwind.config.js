/** @type {import('tailwindcss').Config} */
module.exports = {
  // --- ADD THIS LINE ---
  darkMode: 'class', 
  // --------------------

  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}