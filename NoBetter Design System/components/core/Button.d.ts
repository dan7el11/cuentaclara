import type { ReactNode, MouseEventHandler } from 'react';

/**
 * Primary and secondary action buttons for all interactive surfaces.
 * @startingPoint section="Components" subtitle="Primary action — primary / secondary / ghost" viewport="700x200"
 */
export interface ButtonProps {
  children?: ReactNode;
  /** Visual weight of the action */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline' | 'dark';
  /** Physical size */
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit' | 'reset';
  /** Stretch to fill container width */
  fullWidth?: boolean;
}
