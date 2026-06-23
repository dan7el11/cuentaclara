import type { CSSProperties } from 'react';

/**
 * Dashed horizontal rule — NoBetter's signature brand motif.
 * Evokes a checkbook ledger stub. Used as section dividers throughout.
 */
export interface LedgerRuleProps {
  /** Inline style overrides (e.g. margin, width) */
  style?: CSSProperties;
  /** Shorthand margin (e.g. "12px 0" or "16px") */
  margin?: string;
}
