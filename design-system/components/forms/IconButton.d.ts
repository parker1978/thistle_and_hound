import type { ReactNode } from 'react';
export interface IconButtonProps{
  icon: ReactNode;
  label: string;
  variant?: 'ghost'|'outline'|'solid';
  size?: number;
  onClick?: () => void;
  disabled?: boolean;
}
