import React from 'react';

/** Sportsbook action button (dark theme). Use inside a .sb-theme container. */
export function SbButton({ children, variant = 'primary', size = 'md', fullWidth = false, disabled = false, onClick, glow = false }) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontFamily: 'var(--font-sans)',
    fontWeight: 700,
    letterSpacing: '0.01em',
    border: '1px solid transparent',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    transition: 'all 0.14s ease',
    whiteSpace: 'nowrap',
    ...(fullWidth ? { width: '100%' } : {}),
  };

  const sizes = {
    sm: { fontSize: '12px', padding: '7px 14px', borderRadius: '8px' },
    md: { fontSize: '14px', padding: '11px 18px', borderRadius: '9px' },
    lg: { fontSize: '15px', padding: '14px 22px', borderRadius: '10px' },
  };

  const variants = {
    primary:   { background: 'var(--sb-accent)',     color: 'var(--sb-on-accent)', borderColor: 'var(--sb-accent)', boxShadow: glow ? 'var(--sb-shadow-accent)' : 'none' },
    secondary: { background: 'var(--sb-surface-3)',  color: 'var(--sb-text)',      borderColor: 'var(--sb-border)' },
    ghost:     { background: 'transparent',          color: 'var(--sb-text-2)',    borderColor: 'transparent' },
    success:   { background: 'var(--sb-cash)',       color: '#06210F',             borderColor: 'var(--sb-cash)' },
    outline:   { background: 'transparent',          color: 'var(--sb-accent)',    borderColor: 'var(--sb-accent)' },
  };

  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...base, ...(sizes[size] || sizes.md), ...(variants[variant] || variants.primary) }}>
      {children}
    </button>
  );
}
