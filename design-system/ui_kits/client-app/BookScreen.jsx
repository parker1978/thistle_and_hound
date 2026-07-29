const {Radio,Select,Button,Input}=window.ThistleHoundDesignSystem_3b75c8;
const SERVICES=[{id:'bath',name:'Bath & Brush',price:'$65'},{id:'full',name:'Full Groom',price:'$95'},{id:'nails',name:'Nail Trim',price:'$20'},{id:'deshed',name:'De-shed Treatment',price:'$55'}];
function BookScreen({onConfirmed}){
  const [step,setStep]=React.useState(1);
  const [service,setService]=React.useState('full');
  const [date,setDate]=React.useState('');
  const [time,setTime]=React.useState('');
  if(step===3){
    return React.createElement('div',{style:{padding:'40px 24px',textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',gap:14}},
      React.createElement('div',{style:{width:64,height:64,borderRadius:'50%',background:'var(--color-success-soft)',display:'flex',alignItems:'center',justifyContent:'center'}},React.createElement(window.AppIcon,{name:'check',size:28,tone:'primary'})),
      React.createElement('div',{style:{font:'var(--font-display-sm)',color:'var(--color-text)'}},'Visit booked'),
      React.createElement('div',{style:{font:'var(--font-body-sm)',color:'var(--color-text-soft)'}},"We'll text you the morning of your visit."),
      React.createElement(Button,{variant:'primary',onClick:()=>{setStep(1);onConfirmed&&onConfirmed();}},'Back to home')
    );
  }
  return React.createElement('div',{style:{padding:'18px 18px 100px',display:'flex',flexDirection:'column',gap:18}},
    React.createElement('div',{style:{font:'var(--font-display-sm)',color:'var(--color-text)'}},step===1?'Choose a service':'Pick a time'),
    step===1 && React.createElement('div',{style:{display:'flex',flexDirection:'column',gap:12}},
      SERVICES.map(s=>React.createElement(Radio,{key:s.id,name:'svc',label:`${s.name} — ${s.price}`,checked:service===s.id,onChange:()=>setService(s.id)}))
    ),
    step===2 && React.createElement('div',{style:{display:'flex',flexDirection:'column',gap:14}},
      React.createElement(Select,{label:'Date',placeholder:'Choose a date',value:date,onChange:setDate,options:[{value:'mon',label:'Monday, Aug 3'},{value:'tue',label:'Tuesday, Aug 4'},{value:'wed',label:'Wednesday, Aug 5'}]}),
      React.createElement(Select,{label:'Arrival window',placeholder:'Choose a time',value:time,onChange:setTime,options:[{value:'am',label:'9 – 11am'},{value:'mid',label:'11am – 1pm'},{value:'pm',label:'2 – 4pm'}]})
    ),
    React.createElement('div',{style:{position:'fixed',left:0,right:0,bottom:70,padding:'0 18px'}},
      React.createElement(Button,{variant:'primary',size:'lg',onClick:()=>setStep(step<2?2:3)},step<2?'Continue':'Confirm booking')
    )
  );
}
window.BookScreen=BookScreen;
