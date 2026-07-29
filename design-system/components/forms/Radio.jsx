import React from 'react';
export function Radio({label,checked,onChange,name,disabled=false}){
  return React.createElement('label',{style:{display:'inline-flex',alignItems:'center',gap:10,cursor:disabled?'not-allowed':'pointer',opacity:disabled?0.5:1,font:'var(--font-body-sm)',color:'var(--color-text)'}},
    React.createElement('input',{type:'radio',name,checked,disabled,onChange:()=>onChange&&onChange(),style:{display:'none'}}),
    React.createElement('span',{onClick:()=>!disabled&&onChange&&onChange(),style:{width:20,height:20,borderRadius:'50%',border:checked?'6px solid var(--color-primary)':'var(--border-strong)',background:'var(--color-surface)',transition:'border var(--duration-fast) var(--ease-standard)',flexShrink:0}}),
    label
  );
}
