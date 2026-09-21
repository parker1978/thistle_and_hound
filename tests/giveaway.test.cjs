const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const source = fs.readFileSync(path.join(__dirname,'../google-apps-script/Code.gs'),'utf8');

function fixture() {
  let now = Date.parse('2026-09-26T12:00:00-05:00');
  let held = false;
  let failWrite = null;
  const props = {};
  class Sheet {
    constructor(name) { this.name=name; this.data=[]; }
    getLastRow() { return this.data.length; }
    getLastColumn() { return this.data[0]?.length || 0; }
    setFrozenRows() {} setColumnWidths() {}
    getRange(row,col,count=1,width=1) {
      const sheet=this;
      const range={
        setValues(values) {
          if (failWrite && failWrite(sheet.name,row,col)) { failWrite=null; throw new Error('Simulated write failure'); }
          values.forEach((r,i) => { sheet.data[row+i-1] ||= []; r.forEach((v,j) => sheet.data[row+i-1][col+j-1] = typeof v==='string' && v.startsWith("'") ? v.slice(1) : v); }); return range;
        },
        getValues: () => Array.from({length:count},(_,i)=>Array.from({length:width},(_,j)=>sheet.data[row+i-1]?.[col+j-1] ?? '')),
        setValue(value) { return range.setValues([[value]]); },
        getValue() { return range.getValues()[0][0]; },
        setNumberFormat() { return range; },setBackground() { return range; },setFontColor() { return range; },setFontWeight() { return range; }
      }; return range;
    }
  }
  const sheets={};
  const book={getId:()=> 'private-sheet',getUrl:()=> 'https://docs.google.com/spreadsheets/d/private-sheet',setSpreadsheetTimeZone(){},getSheetByName:name=>sheets[name],insertSheet:name=>(sheets[name]=new Sheet(name))};
  class Clock extends Date { static now(){return now;} }
  const context=vm.createContext({
    Date:Clock,console:{log(){}},
    PropertiesService:{getScriptProperties:()=>({getProperty:key=>props[key],setProperty(key,value){props[key]=value;}})},
    SpreadsheetApp:{create:()=>book,openById:()=>book,flush(){}},
    LockService:{getScriptLock:()=>({waitLock(){assert.equal(held,false);held=true;},tryLock(){if(held)return false;held=true;return true;},releaseLock(){held=false;}})},
    Utilities:{getUuid:crypto.randomUUID,computeHmacSha256Signature:(value,secret)=>crypto.createHmac('sha256',secret).update(value).digest(),base64EncodeWebSafe:value=>Buffer.from(value).toString('base64url')}
  });
  vm.runInContext(source,context);
  context.setupGiveaway_();
  const eventId='marge-durham-dog-fest-2026';
  const input=(overrides={})=>{
    const token=context.getEvent(overrides.eventId || eventId).token;
    now+=2000;
    return {eventId,token,name:'Taylor Example',email:'taylor@example.com',phone:'402-555-0123',city:'Omaha',zip:'68102',petName:'Maple',breed:'Mixed breed',size:'medium',otherPets:'',rulesAccepted:true,emailOptIn:false,smsOptIn:false,...overrides};
  };
  return {context,sheets,input,eventId,setNow:value=>now=Date.parse(value),fail:predicate=>failWrite=predicate,get held(){return held;}};
}
test('creates a reusable private workbook; setup is idempotent',()=>{
  const f=fixture();f.context.setupGiveaway_();assert.equal(f.sheets.Events.data.length,2);assert.equal(f.sheets.Customers.data.length,1);assert.equal(f.sheets.Entries.data.length,1);
});
test('new registration stores contact, pet, event and independent consent',()=>{
  const f=fixture();assert.equal(f.context.submitEntry(f.input({smsOptIn:true})).ok,true);
  const c=f.sheets.Customers.data[1],e=f.sheets.Entries.data[1];assert.equal(c[3],'taylor@example.com');assert.equal(c[4],'+14025550123');assert.equal(c[7],'');assert.ok(c[8]);assert.equal(e[1],f.eventId);assert.equal(e[3],c[0]);assert.equal(e[5],'Maple');assert.equal(e[9],false);assert.equal(e[10],true);assert.match(e[13],/STOP/);assert.equal(f.held,false);
});
test('same event plus normalized email and phone counts once, with no consent mutation',()=>{
  const f=fixture();f.context.submitEntry(f.input());f.context.submitEntry(f.input({email:' TAYLOR@example.com ',phone:'+1 (402) 555-0123',emailOptIn:true}));assert.equal(f.sheets.Customers.data.length,2);assert.equal(f.sheets.Entries.data.length,2);assert.equal(f.sheets.Customers.data[1][7],'');
});
test('same customer can enter a second event without a second customer row',()=>{
  const f=fixture();f.context.submitEntry(f.input({emailOptIn:true}));const second=[...f.sheets.Events.data[1]];second[0]='next-event';second[1]='Next event';f.sheets.Events.data.push(second);assert.equal(f.context.submitEntry(f.input({eventId:'next-event',petName:'Poppy'})).ok,true);assert.equal(f.sheets.Customers.data.length,2);assert.equal(f.sheets.Entries.data.length,3);assert.equal(f.sheets.Entries.data[2][3],f.sheets.Customers.data[1][0]);assert.ok(f.sheets.Customers.data[1][7]);
});
test('conflicting or changed contacts are not merged or overwritten',()=>{
  const f=fixture();f.context.submitEntry(f.input());f.context.submitEntry(f.input({email:'other@example.com',phone:'5315550124',name:'Other Example'}));assert.equal(f.context.submitEntry(f.input({email:'taylor@example.com',phone:'5315550124'})).ok,false);assert.equal(f.context.submitEntry(f.input({phone:'4025550129'})).ok,false);assert.equal(f.sheets.Customers.data.length,3);assert.equal(f.sheets.Entries.data.length,3);
});
test('server rejects invalid fields, absent agreement and honeypot',()=>{
  const f=fixture();for(const override of [{email:'bad'},{phone:'123'},{zip:'none'},{petName:''},{size:'huge'},{rulesAccepted:'true'},{name:'a'.repeat(101)},{website:'bot'}])assert.equal(f.context.submitEntry(f.input(override)).ok,false);assert.equal(f.sheets.Customers.data.length,1);
});
test('only explicit boolean true opts in',()=>{
  const f=fixture();f.context.submitEntry(f.input({emailOptIn:'yes',smsOptIn:'false'}));assert.equal(f.sheets.Entries.data[1][9],false);assert.equal(f.sheets.Entries.data[1][10],false);
});
test('deadline is enforced on the server, including a form opened before closing',()=>{
  const f=fixture();f.setNow('2026-09-27T15:29:00-05:00');const p=f.input();f.setNow('2026-09-27T15:30:00-05:00');assert.equal(f.context.submitEntry(p).ok,false);assert.equal(f.context.getEvent(f.eventId).available,false);assert.equal(f.sheets.Entries.data.length,1);
});
test('unknown, future, paused and malformed events fail closed',()=>{
  const f=fixture();assert.equal(f.context.getEvent('unknown').available,false);f.sheets.Events.data[1][7]='paused';assert.equal(f.context.getEvent(f.eventId).available,false);f.sheets.Events.data[1][7]='open';f.setNow('2026-09-20T12:00:00Z');assert.equal(f.context.getEvent(f.eventId).available,false);f.sheets.Events.data[1][3]='bad date';assert.equal(f.context.getEvent(f.eventId).available,false);
});
test('tampered, expired and stale-rule tokens cannot submit',()=>{
  const f=fixture();assert.equal(f.context.submitEntry(f.input({token:'not-a-token'})).ok,false);const p=f.input();f.setNow('2026-09-26T18:00:00-05:00');assert.equal(f.context.submitEntry(p).ok,false);const q=f.input();f.sheets.Events.data[1][6]+=' Updated rules.';assert.equal(f.context.submitEntry(q).ok,false);
});
test('formula injection is escaped, leading zero ZIP survives',()=>{
  const f=fixture();assert.equal(f.context.cell_('=IMPORTXML("bad")'),"'=IMPORTXML(\"bad\")");assert.equal(f.context.cell_(' +formula'),"' +formula");assert.equal(f.context.submitEntry(f.input({name:'=1+1',zip:'00501'})).ok,true);assert.equal(f.sheets.Customers.data[1][6],'00501');
});
test('retries recover a partial customer write without adding duplicate customers',()=>{
  const f=fixture();const p=f.input();f.fail((name,row)=>name==='Entries'&&row===2);assert.throws(()=>f.context.submitEntry(p),/Simulated/);assert.equal(f.held,false);assert.equal(f.context.submitEntry(p).ok,true);assert.equal(f.sheets.Customers.data.length,2);assert.equal(f.sheets.Entries.data.length,2);
});
test('retries repair consent audit projection after an interrupted entry write',()=>{
  const f=fixture();const p=f.input({emailOptIn:true});f.fail((name,row,col)=>name==='Customers'&&row===2&&col===8);assert.throws(()=>f.context.submitEntry(p),/Simulated/);assert.equal(f.context.submitEntry(p).ok,true);assert.ok(f.sheets.Customers.data[1][7]);assert.equal(f.sheets.Entries.data.length,2);
});
test('manual unsubscribe suppression survives future registrations',()=>{
  const f=fixture();f.context.submitEntry(f.input({smsOptIn:true}));f.sheets.Customers.data[1][10]='yes';const second=[...f.sheets.Events.data[1]];second[0]='next';f.sheets.Events.data.push(second);f.context.submitEntry(f.input({eventId:'next',smsOptIn:true}));assert.equal(f.sheets.Customers.data[1][10],'yes');
});
test('public reads never reveal customer data or spreadsheet identifiers',()=>{
  const f=fixture();f.context.submitEntry(f.input());const response=JSON.stringify(f.context.getEvent(f.eventId));assert.doesNotMatch(response,/taylor|private-sheet|customer_id/);
});

test('retry recovers consent when Google Sheets returns plain-text booleans',()=>{
  const f=fixture();const p=f.input({emailOptIn:true});
  f.fail((name,row,col)=>name==='Customers'&&row===2&&col===8);
  assert.throws(()=>f.context.submitEntry(p),/Simulated/);
  f.sheets.Entries.data[1][9]='true';f.sheets.Entries.data[1][10]='false';
  assert.equal(f.context.submitEntry(p).ok,true);
  assert.ok(f.sheets.Customers.data[1][7]);assert.equal(f.sheets.Customers.data[1][8],'');
  assert.equal(f.sheets.Entries.data.length,2);
});
