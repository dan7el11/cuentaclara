import React from 'react';

/** Dark-theme status chip. Use inside a .sb-theme container.
    The `truth` and `ficticia` variants carry NoBetter's editorial message. */
export function SbBadge({ children, variant = 'default', dot = false, live = false }) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    fontFamily: 'var(--font-sans)',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    padding: '3px 8px',
    borderRadius: '6px',
    lineHeight: 1.3,
    whiteSpace: 'nowrap',
  };

  const variants = {
    default:  { background: 'var(--sb-surface-3)',         color: 'var(--sb-text-2)' },
    accent:   { background: 'var(--sb-accent-soft)',       color: 'var(--sb-accent)' },
    live:     { background: 'var(--sb-live)',              color: '#fff' },
    truth:    { background: 'var(--sb-truth-bg)',          color: 'var(--sb-truth)' },
    cash:     { background: 'rgba(31,209,122,0.14)',       color: 'var(--sb-cash)' },
    ficticia: { background: 'var(--sb-truth-bg)',          color: 'var(--sb-truth)' },
  };

  const v = variants[variant] || variants.default;
  const showDot = dot || live;
  const dotEl = showDot
    ? <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor', display: 'inline-block', animation: live ? 'sbpulse 1.4s ease-in-out infinite' : 'none' }} />
    : null;

  return <span style={{ ...base, ...v }}>{dotEl}{children}</span>;
}
