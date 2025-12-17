import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // CYBERCORE Colors (from main.html)
        bg: {
          DEFAULT: '#030304',
          deep: '#030304',
          surface: '#0a0a0c',
        },
        primary: {
          DEFAULT: '#7c3aed',
          vivid: '#7c3aed',
          accent: '#6d28d9',
          dark: '#4c1d95',
        },
        secondary: {
          DEFAULT: '#a78bfa',
          light: '#c4b5fd',
        },
        // Semantic colors
        surface: '#0a0a0c',
        glass: {
          bg: 'rgba(20, 20, 26, 0.6)',
          border: 'rgba(255, 255, 255, 0.08)',
        },
        // Text colors
        text: {
          primary: '#ffffff',
          secondary: '#a3a3a3',
          muted: '#666666',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      borderRadius: {
        'xl': '20px',
        '2xl': '24px',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(90deg, #7c3aed 0%, #a78bfa 100%)',
        'gradient-card': 'linear-gradient(160deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
        'gradient-glow': 'radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, rgba(3, 3, 4, 0) 70%)',
      },
      boxShadow: {
        'glow': '0 0 10px rgba(124, 58, 237, 0.5)',
        'glow-lg': '0 0 20px rgba(124, 58, 237, 0.3)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-glow': 'pulse 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulse: {
          '0%': { boxShadow: '0 0 0 0 rgba(124, 58, 237, 0.7)' },
          '70%': { boxShadow: '0 0 0 10px rgba(124, 58, 237, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(124, 58, 237, 0)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
