import React from 'react';
export function Input({label,placeholder,type='text',value,onChange,helpText,error,disabled=false}){
  return React.createElement('label',{style:{display:'flex',flexDirection:'column',gap:6,font:'var(--font-body-sm)',color:'var(--color-text)'}},
    label && React.createElement('span',{style:{font:'var(--font-label)',color:'var(--color-text-soft)'}},label),
    React.createElement('input',{type,placeholder,value,disabled,onChange:e=>onChange&&onChange(e.target.value),className:'th-input',style:{font:'var(--font-body-md)',padding:'11px 14px',borderRadius:'var(--radius-md)',border:error?'1.5px solid var(--color-danger)':'var(--border-hairline)',background:disabled?'var(--color-surface-alt)':'var(--color-surface)',color:'var(--color-text)',outline:'none'}}),
    (helpText||error) && React.createElement('span',{style:{font:'var(--font-caption)',color:error?'var(--color-danger)':'var(--color-text-faint)'}},error||helpText)
  );
}
