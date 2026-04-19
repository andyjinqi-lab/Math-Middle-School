/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#4F7DF3',
        secondary: '#35C9A5',
        accent: '#FFB84D',
        purple: '#A78BFA',
        bg: '#F7F9FC',
        card: '#FFFFFF',
        textMain: '#24324A',
        textSub: '#6B7A90',
        success: '#22C55E',
        error: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 30px rgba(79, 125, 243, 0.08)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pop: {
          '0%': { transform: 'scale(0.95)', opacity: '0.8' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        pop: 'pop 220ms ease-out',
      },
    },
  },
  plugins: [],
}
