// Thistle & Hound giveaway API, running as Cloudflare Pages Functions backed by D1.
// Public routes: GET /api/giveaway/event, POST /api/giveaway/enter.
// Staff routes under /api/admin/ require the ADMIN_KEY secret as a bearer token.

export const CONSENT = Object.freeze({
  version: '2026-09-21-v1',
  email: 'Yes, email me Thistle & Hound news, pet-care tips, and offers. I can unsubscribe at any time.',
  sms: 'Yes, I agree to receive recurring marketing texts from Thistle & Hound at the number provided, including automated messages. Consent is not required to enter or purchase. Frequency varies. Message and data rates may apply. Reply STOP to opt out or HELP for help.'
});
const EVENT_ID = /^[a-z0-9][a-z0-9-]{0,79}$/;
const TOKEN_MIN_AGE = 1000;
const TOKEN_MAX_AGE = 4 * 60 * 60 * 1000;
const encoder = new TextEncoder();

const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), {
  status,
  headers: {'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex', ...headers}
});
const requireDb = env => { if (!env || !env.DB) throw new Error('The giveaway database is not bound as DB.'); return env.DB; };

// ---------- Events, availability and form tokens ----------

export async function loadEvent(db, id) {
  if (!EVENT_ID.test(String(id || ''))) return null;
  const r = await db.prepare('SELECT * FROM events WHERE id = ?').bind(id).first();
  if (!r) return null;
  const dates = [r.opens_at, r.closes_at, r.draw_at].map(value => new Date(value).getTime());
  if (!String(r.name).trim() || !String(r.eligibility).trim() || !String(r.rules).trim() || dates.some(value => !Number.isFinite(value)) || dates[0] >= dates[1] || dates[2] < dates[1]) return null;
  return {
    id: r.id, name: String(r.name),
    opensAt: new Date(dates[0]).toISOString(), closesAt: new Date(dates[1]).toISOString(), drawAt: new Date(dates[2]).toISOString(),
    eligibility: String(r.eligibility), rules: String(r.rules), status: String(r.status).toLowerCase()
  };
}

export function availability(event, now) {
  if (!event) return 'This event link isn’t available. Please scan the event QR code or ask us at the booth.';
  if (now >= Date.parse(event.closesAt)) return 'Entries for this drawing are closed. Thank you for visiting Thistle & Hound.';
  if (event.status !== 'open' || now < Date.parse(event.opensAt)) return 'Entries for this drawing aren’t open right now. Please check back or ask us at the booth.';
  return '';
}

async function hmac(secret, value) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), {name: 'HMAC', hash: 'SHA-256'}, false, ['sign']);
  const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function tokenSecret(env) {
  const secret = env && env.TOKEN_SECRET;
  if (!secret || secret.length < 32) throw new Error('TOKEN_SECRET is not configured.');
  return secret;
}
// The token binds the form to the exact event details and consent wording the visitor saw.
export async function makeToken(env, event, issued) {
  return issued + '.' + await hmac(tokenSecret(env), JSON.stringify(event) + '|' + CONSENT.version + '|' + issued);
}
export async function validToken(env, event, token, now) {
  if (typeof token !== 'string' || token.length > 120) return false;
  const issued = Number(token.split('.')[0]);
  if (!Number.isFinite(issued) || now - issued < TOKEN_MIN_AGE || now - issued >= TOKEN_MAX_AGE) return false;
  return safeEqual(token, await makeToken(env, event, issued));
}
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ---------- Validation ----------

function clean(value, max, required) {
  if (typeof value !== 'string') value = '';
  const result = value.normalize('NFKC').trim().replace(/[\u0000-\u001f\u007f]/g, '');
  if ((required && !result) || result.length > max) throw new Error('Please check the required fields and their lengths.');
  return result;
}
export function validate(data) {
  const p = {};
  for (const key of ['name', 'city', 'breed']) p[key] = clean(data[key], 100, true);
  p.petName = clean(data.petName, 80, true);
  p.otherPets = clean(data.otherPets, 200, false);
  p.email = clean(data.email, 254, true).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) throw new Error('Please enter a valid email address.');
  const phone = clean(data.phone, 24, true).replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');
  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(phone)) throw new Error('Please enter a valid US mobile number.');
  p.phone = '+1' + phone;
  p.zip = clean(data.zip, 10, true);
  if (!/^\d{5}(-\d{4})?$/.test(p.zip)) throw new Error('Please enter a valid ZIP code.');
  p.size = clean(data.size, 10, true);
  if (!['small', 'medium', 'large'].includes(p.size)) throw new Error('Please choose your dog’s size.');
  if (data.rulesAccepted !== true) throw new Error('Please agree to the drawing details before entering.');
  p.emailOptIn = data.emailOptIn === true;
  p.smsOptIn = data.smsOptIn === true;
  return p;
}

// ---------- Public handlers ----------

export async function getEvent(request, env, now = Date.now()) {
  const id = new URL(request.url).searchParams.get('id');
  const event = await loadEvent(requireDb(env), id);
  const message = availability(event, now);
  if (message) return json({available: false, name: event ? event.name : '', message});
  return json({
    available: true, id: event.id, name: event.name, closesAt: event.closesAt, drawAt: event.drawAt,
    eligibility: event.eligibility, rules: event.rules, emailConsent: CONSENT.email, smsConsent: CONSENT.sms,
    token: await makeToken(env, event, now)
  });
}

const CONFLICT = 'Please use the same email and mobile number as your earlier registration, or ask us at the booth to help update your contact details.';

export async function submitEntry(request, env, now = Date.now()) {
  let data;
  try { data = await request.json(); } catch { data = null; }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return json({ok: false, message: 'Please reload the form and try again.'}, 400);
  if (data.website) return json({ok: false, message: 'We couldn’t save your entry. Please ask us at the booth.'}, 400);
  let p;
  try { p = validate(data); } catch (error) { return json({ok: false, message: error.message}, 400); }

  const db = requireDb(env);
  const event = await loadEvent(db, data.eventId);
  const message = availability(event, now);
  if (message) return json({ok: false, message}, 409);
  if (!await validToken(env, event, data.token, now)) return json({ok: false, message: 'Please reload the page to get the latest drawing details, then try again.'}, 409);

  const stamp = new Date(now).toISOString();
  const findMatches = async () => (await db.prepare('SELECT id, email, phone FROM customers WHERE email = ? OR phone = ?').bind(p.email, p.phone).all()).results;
  let matches = await findMatches();
  // Never merge two people or replace an existing contact based on an anonymous claim.
  if (matches.length > 1 || (matches.length === 1 && (matches[0].email !== p.email || matches[0].phone !== p.phone))) return json({ok: false, message: CONFLICT}, 409);
  if (!matches.length) {
    // Unique email and phone columns make a simultaneous duplicate submission a no-op here.
    await db.prepare('INSERT INTO customers (id, created_at, name, email, phone, city, zip) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING')
      .bind(crypto.randomUUID(), stamp, p.name, p.email, p.phone, p.city, p.zip).run();
    matches = await findMatches();
    if (matches.length !== 1 || matches[0].email !== p.email || matches[0].phone !== p.phone) return json({ok: false, message: CONFLICT}, 409);
  }
  const customerId = matches[0].id;
  // One atomic batch: a repeat submission keeps the original entry and choices. The consent summary
  // is projected from whichever entry is stored, keeping only the first opt-in date and never
  // touching staff-maintained suppression flags.
  await db.batch([
    db.prepare(`INSERT INTO entries (id, event_id, customer_id, entered_at, pet_name, breed, size, other_pets, email_opt_in, sms_opt_in,
        consent_version, email_consent_text, sms_consent_text, rules_accepted, rules_text)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?) ON CONFLICT (event_id, customer_id) DO NOTHING`)
      .bind(crypto.randomUUID(), event.id, customerId, stamp, p.petName, p.breed, p.size, p.otherPets, p.emailOptIn ? 1 : 0, p.smsOptIn ? 1 : 0,
        CONSENT.version, CONSENT.email, CONSENT.sms, event.eligibility + '\n' + event.rules),
    db.prepare(`UPDATE customers SET
        email_opt_in_at = COALESCE(email_opt_in_at, (SELECT entered_at FROM entries WHERE event_id = ?1 AND customer_id = ?2 AND email_opt_in = 1)),
        sms_opt_in_at = COALESCE(sms_opt_in_at, (SELECT entered_at FROM entries WHERE event_id = ?1 AND customer_id = ?2 AND sms_opt_in = 1))
      WHERE id = ?2`).bind(event.id, customerId)
  ]);
  return json({ok: true});
}

// ---------- Staff handlers ----------

export async function authorize(request, env) {
  const expected = env && env.ADMIN_KEY;
  if (!expected || expected.length < 16) return json({error: 'Staff access is not configured. Set the ADMIN_KEY secret.'}, 503);
  const header = request.headers.get('authorization') || '';
  const supplied = header.startsWith('Bearer ') ? header.slice(7) : '';
  // Compare fixed-length digests so timing does not reveal the key.
  if (!supplied || !safeEqual(await hmac(expected, 'admin|' + supplied), await hmac(expected, 'admin|' + expected))) {
    return json({error: 'That staff key didn’t work.'}, 401, {'www-authenticate': 'Bearer'});
  }
  return null;
}

// "Taylor Example" -> "Taylor E." Only first names and initials go on the recorded drawing screen.
export function displayName(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'Mystery Friend';
  const last = parts.length > 1 ? ' ' + Array.from(parts[parts.length - 1])[0].toUpperCase() + '.' : '';
  return parts[0] + last;
}
const publicEntrant = row => ({id: row.id, owner: displayName(row.name), petName: row.pet_name});

export async function listEvents(request, env) {
  const denied = await authorize(request, env);
  if (denied) return denied;
  const {results} = await requireDb(env).prepare(`SELECT e.id, e.name, e.opens_at, e.closes_at, e.draw_at, e.status,
      (SELECT COUNT(*) FROM entries n WHERE n.event_id = e.id AND n.eligible = 1) AS entries,
      (SELECT COUNT(*) FROM draws d WHERE d.event_id = e.id) AS draws
    FROM events e ORDER BY e.closes_at DESC`).all();
  return json({events: results.map(r => ({id: r.id, name: r.name, opensAt: r.opens_at, closesAt: r.closes_at, drawAt: r.draw_at, status: r.status, entries: r.entries, draws: r.draws}))});
}

async function drawHistory(db, eventId) {
  const {results} = await db.prepare(`SELECT d.drawn_at, d.pool_size, n.id, n.pet_name, n.breed, n.size, c.name, c.email, c.phone, c.city
    FROM draws d JOIN entries n ON n.id = d.entry_id JOIN customers c ON c.id = n.customer_id
    WHERE d.event_id = ? ORDER BY d.drawn_at`).bind(eventId).all();
  return results.map((r, i) => ({number: i + 1, drawnAt: r.drawn_at, poolSize: r.pool_size, ...publicEntrant(r), breed: r.breed, size: r.size,
    contact: {name: r.name, email: r.email, phone: r.phone, city: r.city}}));
}

export async function listEntrants(request, env) {
  const denied = await authorize(request, env);
  if (denied) return denied;
  const db = requireDb(env);
  const event = await loadEvent(db, new URL(request.url).searchParams.get('event'));
  if (!event) return json({error: 'Event not found, or its dates need attention.'}, 404);
  const {results} = await db.prepare(`SELECT n.id, n.pet_name, c.name FROM entries n JOIN customers c ON c.id = n.customer_id
    WHERE n.event_id = ? AND n.eligible = 1 AND n.id NOT IN (SELECT entry_id FROM draws WHERE event_id = ?)`).bind(event.id, event.id).all();
  return json({event, entrants: results.map(publicEntrant), draws: await drawHistory(db, event.id)});
}

// Unbiased integer in [0, max) from the platform CSPRNG.
export function randomIndex(max) {
  const limit = Math.floor(0x100000000 / max) * max;
  const buffer = new Uint32Array(1);
  do crypto.getRandomValues(buffer); while (buffer[0] >= limit);
  return buffer[0] % max;
}

export async function draw(request, env, now = Date.now()) {
  const denied = await authorize(request, env);
  if (denied) return denied;
  let body;
  try { body = await request.json(); } catch { body = {}; }
  const practice = body && body.practice === true;
  const db = requireDb(env);
  const event = await loadEvent(db, body && body.eventId);
  if (!event) return json({error: 'Event not found, or its dates need attention.'}, 404);
  if (!practice && now < Date.parse(event.closesAt)) return json({error: 'Entries are still open for this event. Use a practice round until entries close.'}, 409);
  const {results: pool} = await db.prepare(`SELECT n.id, n.pet_name, n.breed, n.size, c.name, c.email, c.phone, c.city
    FROM entries n JOIN customers c ON c.id = n.customer_id
    WHERE n.event_id = ? AND n.eligible = 1 AND n.id NOT IN (SELECT entry_id FROM draws WHERE event_id = ?)`).bind(event.id, event.id).all();
  if (!pool.length) return json({error: 'There are no eligible entries left to draw for this event.'}, 409);
  const picked = pool[randomIndex(pool.length)];
  const drawnAt = new Date(now).toISOString();
  if (!practice) {
    const result = await db.prepare('INSERT INTO draws (id, event_id, entry_id, drawn_at, pool_size) VALUES (?, ?, ?, ?, ?) ON CONFLICT DO NOTHING')
      .bind(crypto.randomUUID(), event.id, picked.id, drawnAt, pool.length).run();
    if (!result.meta || !result.meta.changes) return json({error: 'Another drawing just finished. Reload and try again.'}, 409);
  }
  return json({
    practice, drawnAt, poolSize: pool.length,
    winner: {...publicEntrant(picked), breed: picked.breed, size: picked.size},
    contact: {name: picked.name, email: picked.email, phone: picked.phone, city: picked.city}
  });
}

// Spreadsheet apps execute cells that start with these characters; prefix them so an export is inert.
export function csvCell(value) {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[\s]*[=+\-@\t\r]/.test(text)) text = "'" + text;
  return /[",\n\r]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}

export async function exportEntries(request, env) {
  const denied = await authorize(request, env);
  if (denied) return denied;
  const db = requireDb(env);
  const eventId = new URL(request.url).searchParams.get('event');
  if (!EVENT_ID.test(String(eventId || ''))) return json({error: 'Choose an event to export.'}, 400);
  const {results} = await db.prepare(`SELECT n.entered_at, n.event_id, c.name, c.email, c.phone, c.city, c.zip, n.pet_name, n.breed, n.size, n.other_pets,
      n.email_opt_in, n.sms_opt_in, c.email_opt_in_at, c.sms_opt_in_at, c.email_suppressed, c.sms_suppressed, n.eligible,
      (SELECT d.drawn_at FROM draws d WHERE d.entry_id = n.id) AS drawn_at, n.id AS entry_id, c.id AS customer_id
    FROM entries n JOIN customers c ON c.id = n.customer_id WHERE n.event_id = ? ORDER BY n.entered_at`).bind(eventId).all();
  const columns = ['entered_at', 'event_id', 'name', 'email', 'phone', 'city', 'zip', 'pet_name', 'breed', 'size', 'other_pets', 'email_opt_in', 'sms_opt_in',
    'email_opt_in_at', 'sms_opt_in_at', 'email_suppressed', 'sms_suppressed', 'eligible', 'drawn_at', 'entry_id', 'customer_id'];
  const csv = [columns.join(','), ...results.map(row => columns.map(key => csvCell(row[key])).join(','))].join('\r\n') + '\r\n';
  return new Response(csv, {headers: {
    'content-type': 'text/csv; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex',
    'content-disposition': `attachment; filename="${eventId}-entries.csv"`
  }});
}

// Wraps a handler so unexpected failures return a generic message instead of internals.
export const route = handler => async context => {
  try { return await handler(context.request, context.env); }
  catch (error) { console.error(error); return json({ok: false, error: 'Something went wrong on our side. Please try again.', message: 'Something went wrong on our side. Please try again, or ask us at the booth.'}, 500); }
};
