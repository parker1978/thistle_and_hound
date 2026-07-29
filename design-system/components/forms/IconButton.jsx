import React from 'react';
export function IconButton({icon,label,variant='ghost',size=40,onClick,disabled=false}){
  return React.createElement('button',{type:'button',onClick,disabled,'aria-label':label,title:label,className:`th-iconbtn th-iconbtn--${variant}`,style:{width:size,height:size,display:'inline-flex',alignItems:'center',justifyContent:'center',borderRadius:'var(--radius-pill)',border:variant==='outline'?'var(--border-hairline)':'none',cursor:disabled?'not-allowed':'pointer',opacity:disabled?0.4:1,transition:`background var(--duration-base) var(--ease-standard)`}},icon);
}
