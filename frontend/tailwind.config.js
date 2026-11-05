/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FFFCF7',
          100: '#FFF8EE',
          200: '#FBF1E0',
          300: '#F4E5CC',
        },
        forest: {
          DEFAULT: '#1F5B43',
          light: '#2A7557',
          dark: '#144230',
        },
        leaf: {
          DEFAULT: '#83B879',
          light: '#9CC993',
          dark: '#689B5F',
        },
        citrus: {
          DEFAULT: '#F6C94A',
          light: '#F8D672',
          dark: '#DBAA27',
        },
        coral: {
          DEFAULT: '#F17C65',
          light: '#F59A88',
          dark: '#D95C43',
        },
        berry: {
          DEFAULT: '#B84D72',
          light: '#CA6B8C',
          dark: '#963556',
        },
        sky: {
          DEFAULT: '#B9DDF2',
          light: '#D3EAF7',
          dark: '#93C4E2',
        },
        ink: {
          DEFAULT: '#24312B',
          muted: '#6B756F',
          subtle: '#949F98',
        },
        surface: {
          paper: '#FFFFFF',
          border: '#E9E3D9',
          subtle: '#FAF6EE',
        }
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'tactile': '0 2px 0 #E9E3D9, 0 10px 20px -5px rgba(36, 49, 43, 0.05)',
        'floating': '0 20px 40px -15px rgba(31, 91, 67, 0.12), 0 0 1px 1px rgba(233, 227, 217, 0.6)',
        'glass': '0 8px 32px 0 rgba(31, 91, 67, 0.08)',
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
}

