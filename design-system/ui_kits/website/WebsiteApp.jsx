function WebsiteApp(){
  const [bookingOpen,setBookingOpen]=React.useState(false);
  const [initialService,setInitialService]=React.useState('bath');
  const openBooking=(svc)=>{ setInitialService(svc||'bath'); setBookingOpen(true); };
  return React.createElement('div',{style:{background:'var(--color-page)'}},
    React.createElement(window.Header,{onBook:()=>openBooking()}),
    React.createElement(window.Hero,{onBook:()=>openBooking()}),
    React.createElement(window.HowItWorks),
    React.createElement(window.Services,{onBook:openBooking}),
    React.createElement(window.Testimonials),
    React.createElement(window.Footer),
    React.createElement(window.BookingFlow,{open:bookingOpen,initialService,onClose:()=>setBookingOpen(false)})
  );
}
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(WebsiteApp));
