import type { ReactNode, MouseEventHandler } from 'react';

/**
 * Sportsbook action button (dark theme). Render inside a `.sb-theme` container.
 */
export interface SbButtonProps {
  children?: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  /** Add the accent glow shadow (use on the main "Apostar" CTA) */
  glow?: boolean;
}
