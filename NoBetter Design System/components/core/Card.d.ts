import type { ReactNode, CSSProperties } from 'react';

/**
 * Standard surface container for data panels, sections, and modals.
 * @startingPoint section="Components" subtitle="White surface with soft drop shadow" viewport="700x200"
 */
export interface CardProps {
  children?: ReactNode;
  /** Inline style overrides for the outer shell */
  style?: CSSProperties;
  /** Content rendered in a titled, border-separated header row */
  header?: ReactNode;
  /** Content rendered in a bottom footer row */
  footer?: ReactNode;
  /** Omit internal padding — use for full-bleed tables or images */
  flush?: boolean;
  /** Use paper (tinted) background instead of white */
  tinted?: boolean;
  /** Apply the slate gradient (for hero/header cards) */
  gradient?: boolean;
}
