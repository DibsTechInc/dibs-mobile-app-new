/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  // 'class', not the default 'media'. The app has no dark mode (v1 is light-only, and the
  // background is always white), and on WEB the media strategy makes NativeWind throw
  // "Cannot manually set color scheme" the moment anything reads the scheme — which blocked
  // the web preview, the only way to look at a screen without a device.
  darkMode: 'class',
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
