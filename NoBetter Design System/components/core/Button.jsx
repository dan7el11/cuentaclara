import React from 'react';

/** Primary and secondary action buttons for all interactive surfaces. */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  type = 'button',
  fullWidth = false,
}) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    letterSpacing: '0.01em',
    border: '1px solid transparent',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'background 0.12s, border-color 0.12s, color 0.12s',
    lineHeight: 1.4,
    whiteSpace: 'nowrap',
    textDecoration: 'none',
    ...(fullWidth ? { width: '100%' } : {}),
  };

  const sizes = {
    sm: { fontSize: '12px', padding: '5px 12px', borderRadius: '6px' },
    md: { fontSize: '13px', padding: '8px 16px', borderRadius: '8px' },
    lg: { fontSize: '14px', padding: '10px 20px', borderRadius: '8px' },
  };

  const variants = {
    primary:   { background: 'var(--color-primary)',    color: 'var(--color-paper)', borderColor: 'var(--color-primary)' },
    secondary: { background: 'var(--color-surface)',    color: 'var(--color-text)',  borderColor: 'var(--color-border)' },
    ghost:     { background: 'transparent',             color: 'var(--color-primary)', borderColor: 'transparent' },
    danger:    { background: 'var(--color-danger)',     color: 'var(--color-paper)', borderColor: 'var(--color-danger)' },
    success:   { background: 'var(--color-success)',    color: 'var(--color-paper)', borderColor: 'var(--color-success)' },
    outline:   { background: 'transparent',             color: 'var(--color-primary)', borderColor: 'var(--color-primary)' },
    dark:      { background: 'rgba(255,255,255,0.10)', color: '#fff', borderColor: 'rgba(255,255,255,0.30)' },
  };

  const s = sizes[size] || sizes.md;
  const v = variants[variant] || variants.primary;

  return (
    <button
      type={type}
      style={{ ...base, ...s, ...v }}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
