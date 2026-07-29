import React from 'react';
export function Tabs({tabs=[],active,onChange}){
  return React.createElement('div',{style:{display:'flex',gap:24,borderBottom:'var(--border-hairline)'}},
    tabs.map(t=>React.createElement('button',{key:t.value,onClick:()=>onChange&&onChange(t.value),className:'th-tab',style:{background:'none',border:'none',cursor:'pointer',padding:'10px 2px',font:'var(--font-label)',color:active===t.value?'var(--color-primary)':'var(--color-text-soft)',borderBottom:active===t.value?'2px solid var(--color-primary)':'2px solid transparent',marginBottom:-1}},t.label))
  );
}
