import type { CSSProperties } from 'react'

/**
 * Botón de cuota — el elemento interactivo central de la interfaz de apuestas.
 * Aparece sobre la cabecera con gradiente (onDark) y en la lista (claro).
 */
export function OddsButton({
  label,
  odds,
  active = false,
  onClick,
  onDark = false,
  disabled = false,
  style,
}: {
  label?: string
  odds: number | string
  active?: boolean
  onClick?: () => void
  onDark?: boolean
  disabled?: boolean
  style?: CSSProperties
}) {
  const base: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '3px',
    minWidth: '72px',
    padding: '8px 12px',
    borderRadius: 'var(--radius-lg)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background 0.12s, border-color 0.12s, color 0.12s',
    border: '1px solid',
    background: 'transparent',
    opacity: disabled ? 0.5 : 1,
  }
  const states: Record<string, CSSProperties> = {
    darkActive: { borderColor: '#fff', background: '#fff', color: 'var(--color-ink)' },
    darkInactive: { borderColor: 'rgba(255,255,255,0.20)', background: 'rgba(255,255,255,0.05)', color: '#fff' },
    lightActive: { borderColor: 'var(--color-primary)', background: 'var(--color-primary)', color: 'var(--color-paper)' },
    lightInactive: { borderColor: 'var(--color-border)', background: 'transparent', color: 'var(--color-text)' },
  }
  const state = onDark
    ? active
      ? states.darkActive
      : states.darkInactive
    : active
    ? states.lightActive
    : states.lightInactive

  return (
    <button style={{ ...base, ...state, ...style }} onClick={disabled ? undefined : onClick}>
      {label && (
        <span style={{ fontSize: '10px', fontWeight: 600, fontFamily: 'var(--font-sans)', opacity: 0.7, letterSpacing: '0.04em' }}>
          {label}
        </span>
      )}
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
        {typeof odds === 'number' ? odds.toFixed(2) : odds}
      </span>
    </button>
  )
}
