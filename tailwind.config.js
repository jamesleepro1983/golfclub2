/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0F4C3A',
        'primary-light': '#1A7D5A',
        accent: '#E8B54B',
        'bg-cream': '#FDFBF7',
        'bg-card': '#FFFFFF',
        'text-primary': '#1A1A1A',
        'text-secondary': '#5C5C5C',
        'text-muted': '#8A8A8A',
        border: '#E5E2DB',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Fraunces', 'serif'],
      },
    },
  },
  plugins: [],
}
