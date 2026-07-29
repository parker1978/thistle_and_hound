const {Card,Badge,Rating,Avatar,Button}=window.ThistleHoundDesignSystem_3b75c8;
const Icon=window.WebsiteIcon;
function Hero({onBook}){
  return React.createElement('section',{style:{display:'grid',gridTemplateColumns:'minmax(320px,1fr) minmax(280px,1fr)',gap:48,alignItems:'center',padding:'72px 40px',maxWidth:'var(--container-max)',margin:'0 auto',boxSizing:'border-box'}},
    React.createElement('div',{style:{minWidth:0}},
      React.createElement('div',{style:{font:'var(--font-eyebrow)',color:'var(--color-accent)',letterSpacing:'var(--tracking-badge)',textTransform:'uppercase',marginBottom:14}},'Mobile pet care'),
      React.createElement('h1',{style:{fontFamily:'var(--font-display)',fontWeight:'var(--weight-regular)',lineHeight:'var(--leading-tight)',fontSize:'clamp(36px,5vw,88px)',color:'var(--color-text)',margin:'0 0 18px'}},'Kind care, at home.'),
      React.createElement('p',{style:{font:'var(--font-body-lg)',color:'var(--color-text-soft)',maxWidth:460,margin:'0 0 28px'}},"Zero car rides. Zero waiting rooms. Your groomer comes to you for a calm, one-on-one visit your dog or cat won't dread."),
      React.createElement('div',{style:{display:'flex',gap:14}},
        React.createElement(Button,{variant:'primary',size:'lg',onClick:onBook},'Book a visit'),
        React.createElement(Button,{variant:'ghost',size:'lg'},'Meet our groomers')
      )
    ),
    React.createElement('image-slot',{id:'hero-photo',style:{width:'100%',height:420},shape:'rounded',radius:'24',placeholder:'Drop a photo: groomer grooming a dog inside a client home'})
  );
}
function HowItWorks(){
  const steps=[{icon:'calendar-check',title:'Book your visit',body:'Pick a service and a time that works for you.'},{icon:'house',title:'We come to you',body:'A fully-equipped groomer arrives at your door.'},{icon:'heart-handshake',title:'Calm, one-on-one care',body:'No cages, no other animals, no rushed goodbye.'}];
  return React.createElement('section',{id:'how',style:{padding:'64px 40px',maxWidth:'var(--container-max)',margin:'0 auto'}},
    React.createElement('h2',{style:{font:'var(--font-display-md)',color:'var(--color-text)',textAlign:'center',margin:'0 0 40px'}},'How it works'),
    React.createElement('div',{style:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:32}},
      steps.map((s,i)=>React.createElement('div',{key:i,style:{textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',gap:14}},
        React.createElement('div',{style:{width:56,height:56,borderRadius:'var(--radius-pill)',background:'var(--color-primary-soft)',display:'flex',alignItems:'center',justifyContent:'center'}},React.createElement(Icon,{name:s.icon,size:26})),
        React.createElement('div',{style:{font:'var(--font-display-sm)',color:'var(--color-text)'}},s.title),
        React.createElement('div',{style:{font:'var(--font-body-sm)',color:'var(--color-text-soft)',maxWidth:220}},s.body)
      ))
    )
  );
}
const SERVICES=[{id:'bath',name:'Bath & Brush',price:'$65',icon:'droplets',desc:'A gentle wash, blow-dry and brush-out.'},{id:'full',name:'Full Groom',price:'$95',icon:'scissors',desc:'Bath, cut, nails and ears — nose to tail.'},{id:'nails',name:'Nail Trim',price:'$20',icon:'hand',desc:'A quick, calm trim — no restraint tables.'},{id:'deshed',name:'De-shed Treatment',price:'$55',icon:'sparkles',desc:'Deep de-shedding for heavy coats.'}];
function Services({onBook}){
  return React.createElement('section',{id:'services',style:{padding:'64px 40px',background:'var(--color-surface-sunken)'}},
    React.createElement('div',{style:{maxWidth:'var(--container-max)',margin:'0 auto'}},
      React.createElement('h2',{style:{font:'var(--font-display-md)',color:'var(--color-text)',textAlign:'center',margin:'0 0 40px'}},'Services'),
      React.createElement('div',{style:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:20}},
        SERVICES.map(s=>React.createElement(Card,{key:s.id,interactive:true,onClick:()=>onBook(s.id)},
          React.createElement(Icon,{name:s.icon,size:24}),
          React.createElement('div',{style:{font:'var(--font-display-sm)',color:'var(--color-text)',margin:'12px 0 6px'}},s.name),
          React.createElement('div',{style:{font:'var(--font-body-sm)',color:'var(--color-text-soft)',minHeight:40}},s.desc),
          React.createElement('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:14}},
            React.createElement('span',{style:{font:'var(--font-label)',color:'var(--color-primary)'}},s.price),
            React.createElement(Button,{size:'sm',variant:'secondary'},'Book')
          )
        ))
      )
    )
  );
}
const REVIEWS=[{name:'Priya N.',pet:'Milo, Golden Retriever',quote:"Milo shakes at the vet. He fell asleep mid-groom on our living room floor.",rating:5},{name:'Devon R.',pet:'Cleo, Tabby Cat',quote:'No carrier, no car, no stress. Cleo barely noticed she was groomed.',rating:5},{name:'Amara S.',pet:'Biscuit, Corgi',quote:'On time, kind, and thorough. Our new normal for grooming.',rating:4.9}];
function Testimonials(){
  return React.createElement('section',{id:'reviews',style:{padding:'64px 40px',maxWidth:'var(--container-max)',margin:'0 auto'}},
    React.createElement('h2',{style:{font:'var(--font-display-md)',color:'var(--color-text)',textAlign:'center',margin:'0 0 40px'}},'What clients say'),
    React.createElement('div',{style:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20}},
      REVIEWS.map((r,i)=>React.createElement(Card,{key:i},
        React.createElement(Rating,{value:r.rating}),
        React.createElement('p',{style:{font:'var(--font-body-md)',color:'var(--color-text)',margin:'12px 0 16px'}},'"',r.quote,'"'),
        React.createElement('div',{style:{display:'flex',alignItems:'center',gap:10}},
          React.createElement(Avatar,{name:r.name,size:36}),
          React.createElement('div',null,
            React.createElement('div',{style:{font:'var(--font-label)',color:'var(--color-text)'}},r.name),
            React.createElement('div',{style:{font:'var(--font-caption)',color:'var(--color-text-faint)'}},r.pet)
          )
        )
      ))
    )
  );
}
Object.assign(window,{Hero,HowItWorks,Services,Testimonials,SERVICES});
