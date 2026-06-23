import React from 'react';

/** Text input with optional label, prefix/suffix, and validation state. */
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
}) {
  const inputStyle = {
    fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
    fontVariantNumeric: mono ? 'tabular-nums' : undefined,
    fontSize: size === 'sm' ? '12px' : '13px',
    padding: size === 'sm' ? '6px 10px' : '8px 12px',
    paddingLeft: prefix ? (size === 'sm' ? '26px' : '30px') : (size === 'sm' ? '10px' : '12px'),
    paddingRight: suffix ? (size === 'sm' ? '26px' : '30px') : (size === 'sm' ? '10px' : '12px'),
    border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
    borderRadius: 'var(--radius-md)',
    outline: 'none',
    background: disabled ? 'var(--color-surface-tinted)' : 'var(--color-surface)',
    color: 'var(--color-text)',
    width: '100%',
    boxSizing: 'border-box',
    transition: 'border-color 0.12s',
  };

  const labelStyle = {
    display: 'block',
    fontFamily: 'var(--font-sans)',
    fontSize: '11px',
    fontWeight: 500,
    color: 'var(--color-text-muted)',
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  };

  const adornStyle = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--color-text-subtle)',
    fontSize: '12px',
    fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
    pointerEvents: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {label && <label htmlFor={id} style={labelStyle}>{label}</label>}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {prefix && <span style={{ ...adornStyle, left: '10px' }}>{prefix}</span>}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          style={inputStyle}
        />
        {suffix && <span style={{ ...adornStyle, right: '10px' }}>{suffix}</span>}
      </div>
      {error && (
        <span style={{ fontSize: '11px', color: 'var(--color-danger)', fontFamily: 'var(--font-sans)' }}>
          {error}
        </span>
      )}
    </div>
  );
}
