import type { ReactNode } from 'react';

/**
 * Navigation tab for top-level route switching in the sticky header.
 */
export interface TabProps {
  children?: ReactNode;
  /** Whether this tab represents the current route */
  active?: boolean;
  onClick?: () => void;
  /** Render as an anchor tag instead of a button */
  href?: string;
}
