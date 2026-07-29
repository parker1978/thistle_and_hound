import React from 'react';
export function Rating({value=0,max=5,size=16}){
  const stars=[];
  for(let i=1;i<=max;i++){
    const filled=i<=Math.round(value);
    stars.push(React.createElement('svg',{key:i,width:size,height:size,viewBox:'0 0 20 20',fill:filled?'var(--color-accent)':'var(--sand-300)'},React.createElement('path',{d:'M10 1.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L1 7.8l6.1-.7z'})));
  }
  return React.createElement('span',{style:{display:'inline-flex',alignItems:'center',gap:3}},stars,React.createElement('span',{style:{font:'var(--font-caption)',color:'var(--color-text-soft)',marginLeft:4}},value.toFixed(1)));
}
