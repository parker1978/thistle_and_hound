import React from 'react';
export function Toast({tone='neutral',title,description,onDismiss}){
  const accent={neutral:'var(--color-primary)',success:'var(--color-success)',warning:'var(--color-warning)',danger:'var(--color-danger)'}[tone]||'var(--color-primary)';
  return React.createElement('div',{role:'status',style:{display:'flex',gap:12,alignItems:'flex-start',background:'var(--color-surface)',borderRadius:'var(--radius-md)',boxShadow:'var(--shadow-lg)',padding:'14px 16px',maxWidth:360,borderLeft:`3px solid ${accent}`}},
    React.createElement('div',{style:{flex:1}},
      React.createElement('div',{style:{font:'var(--font-label)',color:'var(--color-text)'}},title),
      description && React.createElement('div',{style:{font:'var(--font-body-sm)',color:'var(--color-text-soft)',marginTop:2}},description)
    ),
    onDismiss && React.createElement('span',{onClick:onDismiss,style:{cursor:'pointer',color:'var(--color-text-faint)',fontSize:14}},'✕')
  );
}
