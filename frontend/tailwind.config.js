/** @type {import('tailwindcss').Config} */
module.exports = {
 content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
 
    // Or if using `src` directory:
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        wine: {
          50: '#fdf2f2',
          100: '#fde8e8',
          200: '#fbd5d5',
          300: '#f8b4b4',
          400: '#f98080', // Lighter accent
          500: '#f05252',
          600: '#e02424',
          700: '#c81e1e',
          800: '#9b1c1c', 
          900: '#97050E', // "Wine Rojo" - Primary Brand
          950: '#520303', // Deepest
          black: '#0B0202', // "Olive" - Dark background
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Modern clean font like in the image
      },
    },
  },
  plugins: [],
}

