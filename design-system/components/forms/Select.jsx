import React from 'react';
export function Select({label,value,onChange,options=[],placeholder='Select…'}){
  return React.createElement('label',{style:{display:'flex',flexDirection:'column',gap:6,font:'var(--font-body-sm)'}},
    label && React.createElement('span',{style:{font:'var(--font-label)',color:'var(--color-text-soft)'}},label),
    React.createElement('select',{value:value||'',onChange:e=>onChange&&onChange(e.target.value),style:{font:'var(--font-body-md)',padding:'11px 14px',borderRadius:'var(--radius-md)',border:'var(--border-hairline)',background:'var(--color-surface)',color:'var(--color-text)'}},
      React.createElement('option',{value:'',disabled:true},placeholder),
      options.map(o=>React.createElement('option',{key:o.value,value:o.value},o.label))
    )
  );
}
