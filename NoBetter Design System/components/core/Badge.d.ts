import type { ReactNode } from 'react';

/**
 * Small status/label chip. Use sparingly — one prominent badge per surface.
 */
export interface BadgeProps {
  children?: ReactNode;
  /** Color/semantic variant */
  variant?: 'default' | 'slate' | 'ochre' | 'burgundy' | 'sage' | 'ink' | 'ficticia';
  /** Prepend a small filled dot (used for the "Modo simulador" live indicator) */
  dot?: boolean;
  /** Force UPPERCASE letter-spacing */
  uppercase?: boolean;
}
