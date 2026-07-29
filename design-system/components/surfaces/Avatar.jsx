import React from 'react';
export function Avatar({src,name='',size=44}){
  const initials=name.split(' ').filter(Boolean).slice(0,2).map(n=>n[0].toUpperCase()).join('');
  return src
    ? React.createElement('img',{src,alt:name,style:{width:size,height:size,borderRadius:'50%',objectFit:'cover',border:'var(--border-hairline)'}})
    : React.createElement('span',{style:{width:size,height:size,borderRadius:'50%',background:'var(--color-primary-soft)',color:'var(--color-primary)',display:'inline-flex',alignItems:'center',justifyContent:'center',font:'var(--font-label)',fontSize:size*0.38}},initials);
}
