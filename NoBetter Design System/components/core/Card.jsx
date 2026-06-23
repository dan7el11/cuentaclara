import React from 'react';

/** Surface container. All data panels, sections, and modal content use this. */
export function Card({ children, style, header, footer, flush = false, tinted = false, gradient = false }) {
  const cardStyle = {
    background: gradient
      ? 'var(--gradient-slate)'
      : tinted
      ? 'var(--color-surface-tinted)'
      : 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-card)',
    overflow: 'hidden',
    ...style,
  };

  const bodyStyle = flush ? {} : { padding: 'var(--card-pad)' };

  const headerStyle = {
    padding: '16px var(--card-pad)',
    borderBottom: '1px solid var(--color-border)',
    fontFamily: 'var(--font-serif)',
    fontSize: 'var(--text-lg)',
    color: gradient ? 'var(--color-paper)' : 'var(--color-text)',
  };

  return (
    <div style={cardStyle}>
      {header && <div style={headerStyle}>{header}</div>}
      <div style={bodyStyle}>{children}</div>
      {footer && (
        <div style={{ padding: '12px var(--card-pad)', borderTop: '1px solid var(--color-border)' }}>
          {footer}
        </div>
      )}
    </div>
  );
}
