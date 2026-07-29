import React from 'react';
export function Dialog({open,title,children,onClose,footer}){
  if(!open) return null;
  return React.createElement('div',{style:{position:'fixed',inset:0,background:'oklch(20% 0.02 165 / 0.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100},onClick:onClose},
    React.createElement('div',{onClick:e=>e.stopPropagation(),style:{background:'var(--color-surface)',borderRadius:'var(--radius-lg)',boxShadow:'var(--shadow-lg)',padding:24,width:400,maxWidth:'90vw'}},
      React.createElement('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}},
        React.createElement('div',{style:{font:'var(--font-display-sm)',color:'var(--color-text)'}},title),
        React.createElement('span',{onClick:onClose,style:{cursor:'pointer',color:'var(--color-text-faint)'}},'✕')
      ),
      React.createElement('div',{style:{font:'var(--font-body-md)',color:'var(--color-text-soft)'}},children),
      footer && React.createElement('div',{style:{display:'flex',justifyContent:'flex-end',gap:10,marginTop:20}},footer)
    )
  );
}
