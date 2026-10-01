const sharedConfig = require('../../packages/config/tailwind-config');

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [sharedConfig],
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}', '../../packages/ui/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          700: '#245747',
          800: '#1b4437',
        },
      },
    },
  },
};
