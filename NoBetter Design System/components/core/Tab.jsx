import React from 'react';

/** Navigation tab — used in the sticky header for top-level route switching. */
export function Tab({ children, active = false, onClick, href }) {
  const style = {
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
    textDecoration: 'none',
    display: 'inline-block',
    lineHeight: 1.5,
  };

  if (href) {
    return <a href={href} style={style}>{children}</a>;
  }

  return (
    <button type="button" style={style} onClick={onClick}>
      {children}
    </button>
  );
}
