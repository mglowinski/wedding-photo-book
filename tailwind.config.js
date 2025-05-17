/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    'bg-opacity-90',
    'backdrop-blur-sm',
    'bg-white/90',
    'bg-white/70',
    'bg-white/50',
    'bg-primary-dark',
    'bg-primary-dark/90',
    'bg-transparent',
    'bg-white',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#D53F8C',
        'primary-dark': '#B83280',
        secondary: '#ED64A6',
        dark: '#111827',
        light: '#F9FAFB',
      },
      fontFamily: {
        sans: ['var(--font-montserrat)'],
        montserrat: ['var(--font-montserrat)'],
      },
    },
  },
  plugins: [],
} 