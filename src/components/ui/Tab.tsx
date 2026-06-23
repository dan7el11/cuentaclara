import type { ReactNode } from 'react'

/** Pestaña de navegación — cabecera fija para cambiar de sección. */
export function Tab({
  children,
  active = false,
  onClick,
}: {
  children: ReactNode
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-sm)',
        fontWeight: 500,
        color: active ? 'var(--color-text)' : 'var(--color-text-muted)',
        paddingBottom: '4px',
        background: 'transparent',
        border: 'none',
        borderBottom: `2px solid ${active ? 'var(--color-primary)' : 'transparent'}`,
        cursor: 'pointer',
        transition: 'color var(--transition-fast), border-color var(--transition-fast)',
        lineHeight: 1.5,
      }}
    >
      {children}
    </button>
  )
}
