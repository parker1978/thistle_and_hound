import React from 'react';
export function Badge({children,tone='neutral'}){
  const map={neutral:{bg:'var(--color-surface-alt)',fg:'var(--color-text-soft)'},success:{bg:'var(--color-success-soft)',fg:'var(--color-success)'},warning:{bg:'var(--color-warning-soft)',fg:'var(--color-warning)'},danger:{bg:'var(--color-danger-soft)',fg:'var(--color-danger)'},info:{bg:'var(--color-info-soft)',fg:'var(--color-info)'},accent:{bg:'var(--color-accent-soft)',fg:'var(--plum-700)'}};
  const c=map[tone]||map.neutral;
  return React.createElement('span',{style:{display:'inline-flex',alignItems:'center',padding:'3px 10px',borderRadius:'var(--radius-pill)',font:'var(--font-caption)',fontWeight:'var(--weight-medium)',background:c.bg,color:c.fg}},children);
}
