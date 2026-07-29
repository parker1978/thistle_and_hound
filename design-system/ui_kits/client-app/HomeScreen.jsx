const {Card,Badge,Avatar,Button}=window.ThistleHoundDesignSystem_3b75c8;
const {Icon}=({Icon:window.AppIcon});
function HomeScreen({onGoBook,onOpenAppt}){
  return React.createElement('div',{style:{padding:'18px 18px 90px',display:'flex',flexDirection:'column',gap:18}},
    React.createElement('div',{style:{font:'var(--font-body-sm)',color:'var(--color-text-soft)'}},'Good afternoon, Jamie'),
    React.createElement(Card,{interactive:true,onClick:onOpenAppt},
      React.createElement('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}},
        React.createElement('div',null,
          React.createElement('div',{style:{font:'var(--font-eyebrow)',color:'var(--color-text-faint)',textTransform:'uppercase',letterSpacing:'var(--tracking-badge)'}},'Next visit'),
          React.createElement('div',{style:{font:'var(--font-display-sm)',color:'var(--color-text)',margin:'6px 0 2px'}},'Full Groom — Biscuit'),
          React.createElement('div',{style:{font:'var(--font-body-sm)',color:'var(--color-text-soft)'}},'Wed, Aug 5 · 11am – 1pm')
        ),
        React.createElement(Badge,{tone:'success'},'Confirmed')
      ),
      React.createElement('div',{style:{display:'flex',alignItems:'center',gap:10,marginTop:16,paddingTop:16,borderTop:'var(--border-hairline)'}},
        React.createElement(Avatar,{name:'Marisol Ortiz',size:40}),
        React.createElement('div',null,
          React.createElement('div',{style:{font:'var(--font-label)'}},'Marisol Ortiz'),
          React.createElement('div',{style:{font:'var(--font-caption)',color:'var(--color-text-faint)'}},'Your groomer')
        )
      )
    ),
    React.createElement('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}},
      React.createElement(Card,{interactive:true,onClick:onGoBook,padding:16},React.createElement(Icon,{name:'calendar-plus',size:22}),React.createElement('div',{style:{font:'var(--font-label)',marginTop:8}},'Book a visit')),
      React.createElement(Card,{interactive:true,padding:16},React.createElement(Icon,{name:'paw-print',size:22}),React.createElement('div',{style:{font:'var(--font-label)',marginTop:8}},'My pets'))
    ),
    React.createElement('div',null,
      React.createElement('div',{style:{font:'var(--font-label)',color:'var(--color-text-soft)',marginBottom:10}},'Past visits'),
      React.createElement(Card,{padding:14,style:{marginBottom:10}},React.createElement('div',{style:{display:'flex',justifyContent:'space-between'}},React.createElement('span',{style:{font:'var(--font-body-sm)'}},'Bath & Brush — Biscuit'),React.createElement('span',{style:{font:'var(--font-caption)',color:'var(--color-text-faint)'}},'Jul 12')))
    )
  );
}
window.HomeScreen=HomeScreen;
