const plugin = require('tailwindcss/plugin');

const colors = {
  'ps-primary': '#202020',
  'ps-secondary': '#303030',
  'ps-green': '#26D789',
  'ps-mint': '#3BBA9C',
  'ps-white': '#FFFFFF',
};

module.exports = {
  theme: {
    colors,
    boxShadow: {
      default: '8px 8px 16px rgba(0, 0, 0, 0.25)',
    },
    fontFamily: {
      sans: ['"Exo 2"'],
    },
    extend: {
      screens: {
        sm: '480px',
      },
      spacing: {
        '48': '48px',
        '52': '52px',
      },
    },
    borderRadius: {
      full: '50%',
    },
    minHeight: {
      '52': '52px',
    },
    minWidth: {
      '52': '52px',
    },
  },
  variants: {},
  plugins: [
    plugin(({ addBase, addUtilities, config }) => {
      addUtilities({
        '.bg-ps-linear-gradient': { background: `linear-gradient(90deg, ${config('theme.colors.ps-green')} 11.98%, ${config('theme.colors.ps-mint')} 100%)` },
      });
      addBase({
        body: { backgroundColor: config('theme.colors.ps-primary') },
      });
    }),
  ],
  purge: {
    enabled: process.env.NODE_ENV === 'production',
    content: ['components/**/*.vue', 'layouts/**/*.vue', 'pages/**/*.vue', 'plugins/**/*.js', 'nuxt.config.js'],
  },
};
