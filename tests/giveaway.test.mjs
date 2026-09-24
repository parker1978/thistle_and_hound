// Run with: node --test tests/   (Node 22.5+ for the built-in SQLite module)
import {test} from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import * as api from '../server/giveaway.js';
import {createD1} from './d1-shim.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const EVENT = 'marge-durham-dog-fest-2026';
const ADMIN_KEY = 'staff-key-for-tests-0123456789';

function fixture() {
  const db = createD1(path.join(root, '../migrations'));
  const env = {DB: db, TOKEN_SECRET: 'x'.repeat(48), ADMIN_KEY};
  let now = Date.parse('2026-09-26T12:00:00-05:00');
  const call = async (handler, url, {body, key} = {}) => {
    const headers = {'content-type': 'application/json'};
    if (key) headers.authorization = 'Bearer ' + key;
    const request = new Request('https://example.test' + url, {method: body === undefined ? 'GET' : 'POST', headers, body: body === undefined ? undefined : JSON.stringify(body)});
    const response = await handler(request, env, now);
    const type = response.headers.get('content-type') || '';
    return {status: response.status, body: type.includes('json') ? await response.json() : await response.text()};
  };
  const getEvent = async (id = EVENT) => (await call(api.getEvent, '/api/giveaway/event?id=' + id)).body;
  const input = async (overrides = {}) => {
    const token = (await getEvent(overrides.eventId || EVENT)).token;
    now += 2000;
    return {eventId: EVENT, token, name: 'Taylor Example', email: 'taylor@example.com', phone: '402-555-0123', city: 'Omaha', zip: '68102', petName: 'Maple', breed: 'Mixed breed', size: 'medium', otherPets: '', rulesAccepted: true, emailOptIn: false, smsOptIn: false, ...overrides};
  };
  const enter = async payload => (await call(api.submitEntry, '/api/giveaway/enter', {body: payload})).body;
  const rows = sql => db.sqlite.prepare(sql).all();
  const addEvent = id => db.sqlite.prepare(`INSERT INTO events (id, name, opens_at, closes_at, draw_at, eligibility, rules, status)
    SELECT ?, 'Next event', opens_at, '2026-10-27T15:30:00-05:00', '2026-10-27T17:00:00-05:00', eligibility, rules, 'open' FROM events WHERE id = ?`).run(id, EVENT);
  return {db, env, call, getEvent, input, enter, rows, addEvent, setNow: value => { now = Date.parse(value); }};
}

test('new registration stores contact, pet, event and independent consent', async () => {
  const f = fixture();
  assert.equal((await f.enter(await f.input({smsOptIn: true}))).ok, true);
  const [c] = f.rows('SELECT * FROM customers'); const [e] = f.rows('SELECT * FROM entries');
  assert.equal(c.email, 'taylor@example.com'); assert.equal(c.phone, '+14025550123'); assert.equal(c.email_opt_in_at, null); assert.ok(c.sms_opt_in_at);
  assert.equal(e.event_id, EVENT); assert.equal(e.customer_id, c.id); assert.equal(e.pet_name, 'Maple'); assert.equal(e.email_opt_in, 0); assert.equal(e.sms_opt_in, 1); assert.match(e.sms_consent_text, /STOP/);
});

test('same event plus normalized email and phone counts once, with no consent mutation', async () => {
  const f = fixture();
  await f.enter(await f.input());
  assert.equal((await f.enter(await f.input({email: ' TAYLOR@example.com ', phone: '+1 (402) 555-0123', emailOptIn: true}))).ok, true);
  assert.equal(f.rows('SELECT * FROM customers').length, 1); assert.equal(f.rows('SELECT * FROM entries').length, 1);
  assert.equal(f.rows('SELECT email_opt_in_at FROM customers')[0].email_opt_in_at, null);
});

test('same customer can enter a second event without a second customer row', async () => {
  const f = fixture(); f.addEvent('next-event');
  await f.enter(await f.input({emailOptIn: true}));
  assert.equal((await f.enter(await f.input({eventId: 'next-event', petName: 'Poppy'}))).ok, true);
  assert.equal(f.rows('SELECT * FROM customers').length, 1); assert.equal(f.rows('SELECT * FROM entries').length, 2);
  assert.ok(f.rows('SELECT email_opt_in_at FROM customers')[0].email_opt_in_at);
});

test('conflicting or changed contacts are not merged or overwritten', async () => {
  const f = fixture();
  await f.enter(await f.input());
  await f.enter(await f.input({email: 'other@example.com', phone: '5315550124', name: 'Other Example'}));
  assert.equal((await f.enter(await f.input({email: 'taylor@example.com', phone: '5315550124'}))).ok, false);
  assert.equal((await f.enter(await f.input({phone: '4025550129'}))).ok, false);
  assert.equal(f.rows('SELECT * FROM customers').length, 2); assert.equal(f.rows('SELECT * FROM entries').length, 2);
});

test('server rejects invalid fields, absent agreement, honeypot and bad JSON', async () => {
  const f = fixture();
  for (const override of [{email: 'bad'}, {phone: '123'}, {zip: 'none'}, {petName: ''}, {size: 'huge'}, {rulesAccepted: 'true'}, {name: 'a'.repeat(101)}, {website: 'bot'}]) {
    assert.equal((await f.enter(await f.input(override))).ok, false, JSON.stringify(override));
  }
  assert.equal((await f.call(api.submitEntry, '/api/giveaway/enter', {body: [1, 2]})).status, 400);
  assert.equal(f.rows('SELECT * FROM customers').length, 0);
});

test('only explicit boolean true opts in', async () => {
  const f = fixture();
  await f.enter(await f.input({emailOptIn: 'yes', smsOptIn: 'false'}));
  const [e] = f.rows('SELECT * FROM entries'); assert.equal(e.email_opt_in, 0); assert.equal(e.sms_opt_in, 0);
});

test('deadline is enforced on the server, including a form opened before closing', async () => {
  const f = fixture();
  f.setNow('2026-09-27T15:29:00-05:00'); const p = await f.input();
  f.setNow('2026-09-27T15:30:00-05:00');
  assert.equal((await f.enter(p)).ok, false); assert.equal((await f.getEvent()).available, false);
  assert.equal(f.rows('SELECT * FROM entries').length, 0);
});

test('unknown, future, paused and malformed events fail closed', async () => {
  const f = fixture();
  assert.equal((await f.getEvent('unknown')).available, false);
  assert.equal((await f.getEvent('BAD%20ID')).available, false);
  f.db.sqlite.exec(`UPDATE events SET status = 'paused'`); assert.equal((await f.getEvent()).available, false);
  f.db.sqlite.exec(`UPDATE events SET status = 'open'`); f.setNow('2026-09-20T12:00:00Z'); assert.equal((await f.getEvent()).available, false);
  f.setNow('2026-09-26T12:00:00Z'); f.db.sqlite.exec(`UPDATE events SET closes_at = 'bad date'`); assert.equal((await f.getEvent()).available, false);
});

test('tampered, expired, stale-rule and too-fresh tokens cannot submit', async () => {
  const f = fixture();
  assert.equal((await f.enter(await f.input({token: 'not-a-token'}))).ok, false);
  const p = await f.input(); f.setNow('2026-09-26T18:00:00-05:00'); assert.equal((await f.enter(p)).ok, false);
  const q = await f.input(); f.db.sqlite.exec(`UPDATE events SET rules = rules || ' Updated rules.'`); assert.equal((await f.enter(q)).ok, false);
  const r = await f.input(); f.env.TOKEN_SECRET = 'y'.repeat(48); assert.equal((await f.enter(r)).ok, false);
  const s = await f.input(); f.setNow(new Date(Number(s.token.split('.')[0]) + 200).toISOString()); assert.equal((await f.enter(s)).ok, false);
  assert.equal(f.rows('SELECT * FROM entries').length, 0);
});

test('retry after a lost response returns success without another entry', async () => {
  const f = fixture();
  const p = await f.input({emailOptIn: true});
  assert.equal((await f.enter(p)).ok, true); assert.equal((await f.enter(p)).ok, true);
  assert.equal(f.rows('SELECT * FROM entries').length, 1);
});

test('retry repairs the consent summary when a customer was saved without its entry', async () => {
  const f = fixture();
  const p = await f.input({emailOptIn: true});
  // Simulate an interrupted earlier request: the customer row exists but nothing else was written.
  f.db.sqlite.exec(`INSERT INTO customers (id, created_at, name, email, phone, city, zip) VALUES ('c1', '2026-09-26T00:00:00Z', 'Taylor Example', 'taylor@example.com', '+14025550123', 'Omaha', '68102')`);
  assert.equal((await f.enter(p)).ok, true);
  const [c] = f.rows('SELECT * FROM customers'); assert.ok(c.email_opt_in_at); assert.equal(c.sms_opt_in_at, null);
  assert.equal(f.rows('SELECT * FROM entries').length, 1);
});

test('manual unsubscribe suppression survives future registrations', async () => {
  const f = fixture(); f.addEvent('next');
  await f.enter(await f.input({smsOptIn: true}));
  f.db.sqlite.exec('UPDATE customers SET sms_suppressed = 1');
  await f.enter(await f.input({eventId: 'next', smsOptIn: true}));
  assert.equal(f.rows('SELECT sms_suppressed FROM customers')[0].sms_suppressed, 1);
});

test('public reads never reveal customer data', async () => {
  const f = fixture();
  await f.enter(await f.input());
  assert.doesNotMatch(JSON.stringify(await f.getEvent()), /taylor|example\.com|5550123|customer_?id/i);
});

test('staff routes require the admin key', async () => {
  const f = fixture();
  for (const [handler, url, body] of [[api.listEvents, '/api/admin/events'], [api.listEntrants, '/api/admin/entrants?event=' + EVENT], [api.exportEntries, '/api/admin/export?event=' + EVENT], [api.draw, '/api/admin/draw', {eventId: EVENT, practice: true}]]) {
    assert.equal((await f.call(handler, url, {body})).status, 401);
    assert.equal((await f.call(handler, url, {body, key: ADMIN_KEY + 'x'})).status, 401);
  }
  delete f.env.ADMIN_KEY;
  assert.equal((await f.call(api.listEvents, '/api/admin/events', {key: ADMIN_KEY})).status, 503);
});

test('entrant list shows only first name, last initial and dog name', async () => {
  const f = fixture();
  await f.enter(await f.input({name: 'Taylor Q. Example'}));
  const r = await f.call(api.listEntrants, '/api/admin/entrants?event=' + EVENT, {key: ADMIN_KEY});
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.entrants.map(({owner, petName}) => ({owner, petName})), [{owner: 'Taylor E.', petName: 'Maple'}]);
  assert.doesNotMatch(JSON.stringify(r.body.entrants), /taylor@|5550123|Example/);
  assert.equal((await f.call(api.listEvents, '/api/admin/events', {key: ADMIN_KEY})).body.events[0].entries, 1);
});

test('official draws wait for entries to close, then never pick the same entry twice', async () => {
  const f = fixture();
  await f.enter(await f.input());
  await f.enter(await f.input({email: 'sam@example.com', phone: '5315550124', name: 'Sam Sample', petName: 'Biscuit'}));
  await f.enter(await f.input({email: 'ryan@example.com', phone: '5315550125', name: 'Ryan Test', petName: 'Olive'}));
  f.db.sqlite.exec(`UPDATE entries SET eligible = 0 WHERE pet_name = 'Olive'`);
  const draw = body => f.call(api.draw, '/api/admin/draw', {key: ADMIN_KEY, body});
  assert.equal((await draw({eventId: EVENT})).status, 409);
  const practice = await draw({eventId: EVENT, practice: true});
  assert.equal(practice.status, 200); assert.equal(practice.body.practice, true); assert.equal(f.rows('SELECT * FROM draws').length, 0);

  f.setNow('2026-09-27T17:00:00-05:00');
  const first = await draw({eventId: EVENT}); const second = await draw({eventId: EVENT}); const third = await draw({eventId: EVENT});
  assert.equal(first.status, 200); assert.equal(second.status, 200); assert.equal(third.status, 409);
  assert.equal(first.body.poolSize, 2); assert.equal(second.body.poolSize, 1);
  assert.notEqual(first.body.winner.id, second.body.winner.id);
  assert.ok(![first.body.winner.petName, second.body.winner.petName].includes('Olive'));
  assert.match(first.body.contact.email, /@example\.com$/);
  const list = await f.call(api.listEntrants, '/api/admin/entrants?event=' + EVENT, {key: ADMIN_KEY});
  assert.equal(list.body.entrants.length, 0); assert.deepEqual(list.body.draws.map(d => d.number), [1, 2]);
});

test('random selection is uniform across many draws', () => {
  const counts = [0, 0, 0];
  for (let i = 0; i < 30000; i++) counts[api.randomIndex(3)]++;
  for (const count of counts) assert.ok(count > 9500 && count < 10500, String(counts));
});

test('CSV export is staff-only, complete, and inert in spreadsheet apps', async () => {
  const f = fixture();
  assert.equal((await f.enter(await f.input({name: '=HYPERLINK("x")', otherPets: 'Cat, "Mo"'}))).ok, true);
  const r = await f.call(api.exportEntries, '/api/admin/export?event=' + EVENT, {key: ADMIN_KEY});
  assert.equal(r.status, 200);
  const [header, line] = r.body.trim().split('\r\n');
  assert.match(header, /^entered_at,event_id,name,email,phone/);
  assert.match(line, /"'=HYPERLINK\(""x""\)"/); assert.match(line, /"Cat, ""Mo"""/); assert.match(line, /'\+14025550123/);
  assert.equal(api.csvCell('-1'), "'-1"); assert.equal(api.csvCell(null), '');
});

test('displayName handles single names and extra spaces', () => {
  assert.equal(api.displayName('  Cher '), 'Cher');
  assert.equal(api.displayName('ana  de la cruz'), 'ana C.');
  assert.equal(api.displayName(''), 'Mystery Friend');
});

test('Google Sheet import loads earlier entries, dedupes on rerun, and keeps them deduplicated', async () => {
  const {parseCsv, toSql} = await import('../scripts/import-google-sheet.mjs');
  const customersCsv = 'customer_id,created_at,name,email,phone,city,zip,email_opt_in_at,sms_opt_in_at,email_suppressed,sms_suppressed\r\n' +
    'c-1,2026-09-22T10:00:00.000Z,Pat O\'Neil,Pat@Example.com,+14025550150,Omaha,00501,2026-09-22T10:00:00.000Z,,yes,\r\n';
  const entriesCsv = 'entry_id,event_id,event_name,customer_id,entered_at,pet_name,breed,size,other_pets,email_opt_in,sms_opt_in,consent_version,email_consent_text,sms_consent_text,rules_accepted,rules_text\r\n' +
    'e-1,marge-durham-dog-fest-2026,Fest,c-1,2026-09-22T10:00:00.000Z,Rex,"Lab, mostly",large,,TRUE,FALSE,2026-09-21-v1,email text,sms text,TRUE,"Line one\nLine ""two"""\r\n';
  const toRows = csv => { const [h, ...r] = parseCsv(csv); return r.map(x => Object.fromEntries(h.map((k, i) => [k, x[i]]))); };
  const script = toSql({customers: toRows(customersCsv), entries: toRows(entriesCsv)});
  const f = fixture();
  f.db.sqlite.exec(script); f.db.sqlite.exec(script);
  const [c] = f.rows('SELECT * FROM customers'); const [e] = f.rows('SELECT * FROM entries');
  assert.equal(f.rows('SELECT * FROM customers').length, 1);
  assert.equal(c.name, "Pat O'Neil"); assert.equal(c.email, 'pat@example.com'); assert.equal(c.zip, '00501'); assert.equal(c.email_suppressed, 1); assert.equal(c.sms_opt_in_at, null);
  assert.equal(e.breed, 'Lab, mostly'); assert.equal(e.email_opt_in, 1); assert.equal(e.rules_text, 'Line one\nLine "two"');
  // The same person entering again through the new form is recognized, not duplicated.
  assert.equal((await f.enter(await f.input({name: "Pat O'Neil", email: 'pat@example.com', phone: '402-555-0150', petName: 'Rex'}))).ok, true);
  assert.equal(f.rows('SELECT * FROM entries').length, 1);
  const r = await f.call(api.listEntrants, '/api/admin/entrants?event=' + EVENT, {key: ADMIN_KEY});
  assert.deepEqual(r.body.entrants.map(x => x.owner), ["Pat O."]);
});
