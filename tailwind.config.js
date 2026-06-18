/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1C2430',      // texto principal, casi negro azulado
        paper: '#F3EFE6',    // fondo cálido tipo papel de extracto bancario
        paperline: '#E3DCC9',// líneas/divisores sobre el papel
        slate: '#3D5A73',    // acción primaria, sobrio (no "casino")
        slatedark: '#2C4356',
        ochre: '#B98B3E',    // advertencia/atención, no rojo de alarma de casino
        burgundy: '#7A2E2E', // único color reservado para alertas serias de deuda
        sage: '#5B6B4F',     // ganancias moderadas, deliberadamente no "verde casino"
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
