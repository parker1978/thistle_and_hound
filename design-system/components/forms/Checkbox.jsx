import React from 'react';
export function Checkbox({label,checked,onChange,disabled=false}){
  return React.createElement('label',{style:{display:'inline-flex',alignItems:'center',gap:10,cursor:disabled?'not-allowed':'pointer',opacity:disabled?0.5:1,font:'var(--font-body-sm)',color:'var(--color-text)'}},
    React.createElement('span',{onClick:()=>!disabled&&onChange&&onChange(!checked),style:{width:20,height:20,borderRadius:'6px',border:checked?'none':'var(--border-strong)',background:checked?'var(--color-primary)':'var(--color-surface)',display:'inline-flex',alignItems:'center',justifyContent:'center',transition:'background var(--duration-fast) var(--ease-standard)',flexShrink:0}},
      checked && React.createElement('svg',{width:12,height:9,viewBox:'0 0 12 9',fill:'none'},React.createElement('path',{d:'M1 4.5L4.2 7.5L11 1',stroke:'var(--color-text-on-primary)',strokeWidth:1.6,strokeLinecap:'round',strokeLinejoin:'round'}))
    ),
    label
  );
}
