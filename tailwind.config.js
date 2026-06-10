/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Per-studio brand color is injected at runtime via theme store —
        // these are Dibs-app defaults only. Widget-style dynamic theming
        // lives in src/theme.
        brand: {
          DEFAULT: '#1A92E4',
          dark: '#1273B8',
        },
      },
    },
  },
  plugins: [],
};
