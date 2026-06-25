import type { CSSProperties } from 'react'

type Variant = 'full' | 'mono' | 'icon'

interface Props {
  /** `full` (wordmark a dos tintas) · `mono` (una tinta) · `icon` (sello "C") */
  variant?: Variant
  /** Alto en px; el ancho se calcula solo. */
  size?: number
  /** Color de acento (por defecto rojo de marca). */
  accent?: string
  /** Tinta del texto (por defecto casi-negro de marca). */
  ink?: string
  style?: CSSProperties
  title?: string
}

const ACCENT = '#ED1C24'
const INK = '#16181D'

/**
 * Logo de marca. El wordmark usa Archivo 900 itálica (cargada en index.html).
 * La variante `icon` es SVG puro: no depende de la fuente y escala sin pérdida.
 */
export function Logo({
  variant = 'full',
  size = 28,
  accent = ACCENT,
  ink = INK,
  style,
  title = 'CuentaClara',
}: Props) {
  if (variant === 'icon') {
    return (
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        role="img"
        aria-label={title}
        style={style}
      >
        <rect x="0" y="0" width="64" height="64" rx="14" fill={accent} />
        <path
          d="M 42.29 19.74 A 16 16 0 1 0 42.29 44.26"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="9"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  const wordStyle: CSSProperties = {
    fontFamily: '"Archivo", Inter, system-ui, sans-serif',
    fontWeight: 900,
    fontStyle: 'italic',
    fontSize: `${size}px`,
    lineHeight: 1,
    letterSpacing: '-0.02em',
    whiteSpace: 'nowrap',
    userSelect: 'none',
    ...style,
  }

  // Dos tintas: "Cuenta" en tinta, "Clara" en acento. En `mono`, todo una tinta.
  return (
    <span style={wordStyle} aria-label={title} role="img">
      <span style={{ color: ink }}>Cuenta</span>
      <span style={{ color: variant === 'mono' ? ink : accent }}>Clara</span>
    </span>
  )
}
