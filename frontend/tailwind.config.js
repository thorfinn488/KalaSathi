/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        heritage: {
          bg: '#FAF5EA',
          surface: '#FFFFFF',
          'surface-strong': '#1B2352',
          text: '#1F1A2E',
          fg: '#4A4458',
          muted: '#5E576B',
          primary: '#22306B',
          'primary-hover': '#1B2352',
          accent: '#B5532F',
          'accent-hover': '#8E3B1F',
          gold: '#B8893A',
          'gold-light': '#E4C27A',
          maroon: '#6E2233',
          border: '#E1D6BE',
          cream: '#F3EBDA',
        },
        artisan: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#d97706',
          600: '#b45309',
          700: '#92400e',
          800: '#78350f',
          900: '#451a03',
        },
        terracotta: {
          500: '#B5532F',
          600: '#8E3B1F',
        },
        indigoCraft: {
          600: '#22306B',
          700: '#1B2352',
        }
      }
    },
  },
  plugins: [],
}
