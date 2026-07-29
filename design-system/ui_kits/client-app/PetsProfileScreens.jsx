const {Card,Avatar,Tag}=window.ThistleHoundDesignSystem_3b75c8;
function PetsScreen(){
  return React.createElement('div',{style:{padding:'18px 18px 100px',display:'flex',flexDirection:'column',gap:14}},
    React.createElement('div',{style:{font:'var(--font-display-sm)',color:'var(--color-text)'}},'My pets'),
    React.createElement(Card,null,
      React.createElement('div',{style:{display:'flex',gap:12,alignItems:'center'}},
        React.createElement(Avatar,{name:'Biscuit',size:48}),
        React.createElement('div',null,React.createElement('div',{style:{font:'var(--font-label)'}},'Biscuit'),React.createElement('div',{style:{font:'var(--font-caption)',color:'var(--color-text-faint)'}},'Corgi · 4 yrs'))
      ),
      React.createElement('div',{style:{display:'flex',gap:8,marginTop:12,flexWrap:'wrap'}},React.createElement(Tag,null,'Sensitive skin'),React.createElement(Tag,null,'Nervous around clippers'))
    ),
    React.createElement(Card,null,
      React.createElement('div',{style:{display:'flex',gap:12,alignItems:'center'}},
        React.createElement(Avatar,{name:'Cleo',size:48}),
        React.createElement('div',null,React.createElement('div',{style:{font:'var(--font-label)'}},'Cleo'),React.createElement('div',{style:{font:'var(--font-caption)',color:'var(--color-text-faint)'}},'Tabby cat · 2 yrs'))
      )
    )
  );
}
function ProfileScreen(){
  return React.createElement('div',{style:{padding:'18px 18px 100px',display:'flex',flexDirection:'column',gap:14}},
    React.createElement('div',{style:{display:'flex',alignItems:'center',gap:12}},
      React.createElement(Avatar,{name:'Jamie Rivera',size:56}),
      React.createElement('div',null,React.createElement('div',{style:{font:'var(--font-display-sm)'}},'Jamie Rivera'),React.createElement('div',{style:{font:'var(--font-caption)',color:'var(--color-text-faint)'}},'jamie@example.com'))
    ),
    React.createElement(Card,{padding:14},'123 Maple St., Portland'),
    React.createElement(Card,{padding:14},'Payment: •••• 4242')
  );
}
Object.assign(window,{PetsScreen,ProfileScreen});
