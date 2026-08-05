import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        cq: {
          green:  '#6FB04A',
          brown:  '#6E3F22',
          sage:   '#C0D1C6',
          yellow: '#FDC829',
          blue:   '#006994',
          beige:  '#F5F5DC',
        },
      },
      fontFamily: {
        sans:  ['var(--font-inter)', 'sans-serif'],
        bebas: ['var(--font-bebas)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
