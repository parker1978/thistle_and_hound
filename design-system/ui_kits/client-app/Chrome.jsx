const {Badge,Card,Avatar,Rating,Button}=window.ThistleHoundDesignSystem_3b75c8;
function AppIcon({name,size=20,tone}){
  const style={width:size,height:size,display:'block'};
  if(tone==='light') style.filter='brightness(0) invert(1)';
  if(tone==='primary') style.filter='invert(28%) sepia(20%) saturate(900%) hue-rotate(65deg) brightness(90%)';
  return React.createElement('img',{src:`https://unpkg.com/lucide-static@latest/icons/${name}.svg`,style,alt:''});
}
function StatusBar(){
  return React.createElement('div',{style:{height:14}});
}
function TabBar({tab,onChange}){
  const tabs=[{v:'home',icon:'house',label:'Home'},{v:'book',icon:'calendar-plus',label:'Book'},{v:'pets',icon:'paw-print',label:'Pets'},{v:'profile',icon:'user',label:'Profile'}];
  return React.createElement('div',{style:{display:'flex',borderTop:'var(--border-hairline)',background:'var(--color-surface)',padding:'8px 0 14px'}},
    tabs.map(t=>React.createElement('div',{key:t.v,onClick:()=>onChange(t.v),style:{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4,cursor:'pointer',color:tab===t.v?'var(--color-primary)':'var(--color-text-faint)'}},
      React.createElement(AppIcon,{name:t.icon,size:22,tone:tab===t.v?'primary':undefined}),
      React.createElement('span',{style:{font:'var(--font-caption)'}},t.label)
    ))
  );
}
function TopBarInner({title}){
  return React.createElement('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 20px',background:'var(--color-surface)',borderBottom:'var(--border-hairline)'}},
    React.createElement('img',{src:'../../assets/logo/thistle-and-hound-mark-transparent.png',style:{height:28}}),
    React.createElement('span',{style:{font:'var(--font-display-sm)',color:'var(--color-text)'}},title),
    React.createElement(AppIcon,{name:'bell',size:20})
  );
}
Object.assign(window,{AppIcon,StatusBar,TopBar:TopBarInner,TabBar});
