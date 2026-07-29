import React from 'react';
export function Card({children,interactive=false,padding=20,onClick}){
  return React.createElement('div',{onClick,className:`th-card${interactive?' th-card--interactive':''}`,style:{background:'var(--color-surface)',border:'var(--border-hairline)',borderRadius:'var(--radius-lg)',boxShadow:'var(--shadow-sm)',padding,cursor:interactive?'pointer':'default'}},children);
}
