import type { CSSProperties } from 'react'

/** Línea punteada — motivo de marca, divisor de secciones. */
export function LedgerRule({ style, margin }: { style?: CSSProperties; margin?: string }) {
  return (
    <div
      style={{
        height: '1px',
        backgroundImage: 'var(--ledger-rule-bg)',
        ...(margin !== undefined ? { margin } : {}),
        ...style,
      }}
    />
  )
}
