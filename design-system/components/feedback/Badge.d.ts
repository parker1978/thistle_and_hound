import type { ReactNode } from 'react';
export interface BadgeProps{ children: ReactNode; tone?: 'neutral'|'success'|'warning'|'danger'|'info'|'accent'; }
