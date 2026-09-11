export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: '#080C14',
        surface: '#0D131F',
        'surface-2': '#141C2E',
        'surface-3': '#1E293B',
        border: '#2A374D',
        primary: '#38BDF8',
        emerald: '#10B981',
        amber: '#F59E0B',
        purple: '#A855F7',
        'text-main': '#E2E8F0',
        'text-muted': '#94A3B8',
        'text-faint': '#64748B',
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
