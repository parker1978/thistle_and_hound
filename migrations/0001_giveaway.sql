-- Thistle & Hound giveaway database (Cloudflare D1).
-- Apply with: npx wrangler d1 migrations apply thistle-giveaway --remote

CREATE TABLE events (
  id TEXT PRIMARY KEY CHECK (length(id) BETWEEN 1 AND 80 AND id NOT GLOB '*[^a-z0-9-]*' AND substr(id, 1, 1) != '-'),
  name TEXT NOT NULL,
  opens_at TEXT NOT NULL,   -- ISO 8601 with offset, e.g. 2026-09-21T00:00:00-05:00
  closes_at TEXT NOT NULL,
  draw_at TEXT NOT NULL,
  eligibility TEXT NOT NULL,
  rules TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',  -- 'open' accepts entries; anything else (e.g. 'paused') stops them
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- One canonical contact record per person, shared across events.
CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,   -- trimmed, lowercased
  phone TEXT NOT NULL UNIQUE,   -- +1XXXXXXXXXX
  city TEXT NOT NULL,
  zip TEXT NOT NULL,
  email_opt_in_at TEXT,         -- first opt-in; never cleared by the form
  sms_opt_in_at TEXT,
  email_suppressed INTEGER NOT NULL DEFAULT 0,  -- staff set 1 to record an unsubscribe
  sms_suppressed INTEGER NOT NULL DEFAULT 0
);

-- One entry per customer per event. Pet details and the exact consent wording stay with the entry.
CREATE TABLE entries (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id),
  customer_id TEXT NOT NULL REFERENCES customers(id),
  entered_at TEXT NOT NULL,
  pet_name TEXT NOT NULL,
  breed TEXT NOT NULL,
  size TEXT NOT NULL,
  other_pets TEXT NOT NULL DEFAULT '',
  email_opt_in INTEGER NOT NULL DEFAULT 0,
  sms_opt_in INTEGER NOT NULL DEFAULT 0,
  consent_version TEXT NOT NULL,
  email_consent_text TEXT NOT NULL,
  sms_consent_text TEXT NOT NULL,
  rules_accepted INTEGER NOT NULL,
  rules_text TEXT NOT NULL,
  eligible INTEGER NOT NULL DEFAULT 1,  -- staff set 0 to exclude a test or ineligible entry from drawings
  UNIQUE (event_id, customer_id)
);
CREATE INDEX entries_event ON entries (event_id);

-- Official winner selections, in the order drawn. Practice draws are never stored.
CREATE TABLE draws (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id),
  entry_id TEXT NOT NULL REFERENCES entries(id),
  drawn_at TEXT NOT NULL,
  pool_size INTEGER NOT NULL,
  UNIQUE (event_id, entry_id)
);

INSERT INTO events (id, name, opens_at, closes_at, draw_at, eligibility, rules, status) VALUES (
  'marge-durham-dog-fest-2026',
  '37th Annual Marge Durham Walk and Dog Fest',
  '2026-09-21T00:00:00-05:00',
  '2026-09-27T15:30:00-05:00',
  '2026-09-27T17:00:00-05:00',
  'Open to new and returning customers. Prize is one grooming package for one dog. The winner will arrange the appointment with Thistle & Hound.',
  'No purchase necessary. One entry per person, per event. Returning customers may enter each new event. One winner will be chosen at random from eligible entries. Odds depend on the number of eligible entries. The prize is The Works: bath, blow dry, nail trim, teeth and ear cleaning, plus anal gland expression, sanitary shave, and paw shave if needed. Value exceeds $200 depending on dog size. Services are tailored to the dog’s needs and comfort. We will contact the winner using the details provided. Marketing signup is optional and does not affect the drawing.',
  'open'
);
