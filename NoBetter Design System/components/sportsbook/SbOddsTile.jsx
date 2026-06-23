import React from 'react';

/** Odds tile for the dark sportsbook — the core betting interaction.
    Use inside a .sb-theme container. Optional up/down market-movement arrow. */
export function SbOddsTile({ label, odds, active = false, move, onClick, disabled = false }) {
  const base = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    minWidth: '60px',
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid',
    cursor: disabled ? 'default' : 'pointer',
    transition: 'all 0.12s ease',
    fontFamily: 'var(--font-sans)',
  };

  const state = active
    ? { background: 'var(--sb-accent)', borderColor: 'var(--sb-accent)', color: 'var(--sb-on-accent)', boxShadow: 'var(--sb-shadow-accent)' }
    : { background: 'var(--sb-surface-3)', borderColor: 'var(--sb-border)', color: 'var(--sb-text)' };

  const moveColor = move === 'up' ? 'var(--sb-up)' : move === 'down' ? 'var(--sb-down)' : 'transparent';

  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...base, ...state }}>
      {label && (
        <span style={{ fontSize: '10px', fontWeight: 600, opacity: active ? 0.85 : 0.5, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {label}
        </span>
      )}
      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
          {typeof odds === 'number' ? odds.toFixed(2) : odds}
        </span>
        {move && <span style={{ fontSize: '8px', color: active ? 'var(--sb-on-accent)' : moveColor }}>{move === 'up' ? '\u25B2' : '\u25BC'}</span>}
      </span>
    </button>
  );
}
