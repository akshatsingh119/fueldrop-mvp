/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'] },
      colors: {
        navy: { DEFAULT: '#0F1B3D', 900: '#0A1330', 800: '#0F1B3D', 700: '#1B2A55', 600: '#2A3B6B', 100: '#E7EAF3' },
        brand: { DEFAULT: '#FF6A2B', 600: '#F2551A', 100: '#FFE9DF', 50: '#FFF4EE' },
        ev: { DEFAULT: '#16A34A', 700: '#15803D', 600: '#16A34A', 500: '#22C55E', 400: '#4ADE80', 100: '#DCFCE7', 50: '#F0FDF4' },
        bg: '#F5F7FB',
        ink: { DEFAULT: '#0F1B3D', 2: '#5B6478', 3: '#8A92A6' },
        line: '#E3E7F0',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,27,61,.04), 0 4px 16px rgba(15,27,61,.06)',
        lift: '0 8px 30px rgba(15,27,61,.12)',
        glow: '0 8px 24px rgba(22,163,74,.35)',
        cta: '0 8px 20px rgba(255,106,43,.32)',
      },
      borderRadius: { xl2: '20px' },
      keyframes: {
        shimmer: { '0%': { backgroundPosition: '-400px 0' }, '100%': { backgroundPosition: '400px 0' } },
        rise: { '0%': { opacity: 0, transform: 'translateY(10px)' }, '100%': { opacity: 1, transform: 'none' } },
        fade: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        sheet: { '0%': { transform: 'translateY(100%)' }, '100%': { transform: 'none' } },
        pulseRing: { '0%': { transform: 'scale(.8)', opacity: .7 }, '100%': { transform: 'scale(2.4)', opacity: 0 } },
        flow: { '0%': { strokeDashoffset: 24 }, '100%': { strokeDashoffset: 0 } },
        pop: { '0%': { transform: 'scale(.6)', opacity: 0 }, '70%': { transform: 'scale(1.08)' }, '100%': { transform: 'scale(1)', opacity: 1 } },
        bolt: { '0%,100%': { opacity: 1 }, '50%': { opacity: .45 } },
      },
      animation: {
        shimmer: 'shimmer 1.4s linear infinite',
        rise: 'rise .35s cubic-bezier(.2,.8,.2,1) both',
        fade: 'fade .25s ease both',
        sheet: 'sheet .32s cubic-bezier(.2,.8,.2,1) both',
        ring: 'pulseRing 1.8s ease-out infinite',
        flow: 'flow .6s linear infinite',
        pop: 'pop .45s cubic-bezier(.2,.8,.2,1) both',
        bolt: 'bolt 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
