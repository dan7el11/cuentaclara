import React from 'react';

/** Dashed horizontal rule — NoBetter's signature brand motif.
    Evokes a checkbook ledger stub; used as section divider throughout. */
export function LedgerRule({ style, margin }) {
  return (
    <div
      style={{
        height: '1px',
        backgroundImage: 'var(--ledger-rule-bg)',
        margin: margin !== undefined ? margin : undefined,
        ...style,
      }}
    />
  );
}
