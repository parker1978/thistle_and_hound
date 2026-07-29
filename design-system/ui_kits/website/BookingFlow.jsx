const {Dialog,Button,Radio,Select,Input,Badge}=window.ThistleHoundDesignSystem_3b75c8;
function BookingFlow({open,initialService,onClose}){
  const [step,setStep]=React.useState(1);
  const [service,setService]=React.useState(initialService||'bath');
  const [date,setDate]=React.useState('');
  const [time,setTime]=React.useState('');
  const [name,setName]=React.useState('');
  const [phone,setPhone]=React.useState('');
  React.useEffect(()=>{ if(open){ setStep(1); setService(initialService||'bath'); } },[open,initialService]);
  const services=window.SERVICES||[];
  const chosen=services.find(s=>s.id===service);
  const titles={1:'Choose a service',2:'Pick a time',3:'Your details',4:'Confirmed'};
  return React.createElement(Dialog,{open,title:titles[step],onClose,footer:step<4?React.createElement(React.Fragment,null,
      step>1 && React.createElement(Button,{variant:'ghost',onClick:()=>setStep(step-1)},'Back'),
      React.createElement(Button,{variant:'primary',onClick:()=>step<3?setStep(step+1):setStep(4)},step<3?'Continue':'Confirm booking')
    ):React.createElement(Button,{variant:'primary',onClick:onClose},'Done')},
    step===1 && React.createElement('div',{style:{display:'flex',flexDirection:'column',gap:12}},
      services.map(s=>React.createElement(Radio,{key:s.id,name:'svc',label:`${s.name} — ${s.price}`,checked:service===s.id,onChange:()=>setService(s.id)}))
    ),
    step===2 && React.createElement('div',{style:{display:'flex',flexDirection:'column',gap:14}},
      React.createElement(Select,{label:'Date',placeholder:'Choose a date',value:date,onChange:setDate,options:[{value:'mon',label:'Monday, Aug 3'},{value:'tue',label:'Tuesday, Aug 4'},{value:'wed',label:'Wednesday, Aug 5'}]}),
      React.createElement(Select,{label:'Arrival window',placeholder:'Choose a time',value:time,onChange:setTime,options:[{value:'am',label:'9 – 11am'},{value:'mid',label:'11am – 1pm'},{value:'pm',label:'2 – 4pm'}]})
    ),
    step===3 && React.createElement('div',{style:{display:'flex',flexDirection:'column',gap:14}},
      React.createElement(Input,{label:"Your name",value:name,onChange:setName,placeholder:'Jamie Rivera'}),
      React.createElement(Input,{label:'Phone',type:'tel',value:phone,onChange:setPhone,placeholder:'(555) 010-0000'}),
      React.createElement(Input,{label:'Address',placeholder:'123 Maple St.'})
    ),
    step===4 && React.createElement('div',{style:{display:'flex',flexDirection:'column',gap:10}},
      React.createElement(Badge,{tone:'success'},'Confirmed'),
      React.createElement('div',{style:{font:'var(--font-body-md)',color:'var(--color-text)'}},chosen?`${chosen.name} — ${chosen.price}`:''),
      React.createElement('div',{style:{font:'var(--font-body-sm)',color:'var(--color-text-soft)'}},"We'll text you the morning of your visit.")
    )
  );
}
window.BookingFlow=BookingFlow;
