import React from 'react';

/** Small status/label chip. Use sparingly — one prominent badge per surface. */
export function Badge({ children, variant = 'default', dot = false, uppercase = false }) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    fontFamily: 'var(--font-sans)',
    fontSize: '11px',
    fontWeight: 500,
    letterSpacing: '0.03em',
    padding: '3px 10px',
    borderRadius: '999px',
    border: '1px solid transparent',
    lineHeight: 1.4,
    whiteSpace: 'nowrap',
  };

  const variants = {
    default:  { background: 'transparent',              color: 'var(--color-text-muted)',  borderColor: 'var(--color-border)' },
    slate:    { background: 'var(--color-primary-bg)',  color: 'var(--color-primary)',     borderColor: 'var(--color-primary-border)' },
    ochre:    { background: 'var(--color-warning-bg)',  color: 'var(--color-warning)',     borderColor: 'var(--color-warning-border)' },
    burgundy: { background: 'var(--color-danger)',      color: 'var(--color-paper)',       borderColor: 'transparent' },
    sage:     { background: 'var(--color-success-bg)',  color: 'var(--color-success)',     borderColor: 'var(--color-success-border)' },
    ink:      { background: 'var(--color-ink)',         color: 'var(--color-paper)',       borderColor: 'transparent' },
    /* Reserved for the "ficticia" money label */
    ficticia: { background: 'rgba(185,139,62,0.9)',     color: 'var(--color-ink)',         borderColor: 'transparent', fontSize: '10px', letterSpacing: '0.08em' },
  };

  const v = variants[variant] || variants.default;
  const isUpper = uppercase || variant === 'ficticia';

  const dotEl = dot
    ? <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor', display: 'inline-block', flexShrink: 0 }} />
    : null;

  return (
    <span style={{ ...base, ...v, textTransform: isUpper ? 'uppercase' : 'none', letterSpacing: isUpper ? '0.08em' : v.letterSpacing || '0.03em' }}>
      {dotEl}
      {children}
    </span>
  );
}
