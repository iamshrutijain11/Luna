/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        luna: {
          ivory: '#F4F0E8',
          pearl: '#FFFFFF',
          'pearl-grey': '#E7E3DC',
          'moonstone': '#B9B8BE',
          'silver': '#92939D',
          'lavender': '#B5ADC9',
          'halo': '#DCD9FF',
          'charcoal': '#17171D',
          'charcoal-light': '#21212B',
          'charcoal-surface': '#262633',
          'charcoal-border': '#323242',
          'primary': '#20212A',
          'secondary': '#626471',
          'success': '#16856B',
          'warning': '#C78332',
          'error': '#C94F57',
          'accent': '#4F46E5',
          'accent-hover': '#4338CA',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'luna-sm': '8px',
        'luna-md': '12px',
        'luna-lg': '16px',
        'luna-xl': '20px',
      },
      boxShadow: {
        'luna-card': '0 2px 8px -2px rgba(23, 23, 29, 0.05), 0 1px 2px -1px rgba(23, 23, 29, 0.04)',
        'luna-card-hover': '0 12px 24px -4px rgba(23, 23, 29, 0.08), 0 4px 8px -2px rgba(23, 23, 29, 0.04)',
        'luna-halo': '0 0 0 4px rgba(220, 217, 255, 0.5), 0 8px 24px -4px rgba(79, 70, 229, 0.25)',
        'luna-glass': '0 8px 32px 0 rgba(23, 23, 29, 0.06)',
      },
    },
  },
  plugins: [],
}
