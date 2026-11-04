/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Wildfire Signature Palette
        ember: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          500: '#f97316',
          600: '#ea580c', // Primary fire accent
          700: '#c2410c',
          800: '#9a3412',
        },
        paper: {
          50: '#fdfbf7', // Warm reader background
          100: '#f7f4ee',
          200: '#ede8df',
          300: '#ded7c8',
        },
        ink: {
          900: '#1c1917', // High-contrast warm charcoal for headings
          800: '#292524',
          700: '#44403c',
          500: '#78716c',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'serif'],
        sans: ['system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
