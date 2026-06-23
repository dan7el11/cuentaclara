import type { CSSProperties, ReactNode } from 'react'

type Variant = 'default' | 'slate' | 'ochre' | 'burgundy' | 'sage' | 'ink' | 'ficticia'

const variants: Record<Variant, CSSProperties> = {
  default: { background: 'transparent', color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' },
  slate: { background: 'var(--color-primary-bg)', color: 'var(--color-primary)', borderColor: 'var(--color-primary-border)' },
  ochre: { background: 'var(--color-warning-bg)', color: 'var(--color-warning)', borderColor: 'var(--color-warning-border)' },
  burgundy: { background: 'var(--color-danger)', color: 'var(--color-paper)', borderColor: 'transparent' },
  sage: { background: 'var(--color-success-bg)', color: 'var(--color-success)', borderColor: 'var(--color-success-border)' },
  ink: { background: 'var(--color-ink)', color: 'var(--color-paper)', borderColor: 'transparent' },
  ficticia: { background: 'rgba(185,139,62,0.9)', color: 'var(--color-ink)', borderColor: 'transparent' },
}

/** Chip de estado/etiqueta. Usar con moderación: uno destacado por superficie. */
export function Badge({
  children,
  variant = 'default',
  dot = false,
  uppercase = false,
}: {
  children: ReactNode
  variant?: Variant
  dot?: boolean
  uppercase?: boolean
}) {
  const isUpper = uppercase || variant === 'ficticia'
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    fontFamily: 'var(--font-sans)',
    fontSize: variant === 'ficticia' ? '10px' : '11px',
    fontWeight: 500,
    letterSpacing: isUpper ? '0.08em' : '0.03em',
    padding: '3px 10px',
    borderRadius: '999px',
    border: '1px solid transparent',
    lineHeight: 1.4,
    whiteSpace: 'nowrap',
    textTransform: isUpper ? 'uppercase' : 'none',
  }
  return (
    <span style={{ ...base, ...variants[variant] }}>
      {dot && (
        <span
          style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor', display: 'inline-block', flexShrink: 0 }}
        />
      )}
      {children}
    </span>
  )
}
