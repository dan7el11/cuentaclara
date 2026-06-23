import type { ReactNode } from 'react';

/**
 * Dark-theme status chip. Render inside a `.sb-theme` container.
 */
export interface SbBadgeProps {
  children?: ReactNode;
  variant?: 'default' | 'accent' | 'live' | 'truth' | 'cash' | 'ficticia';
  /** Prepend a static dot */
  dot?: boolean;
  /** Prepend a pulsing dot (for live indicators) */
  live?: boolean;
}
