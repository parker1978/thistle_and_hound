import React from 'react';
const SIZES={sm:{padY:8,padX:14,font:'var(--font-label)'},md:{padY:11,padX:20,font:'var(--font-label)'},lg:{padY:14,padX:26,font:'var(--font-body-md)'}};
export function Button({variant='primary',size='md',disabled=false,icon=null,children,onClick,type='button'}){
  const s=SIZES[size]||SIZES.md;
  const cls=`th-btn th-btn--${variant}`;
  return React.createElement('button',{type,disabled,onClick,className:cls,style:{display:'inline-flex',alignItems:'center',justifyContent:'center',gap:8,padding:`${s.padY}px ${s.padX}px`,font:s.font,letterSpacing:'var(--tracking-wide)',border:variant==='secondary'?'var(--border-strong)':'none',borderRadius:'var(--radius-md)',cursor:disabled?'not-allowed':'pointer',opacity:disabled?0.45:1,transition:`background var(--duration-base) var(--ease-standard), color var(--duration-base) var(--ease-standard), transform var(--duration-fast) var(--ease-standard)`}},icon,children);
}
