const {Card,Badge,Avatar,Rating,Button}=window.ThistleHoundDesignSystem_3b75c8;
const {Icon}=({Icon:window.AppIcon});
function ApptScreen(){
  return React.createElement('div',{style:{padding:'18px 18px 100px',display:'flex',flexDirection:'column',gap:16}},
    React.createElement('image-slot',{id:'map',style:{width:'100%',height:160},shape:'rounded',radius:'16',placeholder:'Drop a photo of the groomer arriving at the door'}),
    React.createElement(Badge,{tone:'warning'},'Groomer en route · 12 min'),
    React.createElement(Card,null,
      React.createElement('div',{style:{display:'flex',alignItems:'center',gap:12}},
        React.createElement(Avatar,{name:'Marisol Ortiz',size:52}),
        React.createElement('div',{style:{flex:1}},
          React.createElement('div',{style:{font:'var(--font-label)'}},'Marisol Ortiz'),
          React.createElement(Rating,{value:4.9,size:14})
        ),
        React.createElement(Icon,{name:'phone',size:20,tone:'primary'})
      )
    ),
    React.createElement(Card,{padding:16},
      React.createElement('div',{style:{font:'var(--font-eyebrow)',color:'var(--color-text-faint)',textTransform:'uppercase',letterSpacing:'var(--tracking-badge)',marginBottom:8}},'Visit details'),
      React.createElement('div',{style:{font:'var(--font-body-sm)',color:'var(--color-text)'}},'Full Groom — Biscuit'),
      React.createElement('div',{style:{font:'var(--font-body-sm)',color:'var(--color-text-soft)'}},'Wed, Aug 5 · 11am – 1pm · 123 Maple St.')
    ),
    React.createElement(Button,{variant:'ghost'},'Reschedule or cancel')
  );
}
window.ApptScreen=ApptScreen;
