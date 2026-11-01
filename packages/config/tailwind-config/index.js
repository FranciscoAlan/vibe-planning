/** Shared Tailwind preset for all Vibe Planners web apps. */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#7c3aed',
          foreground: '#ffffff',
        },
        vibe: {
          plum: '#2B1B3D',
          cream: '#FFF8F1',
          raspberry: '#C42A50',
          amber: '#F6B93B',
          sand: '#E6D9CC',
        },
      },
      fontFamily: {
        jakarta: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      borderRadius: {
        field: '12px',
        card: '16px',
        button: '22px',
        'button-lg': '24px',
      },
    },
  },
  plugins: [],
};
