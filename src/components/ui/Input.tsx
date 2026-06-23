import type { ChangeEventHandler, CSSProperties, ReactNode } from 'react'

/** Campo de texto con etiqueta, prefijo/sufijo y estado de error opcionales. */
export function Input({
  value,
  onChange,
  placeholder,
  label,
  type = 'text',
  size = 'md',
  error,
  prefix,
  suffix,
  disabled = false,
  id,
  mono = false,
  required = false,
  min,
  minLength,
}: {
  value: string | number
  onChange: ChangeEventHandler<HTMLInputElement>
  placeholder?: string
  label?: ReactNode
  type?: string
  size?: 'sm' | 'md'
  error?: string
  prefix?: ReactNode
  suffix?: ReactNode
  disabled?: boolean
  id?: string
  mono?: boolean
  required?: boolean
  min?: number
  minLength?: number
}) {
  const inputStyle: CSSProperties = {
    fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
    fontVariantNumeric: mono ? 'tabular-nums' : undefined,
    fontSize: size === 'sm' ? '12px' : '13px',
    padding: size === 'sm' ? '6px 10px' : '8px 12px',
    paddingLeft: prefix ? (size === 'sm' ? '26px' : '30px') : undefined,
    paddingRight: suffix ? (size === 'sm' ? '26px' : '30px') : undefined,
    border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
    borderRadius: 'var(--radius-md)',
    outline: 'none',
    background: disabled ? 'var(--color-surface-tinted)' : 'var(--color-surface)',
    color: 'var(--color-text)',
    width: '100%',
    boxSizing: 'border-box',
    transition: 'border-color 0.12s',
  }
  const adorn: CSSProperties = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--color-text-subtle)',
    fontSize: '12px',
    pointerEvents: 'none',
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            fontWeight: 500,
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {label}
        </label>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {prefix && <span style={{ ...adorn, left: '10px' }}>{prefix}</span>}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          min={min}
          minLength={minLength}
          style={inputStyle}
        />
        {suffix && <span style={{ ...adorn, right: '10px' }}>{suffix}</span>}
      </div>
      {error && (
        <span style={{ fontSize: '11px', color: 'var(--color-danger)', fontFamily: 'var(--font-sans)' }}>{error}</span>
      )}
    </div>
  )
}
