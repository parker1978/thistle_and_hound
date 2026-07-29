import React from 'react';
export function Tag({children,onRemove,selected=false,onClick}){
  return React.createElement('span',{onClick,className:'th-tag',style:{display:'inline-flex',alignItems:'center',gap:6,padding:'6px 14px',borderRadius:'var(--radius-pill)',font:'var(--font-body-sm)',cursor:onClick?'pointer':'default',background:selected?'var(--color-primary)':'var(--color-surface-alt)',color:selected?'var(--color-text-on-primary)':'var(--color-text)',border:selected?'none':'var(--border-hairline)'}},
    children,
    onRemove && React.createElement('span',{onClick:e=>{e.stopPropagation();onRemove();},style:{opacity:0.7,fontSize:'12px',lineHeight:1}},'✕')
  );
}
