/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Theme colors
      colors: {
        app: '#F7F7F8',
        toolbar: '#F7F7F8',
        // Design token: hover + selected background for side nav, table rows, user block.
        'interactive-bg-secondary-hover': '#EFEFF1',
        'table-header': '#F3F3F1',
        line: '#E4E2DC',
        ink: '#1F1F1F',
        muted: '#6B6B6B',
        link: '#2F5BD3',
        primary: { DEFAULT: '#1F7AE0', hover: '#1868C2' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
