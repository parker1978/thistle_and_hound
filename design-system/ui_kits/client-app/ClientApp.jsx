function ClientMobileApp(){
  const [tab,setTab]=React.useState('home');
  const [detail,setDetail]=React.useState(false);
  const goTab=(t)=>{ setDetail(false); setTab(t); };
  const screen=detail?React.createElement(window.ApptScreen)
    :tab==='home'?React.createElement(window.HomeScreen,{onGoBook:()=>goTab('book'),onOpenAppt:()=>setDetail(true)})
    :tab==='book'?React.createElement(window.BookScreen,{onConfirmed:()=>goTab('home')})
    :tab==='pets'?React.createElement(window.PetsScreen)
    :React.createElement(window.ProfileScreen);
  return React.createElement('div',{style:{width:390,height:780,margin:'20px auto',background:'var(--color-page)',borderRadius:32,overflow:'hidden',boxShadow:'var(--shadow-lg)',display:'flex',flexDirection:'column',border:'8px solid var(--ink)'}},
    React.createElement(window.StatusBar),
    React.createElement(window.TopBar,{title:detail?'Your visit':'Thistle & Hound'}),
    React.createElement('div',{style:{flex:1,overflowY:'auto'}},screen),
    React.createElement(window.TabBar,{tab,onChange:goTab})
  );
}
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(ClientMobileApp));
