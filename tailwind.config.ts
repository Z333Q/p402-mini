import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'p402': {
          primary: '#B6FF2E',
          'primary-hover': '#A0E626',
          'primary-light': '#E9FFD0',
          success: '#22C55E',
          error: '#EF4444',
          warning: '#F59E0B',
          info: '#22D3EE',
        },
        neutral: {
          50: '#FFFFFF',
          100: '#F5F5F5',
          200: '#E6E6E6',
          300: '#CFCFCF',
          400: '#A8A8A8',
          500: '#7A7A7A',
          600: '#4A4A4A',
          700: '#2B2B2B',
          800: '#141414',
          900: '#000000',
        },
      },
      fontFamily: {
        sans: [
          'IBM Plex Sans',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'Liberation Mono',
          'monospace',
        ],
      },
      borderRadius: {
        DEFAULT: '0px',
        none: '0px',
      },
      borderWidth: {
        DEFAULT: '2px',
        '2': '2px',
      },
    },
  },
  plugins: [],
};

export default config;
