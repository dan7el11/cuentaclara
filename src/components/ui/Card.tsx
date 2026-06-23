import type { CSSProperties, ReactNode } from 'react'

/** Contenedor de superficie. Paneles, secciones y modales. */
export function Card({
  children,
  style,
  header,
  footer,
  flush = false,
  tinted = false,
  gradient = false,
}: {
  children: ReactNode
  style?: CSSProperties
  header?: ReactNode
  footer?: ReactNode
  flush?: boolean
  tinted?: boolean
  gradient?: boolean
}) {
  const cardStyle: CSSProperties = {
    background: gradient ? 'var(--gradient-slate)' : tinted ? 'var(--color-surface-tinted)' : 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-card)',
    overflow: 'hidden',
    ...style,
  }
  return (
    <div style={cardStyle}>
      {header && (
        <div
          style={{
            padding: '16px var(--card-pad)',
            borderBottom: '1px solid var(--color-border)',
            fontFamily: 'var(--font-serif)',
            fontSize: 'var(--text-lg)',
            color: gradient ? 'var(--color-paper)' : 'var(--color-text)',
          }}
        >
          {header}
        </div>
      )}
      <div style={flush ? undefined : { padding: 'var(--card-pad)' }}>{children}</div>
      {footer && (
        <div style={{ padding: '12px var(--card-pad)', borderTop: '1px solid var(--color-border)' }}>{footer}</div>
      )}
    </div>
  )
}
