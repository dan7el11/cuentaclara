import type { CSSProperties, ReactNode } from 'react'

type Format = 'rectangle' | 'square' | 'leaderboard' | 'banner'

// Tamaños estándar (IAB). minHeight reserva el espacio para evitar saltos de
// layout (CLS) cuando luego se inserte el anuncio real.
const FORMATS: Record<Format, { maxWidth?: number; minHeight: number; ratio?: string; tag: string }> = {
  rectangle: { maxWidth: 300, minHeight: 250, tag: '300×250' },
  square: { maxWidth: 300, minHeight: 300, tag: '300×300' },
  leaderboard: { maxWidth: 728, minHeight: 90, tag: '728×90' },
  banner: { minHeight: 100, tag: 'responsive' },
}

interface Props {
  /** Formato del recuadro (define tamaño reservado). */
  format?: Format
  /** Identificador del slot, para el ad server/red publicitaria a futuro. */
  slotId?: string
  /** Anuncio real. Si se pasa, se renderiza en lugar del placeholder. */
  children?: ReactNode
  className?: string
  style?: CSSProperties
}

/**
 * Recuadro reservado para publicidad. Hoy muestra un placeholder marcado como
 * tal; cuando haya inventario, se le pasa el creativo por `children` (o se
 * monta el script del ad server usando `slotId`) sin tocar el layout.
 *
 * Decisión de producto: no se colocan en pantallas de misión (Apoyo, análisis
 * post-apuesta) — ahí la publicidad de apuestas iría en contra del objetivo.
 */
export function AdSlot({ format = 'rectangle', slotId, children, className, style }: Props) {
  const f = FORMATS[format]
  const frame: CSSProperties = {
    width: '100%',
    maxWidth: f.maxWidth ? `${f.maxWidth}px` : undefined,
    minHeight: `${f.minHeight}px`,
    marginInline: f.maxWidth ? 'auto' : undefined,
    ...style,
  }

  if (children) {
    return (
      <div className={className} style={frame} data-ad-slot={slotId}>
        {children}
      </div>
    )
  }

  return (
    <div
      className={`flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-paperline bg-paper/40 text-center ${className ?? ''}`}
      style={frame}
      data-ad-slot={slotId}
      aria-hidden="true"
    >
      <span className="rounded-full border border-paperline px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/40">
        Publicidad
      </span>
      <span className="figure text-[11px] text-ink/30">{f.tag}</span>
    </div>
  )
}
