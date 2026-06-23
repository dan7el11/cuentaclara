import type { MouseEventHandler } from 'react';

/**
 * Odds selection button — the core interactive element of the betting interface.
 * @startingPoint section="Components" subtitle="Odds picker for 1 / X / 2 markets" viewport="700x160"
 */
export interface OddsButtonProps {
  /** Short outcome label shown above the number (e.g. "1", "X", "2") */
  label?: string;
  /** Decimal odds value — rendered in IBM Plex Mono tabular-nums */
  odds: number | string;
  /** Whether this outcome is currently in the bet slip */
  active?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  /** Set true when rendered on the dark slate gradient header */
  onDark?: boolean;
  disabled?: boolean;
}
