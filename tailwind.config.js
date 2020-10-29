const plugin = require('tailwindcss/plugin');

const colors = {
  'ps-primary': '#202020',
  'ps-secondary': '#303030',
  'ps-green': '#26D789',
  'ps-mint': '#3BBA9C',
  'ps-white': '#FFFFFF',
  'ps-red': '#DC143C',
  transparent: 'transparent',
};

module.exports = {
  future: {
    removeDeprecatedGapUtilities: true,
    purgeLayersByDefault: true,
  },
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
        md: '768px',
      },
      spacing: {
        24: '24px',
        48: '48px',
        54: '54px',
        66: '66px',
        72: '72px',
        28: '7rem',
      },
    },
    borderRadius: {
      full: '50%',
      lg: '0.5rem',
    },
    minHeight: {
      52: '52px',
    },
    minWidth: {
      52: '52px',
      48: '12rem',
    },
    inset: {
      0: '0',
      '1/2': '50%',
      20: '5rem',
      32: '8rem',
    },
    zIndex: {
      100: 100,
      999: 999,
    },
  },
  variants: {},
  plugins: [
    plugin(({ addBase, addUtilities, config }) => {
      addUtilities({
        '.bg-ps-linear-gradient': { background: `linear-gradient(90deg, ${config('theme.colors.ps-green')} 11.98%, ${config('theme.colors.ps-mint')} 100%)` },
        '.ps-center-absolute': {
          position: 'absolute',
          top: `${config('theme.inset.1/2')}`,
          left: `${config('theme.inset.1/2')}`,
          transform: `translate(-${config('theme.inset.1/2')}, -${config('theme.inset.1/2')})`,
        },
      });
      addBase({
        body: { backgroundColor: config('theme.colors.ps-primary'), overflowX: 'hidden' },
        '*:focus': {
          outline: 'none',
          '-webkit-tap-highlight-color': 'transparent',
        },
      });
    }),
  ],
  purge: {
    enabled: process.env.NODE_ENV === 'production',
    content: ['components/**/*.vue', 'layouts/**/*.vue', 'pages/**/*.vue', 'plugins/**/*.js', 'nuxt.config.js'],
  },
};
