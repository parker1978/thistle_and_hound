const {Button}=window.ThistleHoundDesignSystem_3b75c8;
function WebsiteIcon({name,size=20,tone}){
  const style={width:size,height:size,display:'block'};
  if(tone==='light') style.filter='brightness(0) invert(1)';
  return React.createElement('img',{src:`https://unpkg.com/lucide-static@latest/icons/${name}.svg`,style,alt:''});
}
function Header({onBook}){
  return React.createElement('header',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 40px',borderBottom:'var(--border-hairline)',background:'var(--color-surface)',position:'sticky',top:0,zIndex:10}},
    React.createElement('div',{style:{display:'flex',alignItems:'center',gap:10}},
      React.createElement('img',{src:'../../assets/logo/thistle-and-hound-mark-transparent.png',style:{height:40}}),
      React.createElement('span',{style:{font:'var(--font-display-sm)',color:'var(--color-text)'}},'Thistle & Hound')
    ),
    React.createElement('nav',{style:{display:'flex',gap:28,font:'var(--font-label)',color:'var(--color-text-soft)'}},
      React.createElement('a',{href:'#services',style:{color:'inherit',textDecoration:'none'}},'Services'),
      React.createElement('a',{href:'#how',style:{color:'inherit',textDecoration:'none'}},'How it works'),
      React.createElement('a',{href:'#reviews',style:{color:'inherit',textDecoration:'none'}},'Reviews')
    ),
    React.createElement(Button,{variant:'primary',onClick:onBook},'Book a visit')
  );
}
function Footer(){
  return React.createElement('footer',{style:{background:'var(--green-800)',color:'var(--sand-100)',padding:'48px 40px',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:24}},
    React.createElement('div',{style:{display:'flex',alignItems:'center',gap:10}},
      React.createElement('img',{src:'../../assets/logo/thistle-and-hound-mark-transparent.png',style:{height:36,filter:'brightness(0) invert(1)'}}),
      React.createElement('span',{style:{font:'var(--font-display-sm)'}},'Thistle & Hound')
    ),
    React.createElement('div',{style:{font:'var(--font-body-sm)',opacity:0.85}},'Kind care. Zero car rides.'),
    React.createElement('div',{style:{font:'var(--font-body-sm)',opacity:0.85}},'© 2026 Thistle & Hound Mobile Pet Care')
  );
}
window.WebsiteIcon=WebsiteIcon;window.Header=Header;window.Footer=Footer;
