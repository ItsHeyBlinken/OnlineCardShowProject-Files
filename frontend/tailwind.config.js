/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {},
  },
  plugins: [],
  // Add purge configuration to remove unused styles
  purge: ['./src/**/*.{js,jsx,ts,tsx}'],
  // Enable JIT mode for better performance
  mode: 'jit',
  // ... rest of your config
};
