/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: {
          light: '#fafafa',
          dark: '#09090b'
        },
        card: {
          light: '#ffffff',
          dark: '#121214'
        },
        border: {
          light: '#e4e4e7',
          dark: '#27272a'
        },
        brand: {
          DEFAULT: '#6366f1',
          hover: '#4f46e5'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Geist Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    }
  },
  plugins: [
    ({ addVariant }) => {
      addVariant('light', '.light &');
    }
  ]
};
