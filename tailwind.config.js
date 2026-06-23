/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Los colores apuntan a variables CSS (canales RGB) para que el tema
      // global se controle desde src/design/tokens.css y se pueda cambiar
      // sin tocar componentes. El sufijo <alpha-value> mantiene el soporte
      // de los modificadores de opacidad (p.ej. text-ink/50).
      colors: {
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        paper: 'rgb(var(--c-paper) / <alpha-value>)',
        paperline: 'rgb(var(--c-paperline) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        slate: 'rgb(var(--c-slate) / <alpha-value>)',
        slatedark: 'rgb(var(--c-slatedark) / <alpha-value>)',
        ochre: 'rgb(var(--c-ochre) / <alpha-value>)',
        burgundy: 'rgb(var(--c-burgundy) / <alpha-value>)',
        sage: 'rgb(var(--c-sage) / <alpha-value>)',
      },
      fontFamily: {
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
