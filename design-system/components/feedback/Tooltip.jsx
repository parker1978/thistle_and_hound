import React,{useState} from 'react';
export function Tooltip({label,children,side='top'}){
  const [open,setOpen]=useState(false);
  const pos={top:{bottom:'calc(100% + 8px)',left:'50%',transform:'translateX(-50%)'},bottom:{top:'calc(100% + 8px)',left:'50%',transform:'translateX(-50%)'}}[side]||{};
  return React.createElement('span',{style:{position:'relative',display:'inline-flex'},onMouseEnter:()=>setOpen(true),onMouseLeave:()=>setOpen(false)},
    children,
    React.createElement('span',{className:'th-tooltip',style:{position:'absolute',...pos,background:'var(--ink)',color:'var(--sand-50)',padding:'6px 10px',borderRadius:'var(--radius-sm)',font:'var(--font-caption)',whiteSpace:'nowrap',opacity:open?1:0,pointerEvents:'none',zIndex:20}},label)
  );
}
