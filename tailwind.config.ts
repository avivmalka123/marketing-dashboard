import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0c0c14',
        bg2: '#12121e',
        card: 'rgba(255,255,255,0.04)',
        'card-border': 'rgba(255,255,255,0.08)',
        'card-hover': 'rgba(255,255,255,0.07)',
        text: '#eeeeff',
        text2: '#7777aa',
        accent: '#7c3aed',
        accent2: '#06b6d4',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        pink: '#ec4899',
      },
      fontFamily: {
        sans: ['Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}

export default config
