import type { ReactNode } from 'react';
export interface TagProps{ children: ReactNode; onRemove?: () => void; selected?: boolean; onClick?: () => void; }
