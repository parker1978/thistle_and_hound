import React from 'react';
export function Switch({label,checked,onChange,disabled=false}){
  return React.createElement('label',{style:{display:'inline-flex',alignItems:'center',gap:10,cursor:disabled?'not-allowed':'pointer',opacity:disabled?0.5:1,font:'var(--font-body-sm)',color:'var(--color-text)'}},
    React.createElement('span',{onClick:()=>!disabled&&onChange&&onChange(!checked),style:{width:40,height:24,borderRadius:'var(--radius-pill)',background:checked?'var(--color-primary)':'var(--sand-300)',position:'relative',transition:'background var(--duration-base) var(--ease-standard)',flexShrink:0}},
      React.createElement('span',{style:{position:'absolute',top:3,left:checked?19:3,width:18,height:18,borderRadius:'50%',background:'#fff',boxShadow:'var(--shadow-sm)',transition:'left var(--duration-base) var(--ease-standard)'}})
    ),
    label
  );
}
