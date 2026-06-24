import type { CSSProperties, ReactElement } from 'react'

/**
 * Logo de NoBetter.
 *
 * Wordmark oblicuo a dos tintas, en la línea de la referencia de marca.
 * El texto usa la fuente "Archivo" (peso 900, itálica) — agregala al
 * <link> de Google Fonts del index.html (ver INTEGRATION.md).
 *
 * La variante `icon` es SVG vectorial puro: no depende de ninguna fuente,
 * por eso sirve igual como sello, favicon o app-icon a cualquier tamaño.
 */

type LogoVariant = 'full' | 'mono' | 'icon'

interface LogoProps {
  /** 'full' = wordmark a dos tintas · 'mono' = una sola tinta · 'icon' = sello "N" */
  variant?: LogoVariant
  /** Alto del logo en px (el ancho se ajusta solo). Por defecto 28. */
  size?: number
  /** Color del acento — el "No". Por defecto el rojo de la referencia. */
  accent?: string
  /** Color de la tinta principal — el "Better". Por defecto la tinta del DS. */
  ink?: string
  className?: string
  /** Texto accesible. Por defecto "NoBetter". */
  title?: string
}

// Rojo de la referencia. Para alinear al DS, pasá accent="var(--burgundy)".
const ACCENT = '#ED1C24'
const INK = '#16181D'

const wordmarkStyle = (size: number): CSSProperties => ({
  fontFamily: '"Archivo", system-ui, sans-serif',
  fontWeight: 900,
  fontStyle: 'italic',
  fontSize: size,
  letterSpacing: '-0.045em',
  lineHeight: 1,
  whiteSpace: 'nowrap',
  userSelect: 'none',
})

export function Logo({
  variant = 'full',
  size = 28,
  accent = ACCENT,
  ink = INK,
  className,
  title = 'NoBetter',
}: LogoProps): ReactElement {
  if (variant === 'icon') {
    return (
      <svg
        className={className}
        width={size}
        height={size}
        viewBox="0 0 100 100"
        role="img"
        aria-label={title}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="100" height="100" rx="22" fill={ink} />
        <g transform="translate(10,0) skewX(-12)" fill={accent}>
          <rect x="24" y="28" width="16" height="44" />
          <rect x="60" y="28" width="16" height="44" />
          <polygon points="24,28 40,28 76,72 60,72" />
        </g>
      </svg>
    )
  }

  const noColor = variant === 'mono' ? ink : accent

  return (
    <span className={className} role="img" aria-label={title} style={wordmarkStyle(size)}>
      <span style={{ color: noColor }}>No</span>
      <span style={{ color: ink }}>Better</span>
    </span>
  )
}
