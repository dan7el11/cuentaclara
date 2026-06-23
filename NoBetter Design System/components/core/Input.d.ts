import type { ChangeEventHandler } from 'react';

/**
 * Text input with optional label, prefix/suffix, and error state.
 */
export interface InputProps {
  value?: string | number;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
  /** Visible label rendered above the field */
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel';
  size?: 'sm' | 'md';
  /** Validation error message shown below the field */
  error?: string;
  /** Short string shown inside-left (e.g. "$" for currency) */
  prefix?: string;
  /** Short string shown inside-right (e.g. "USD") */
  suffix?: string;
  disabled?: boolean;
  id?: string;
  /** Use monospaced font + tabular nums (for stake/amount fields) */
  mono?: boolean;
}
