/** Thistle & Hound giveaway. Only getEvent and submitEntry expose data to visitors.
 * Owner operations MUST keep their trailing underscore (private to script.run).
 */
const SCHEMA = {
  Events: ['event_id','name','opens_at','closes_at','draw_at','eligibility','rules','status'],
  Customers: ['customer_id','created_at','name','email','phone','city','zip','email_opt_in_at','sms_opt_in_at','email_suppressed','sms_suppressed'],
  Entries: ['entry_id','event_id','event_name','customer_id','entered_at','pet_name','breed','size','other_pets','email_opt_in','sms_opt_in','consent_version','email_consent_text','sms_consent_text','rules_accepted','rules_text']
};
const EXISTING_SPREADSHEET_ID = '1cSsDUJ1EHrfYpnTLYf45qDgPlczCehSzUwdrOjSUpgc';
const CONSENT = {
  version: '2026-09-21-v1',
  email: 'Yes, email me Thistle & Hound news, pet-care tips, and offers. I can unsubscribe at any time.',
  sms: 'Yes, I agree to receive recurring marketing texts from Thistle & Hound at the number provided, including automated messages. Consent is not required to enter or purchase. Frequency varies. Message and data rates may apply. Reply STOP to opt out or HELP for help.'
};

function doGet(request) {
  const page = HtmlService.createTemplateFromFile('Form');
  page.eventId = String(request && request.parameter && request.parameter.event || '').slice(0, 80);
  page.bridge = String(request && request.parameter && request.parameter.bridge || '').slice(0, 80);
  return page.evaluate().setTitle('Enter the Thistle & Hound giveaway')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Run once from the Apps Script editor, as the owner. Rerunning never clears data.
function setupGiveaway_() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const props = PropertiesService.getScriptProperties();
    let id = props.getProperty('SPREADSHEET_ID') || EXISTING_SPREADSHEET_ID;
    const book = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.create('Thistle & Hound — Giveaway registrations');
    props.setProperty('SPREADSHEET_ID', book.getId());
    if (!props.getProperty('TOKEN_SECRET')) props.setProperty('TOKEN_SECRET', Utilities.getUuid() + Utilities.getUuid());
    book.setSpreadsheetTimeZone('America/Chicago');
    Object.keys(SCHEMA).forEach(name => {
      let sheet = book.getSheetByName(name);
      if (!sheet) sheet = book.insertSheet(name);
      if (!sheet.getLastRow()) {
        sheet.getRange(1,1,1,SCHEMA[name].length).setValues([SCHEMA[name]]).setBackground('#34533e').setFontColor('#ffffff').setFontWeight('bold');
        sheet.setFrozenRows(1);
        sheet.setColumnWidths(1, SCHEMA[name].length, 160);
      }
      table_(book, name); // Refuse a changed schema instead of writing into wrong columns.
    });
    const events = table_(book, 'Events');
    if (!rows_(events).some(row => row[0] === 'marge-durham-dog-fest-2026')) {
      append_(events, ['marge-durham-dog-fest-2026','37th Annual Marge Durham Walk and Dog Fest',
        '2026-09-21T00:00:00-05:00','2026-09-27T15:30:00-05:00','2026-09-27T17:00:00-05:00',
        'Open to new and returning customers. Prize is one grooming package for one dog. The winner will arrange the appointment with Thistle & Hound.',
        'No purchase necessary. One entry per person, per event. Returning customers may enter each new event. One winner will be chosen at random from eligible entries. Odds depend on the number of eligible entries. The prize is The Works: bath, blow dry, nail trim, teeth and ear cleaning, plus anal gland expression, sanitary shave, and paw shave if needed. Value exceeds $200 depending on dog size. Services are tailored to the dog’s needs and comfort. We will contact the winner using the details provided. Marketing signup is optional and does not affect the drawing.',
        'open']);
    }
    SpreadsheetApp.flush();
    console.log(book.getUrl());
    return book.getUrl();
  } finally { lock.releaseLock(); }
}

function book_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('Giveaway is not configured.');
  return SpreadsheetApp.openById(id);
}
function table_(book, name) {
  const sheet = book.getSheetByName(name);
  if (!sheet || JSON.stringify(sheet.getRange(1,1,1,SCHEMA[name].length).getValues()[0]) !== JSON.stringify(SCHEMA[name])) throw new Error('Giveaway table requires owner attention.');
  return sheet;
}
function rows_(sheet) { return sheet.getLastRow() > 1 ? sheet.getRange(2,1,sheet.getLastRow()-1,sheet.getLastColumn()).getValues() : []; }
// Plain-text format plus escaping prevents formulas supplied through a public form.
function cell_(value) { return typeof value === 'string' && /^[\s]*[=+\-@]/.test(value) ? "'" + value : value; }
function append_(sheet, values) {
  sheet.getRange(sheet.getLastRow()+1,1,1,values.length).setNumberFormat('@').setValues([values.map(cell_)]);
}
function event_(book, id) {
  if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(String(id || ''))) return null;
  const matches = rows_(table_(book, 'Events')).filter(row => row[0] === id);
  if (matches.length !== 1) return null;
  const r = matches[0];
  const dates = [r[2],r[3],r[4]].map(value => new Date(value).getTime());
  if (!String(r[1]).trim() || !String(r[5]).trim() || !String(r[6]).trim() || dates.some(value => !Number.isFinite(value)) || dates[0] >= dates[1] || dates[2] < dates[1]) return null;
  return {id:r[0],name:String(r[1]),opensAt:new Date(dates[0]).toISOString(),closesAt:new Date(dates[1]).toISOString(),drawAt:new Date(dates[2]).toISOString(),eligibility:String(r[5]),rules:String(r[6]),status:String(r[7]).toLowerCase()};
}
function availability_(event, now) {
  if (!event) return 'This event link isn’t available. Please scan the event QR code or ask us at the booth.';
  if (now >= new Date(event.closesAt).getTime()) return 'Entries for this drawing are closed. Thank you for visiting Thistle & Hound.';
  if (event.status !== 'open' || now < new Date(event.opensAt).getTime()) return 'Entries for this drawing aren’t open right now. Please check back or ask us at the booth.';
  return '';
}
function signature_(value) {
  const secret = PropertiesService.getScriptProperties().getProperty('TOKEN_SECRET');
  if (!secret) throw new Error('Giveaway is not configured.');
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(value, secret));
}
function token_(event, now) { return now + '.' + signature_(JSON.stringify(event) + '|' + CONSENT.version + '|' + now); }
function validToken_(event, token, now) {
  if (typeof token !== 'string' || token.length > 120) return false;
  const issued = Number(token.split('.')[0]);
  return Number.isFinite(issued) && now - issued >= 1000 && now - issued < 4*60*60*1000 && token === token_(event, issued);
}
function getEvent(id) {
  const event = event_(book_(), id);
  const now = Date.now();
  const message = availability_(event, now);
  if (message) return {available:false,name:event ? event.name : '',message};
  return {available:true,id:event.id,name:event.name,closesAt:event.closesAt,drawAt:event.drawAt,eligibility:event.eligibility,rules:event.rules,emailConsent:CONSENT.email,smsConsent:CONSENT.sms,token:token_(event, now)};
}
function clean_(value, max, required) {
  if (typeof value !== 'string') value = '';
  const result = value.normalize('NFKC').trim().replace(/[\u0000-\u001f\u007f]/g, '');
  if ((required && !result) || result.length > max) throw new Error('Please check the required fields and their lengths.');
  return result;
}
function validate_(data) {
  const p = {};
  ['name','city','breed'].forEach(key => p[key] = clean_(data[key],100,true));
  p.petName = clean_(data.petName,80,true);
  p.otherPets = clean_(data.otherPets,200,false);
  p.email = clean_(data.email,254,true).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) throw new Error('Please enter a valid email address.');
  const phone = clean_(data.phone,24,true).replace(/\D/g,'').replace(/^1(?=\d{10}$)/,'');
  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(phone)) throw new Error('Please enter a valid US mobile number.');
  p.phone = '+1' + phone;
  p.zip = clean_(data.zip,10,true);
  if (!/^\d{5}(-\d{4})?$/.test(p.zip)) throw new Error('Please enter a valid ZIP code.');
  p.size = clean_(data.size,10,true);
  if (['small','medium','large'].indexOf(p.size) < 0) throw new Error('Please choose your dog’s size.');
  if (data.rulesAccepted !== true) throw new Error('Please agree to the drawing details before entering.');
  p.emailOptIn = data.emailOptIn === true;
  p.smsOptIn = data.smsOptIn === true;
  return p;
}
function submitEntry(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {ok:false,message:'Please reload the form and try again.'};
  if (data.website) return {ok:false,message:'We couldn’t save your entry. Please ask us at the booth.'};
  let p;
  try { p = validate_(data); } catch (error) { return {ok:false,message:error.message}; }
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return {ok:false,message:'A few entries are arriving at once. Please try again in a moment.'};
  try {
    const book = book_();
    const event = event_(book, data.eventId);
    const now = Date.now();
    const message = availability_(event, now);
    if (message) return {ok:false,message};
    if (!validToken_(event, data.token, now)) return {ok:false,message:'Please reload the page to get the latest drawing details, then try again.'};
    const customers = table_(book, 'Customers');
    const entries = table_(book, 'Entries');
    const customerRows = rows_(customers);
    const matches = customerRows.map((row,index) => ({row,index})).filter(item => item.row[3] === p.email || String(item.row[4]).replace(/^'/,'') === p.phone);
    // Never merge two people or replace an existing contact based on an anonymous claim.
    if (matches.length > 1 || (matches.length === 1 && (matches[0].row[3] !== p.email || String(matches[0].row[4]).replace(/^'/,'') !== p.phone))) {
      return {ok:false,message:'Please use the same email and mobile number as your earlier registration, or ask us at the booth to help update your contact details.'};
    }
    const stamp = new Date(now).toISOString();
    const customerId = matches.length ? matches[0].row[0] : Utilities.getUuid();
    // A retry (including a lost response) returns the same success without another entry.
    const priorEntry = rows_(entries).find(row => row[1] === event.id && row[3] === customerId);
    if (priorEntry) {
      syncConsent_(customers, matches[0].index + 2, priorEntry[9] === true, priorEntry[10] === true, priorEntry[4]);
      SpreadsheetApp.flush();
      return {ok:true};
    }
    if (!matches.length) append_(customers, [customerId,stamp,p.name,p.email,p.phone,p.city,p.zip,'','','','']);
    const customerRowNumber = matches.length ? matches[0].index + 2 : customers.getLastRow();
    append_(entries, [Utilities.getUuid(),event.id,event.name,customerId,stamp,p.petName,p.breed,p.size,p.otherPets,p.emailOptIn,p.smsOptIn,CONSENT.version,CONSENT.email,CONSENT.sms,true,event.eligibility + '\n' + event.rules]);
    // Entries are the consent audit trail. Blank choices do not revoke earlier opt-ins;
    // staff-maintained suppression columns are never changed by this public form.
    syncConsent_(customers, customerRowNumber, p.emailOptIn, p.smsOptIn, stamp);
    SpreadsheetApp.flush();
    return {ok:true};
  } finally { lock.releaseLock(); }
}
function syncConsent_(customers, row, email, sms, stamp) {
  // Preserve the first opt-in date and repair an interrupted write on retry.
  if (email && !customers.getRange(row,8).getValue()) customers.getRange(row,8).setNumberFormat('@').setValue(stamp);
  if (sms && !customers.getRange(row,9).getValue()) customers.getRange(row,9).setNumberFormat('@').setValue(stamp);
}
