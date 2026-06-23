import type { MouseEventHandler } from 'react';

/**
 * Odds tile for the dark sportsbook — the core betting interaction.
 * Render inside a `.sb-theme` container.
 */
export interface SbOddsTileProps {
  /** Outcome label above the number (e.g. "1", "X", "2") */
  label?: string;
  /** Decimal odds — rendered in mono tabular-nums, 2 decimals */
  odds: number | string;
  /** Whether this outcome is in the bet slip */
  active?: boolean;
  /** Market-movement arrow: green up / red down */
  move?: 'up' | 'down';
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
}
