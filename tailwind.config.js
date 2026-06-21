/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        brown: {
          50: '#FDF8F3',
          100: '#F5EFE6',
          200: '#E8DCC8',
          300: '#D4C1A3',
          400: '#B89968',
          500: '#8B6914',
          600: '#5D4037',
          700: '#4E342E',
          800: '#3E2723',
          900: '#2C1810',
        },
        olive: {
          50: '#F1F8E9',
          100: '#DCEDC8',
          200: '#C5E1A5',
          300: '#AED581',
          400: '#9CCC65',
          500: '#7CB342',
          600: '#558B2F',
          700: '#33691E',
          800: '#1B5E20',
          900: '#0D3B0D',
        },
        amber: {
          50: '#FFF8E1',
          100: '#FFECB3',
          200: '#FFE082',
          300: '#FFD54F',
          400: '#FFCA28',
          500: '#FFB300',
          600: '#FF8F00',
          700: '#FF6F00',
          800: '#E65100',
          900: '#BF360C',
        },
        cream: '#F5F0E8',
        parchment: '#F8F4EB',
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', '"Source Han Serif SC"', 'Georgia', 'serif'],
        sans: ['"Noto Sans SC"', '"Source Han Sans SC"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(93, 64, 55, 0.08)',
        'card': '0 4px 16px rgba(93, 64, 55, 0.1)',
        'hover': '0 8px 24px rgba(93, 64, 55, 0.15)',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};
