import type { ReactNode } from 'react';
export interface ButtonProps{
  variant?: 'primary'|'secondary'|'ghost'|'accent';
  size?: 'sm'|'md'|'lg';
  disabled?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  type?: 'button'|'submit';
}
