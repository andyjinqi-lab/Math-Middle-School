/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#5B6CFF',
        primaryHover: '#4858E8',
        secondary: '#34D399',
        cyan: '#22C7D8',
        accent: '#FFB020',
        purple: '#7C5CFF',
        red: '#FF5C7A',
        pageBg: '#F5F8FF',
        bg: '#F5F8FF',
        surface: '#FFFFFF',
        surfaceSoft: '#F8FAFF',
        card: '#FFFFFF',
        softBlue: '#EEF4FF',
        softPurple: '#F2EEFF',
        darkPanel: '#08122B',
        textMain: '#17233C',
        textSecondary: '#61708A',
        textSub: '#61708A',
        textMuted: '#94A3B8',
        textInverse: '#FFFFFF',
        borderLight: 'rgba(148, 163, 184, 0.22)',
        borderPrimary: 'rgba(91, 108, 255, 0.28)',
        success: '#34D399',
        error: '#FF5C7A',
      },
      fontFamily: {
        sans: ['Inter', 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 12px 30px rgba(43, 83, 180, 0.08)',
        card: '0 12px 30px rgba(43, 83, 180, 0.08)',
        lift: '0 18px 44px rgba(43, 83, 180, 0.14)',
        panel: '0 24px 60px rgba(15, 23, 42, 0.12)',
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
