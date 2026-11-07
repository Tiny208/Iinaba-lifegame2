/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        inaba: {
          bg: {
            light: '#F5F3ED',
            dark: '#171614',
          },
          surface: {
            light: '#FFFFFF',
            dark: '#21201D',
          },
          text: {
            primary: '#242424',
            'primary-dark': '#EAE7DF',
            secondary: '#858176',
            'secondary-dark': '#8C877D',
          },
          accent: {
            DEFAULT: '#9B8963',
            hover: '#877653',
            dark: '#B3A27D',
            light: '#F0ECE1',
          },
          border: {
            light: '#E5E1D8',
            dark: '#2E2C28',
          },
          muted: {
            light: '#EAE6DD',
            dark: '#2A2824',
          }
        }
      },
      fontFamily: {
        serif: ['Newsreader', 'Playfair Display', 'Cormorant Garamond', 'Georgia', 'Cambria', 'serif'],
        sans: ['Inter', 'DM Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02)',
        lifted: '0 4px 12px -2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
