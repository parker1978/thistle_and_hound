# Thistle & Hound event giveaway

The giveaway runs on a **Cloudflare Worker** (static site plus a small API) with a **Cloudflare D1** database. Three parts work together:

| Part | URL | Who uses it |
| --- | --- | --- |
| Registration page | `/giveaway/?event=EVENT-ID` | Visitors (the QR code points here) |
| Giveaway API | `/api/giveaway/*` (public) and `/api/admin/*` (staff key required) | The two pages |
| Winner drawing | `/giveaway/draw/` | Staff, screen-recorded for social media |

The Google Sheet and Apps Script are no longer used once this is live. `scripts/import-google-sheet.mjs` moves the entries already collected there into D1.

## This event

- 37th Annual Marge Durham Walk and Dog Fest
- Event ID: `marge-durham-dog-fest-2026`
- Entries close Sunday, September 27, 2026 at 3:30 PM Central. Winner drawn that day at 5:00 PM Central.
- Prize: one free **The Works** deluxe grooming package for one dog, worth over $200 depending on size.
- Entry URL: `https://thistleandhoundpetcare.com/giveaway/?event=marge-durham-dog-fest-2026`

## One-time Cloudflare setup

The site is a **Cloudflare Worker with static assets**, deployed from GitHub by Workers Builds. `wrangler.toml` tells Cloudflare to serve this folder as the website and to run `server/worker.js` for `/api/*` requests. `.assetsignore` keeps server code, migrations, scripts and tests from being published.

1. **Database:** done. `thistle-giveaway` exists and its ID is in `wrangler.toml`.
2. **Create the tables and this event.** From a copy of this repository, run `npx wrangler d1 migrations apply thistle-giveaway --remote`.
3. **Check the Worker name.** `name` in `wrangler.toml` must match the Worker's name in the Cloudflare dashboard (Workers & Pages). Otherwise Workers Builds refuses to deploy.
4. **Deploy** by merging to `main`. After this deploy the Worker has code, so Cloudflare lets it hold secrets.
5. **Add two secrets** under the Worker → Settings → Variables and Secrets (type: Secret), or with `npx wrangler secret put NAME`:
   - `TOKEN_SECRET`: signs entry forms. Use a long random value, for example `openssl rand -base64 48`.
   - `ADMIN_KEY`: the staff key for the drawing page and CSV export, at least 16 characters, for example `openssl rand -base64 24`. Keep it in a password manager and share it only with staff.

   Saving a secret in the dashboard redeploys the Worker. Until both secrets exist, the registration form shows "We couldn't load this drawing."
6. **Test.** Open `/giveaway/` and confirm the form loads the event details. Then open `/giveaway/draw/`, sign in with `ADMIN_KEY`, and confirm the entry count.

Optional hardening: put `/giveaway/draw/*` and `/api/admin/*` behind **Cloudflare Access** (Zero Trust → Access → Applications) so staff also sign in with email. The staff key still applies.

## Switching over from the Google Sheet (before Sunday)

Entries are already arriving in the Google Sheet. To move them without losing anyone:

1. Finish the setup steps above. New entries now go to D1.
2. In the spreadsheet, download the **Customers** and **Entries** tabs with File → Download → Comma-separated values. Each download exports only the current tab.
3. Convert them and load them into D1:
   ```sh
   node scripts/import-google-sheet.mjs Customers.csv Entries.csv > sheet-import.local.sql
   npx wrangler d1 execute thistle-giveaway --remote --file=sheet-import.local.sql
   ```
4. In Apps Script, go to **Deploy → Manage deployments** and archive the web app so the old form stops accepting entries.
5. Download both tabs again and repeat step 3 to catch anyone who entered during the switch. The import skips records that already exist, so it's safe to run more than once.
6. Delete the CSV and `.local.sql` files, which contain customer contact details. Keep the spreadsheet private, or delete it once you've confirmed the counts on the drawing page.

Someone who entered through the old form and tries again is recognized as a returning customer, and no second entry is created.

## Drawing the winner

Open `https://thistleandhoundpetcare.com/giveaway/draw/` on a laptop, sign in with the staff key, and choose the event.

- **Practice round** is switched on automatically until entries close. Practice draws use real entrants but are never recorded, and they show a "Practice round" badge. Use them to rehearse the recording.
- After entries close, switch practice off for the **official draw**. The server picks the winner with a cryptographically secure random choice from eligible entries and records it permanently. Each official draw removes that entry from the pool, so **Draw another** picks an alternate if the first winner can't be reached.
- To try the page without signing in, use `/giveaway/draw/?demo`. It uses sample dogs and never touches real data.

The animation starts with every entrant as a floating name tag. Pressing **Fetch a winner** sweeps the tags into a vortex. Next comes a 3-2-1 bouncing tennis-ball countdown with a drumroll, then a slot-style reel of names that slows to a stop. The reveal is a swinging gold dog tag with the winner's name, confetti made of paws, bones and hearts, a fanfare, and a happy dog mascot.

Recording tips:
- Press **F** for full screen, then **H** to hide the controls. Press H again, or click the logo, to bring them back. The controls also fade out on their own when the mouse is still, and they are always hidden while a draw runs.
- **Space** or **Enter** starts a draw. On the winner screen it returns to the start. **M** toggles sound.
- The page works at any size. A narrow browser window gives a vertical 9:16 layout for Reels, TikTok, and Stories.
- The screen shows only the dog's name and the owner's first name and last initial. Contact details appear only in **Winner details**, a staff panel. Close it before recording.
- Sound is generated in the browser. Turn on system-audio capture in your screen recorder if you want it in the video.

## Database tables

- **events**: name, opening, closing and drawing times, eligibility, rules, and `status` (`open` accepts entries; anything else, such as `paused`, stops them). Times are ISO 8601 text with an offset, for example `2026-09-27T15:30:00-05:00`.
- **customers**: one record per person across all events. Email is trimmed and lowercased. Phone numbers are normalized to `+1XXXXXXXXXX`. Both are unique. Also stores first opt-in dates and the `email_suppressed` and `sms_suppressed` flags.
- **entries**: one per customer per event, with dog details, marketing choices, the exact consent and rules wording shown, and an `eligible` flag.
- **draws**: official winner selections in order, with the pool size at the time.

Run staff changes with `npx wrangler d1 execute thistle-giveaway --remote --command "…"`, or in the Cloudflare dashboard under D1 → thistle-giveaway → Console:

```sql
-- Add the next event (IDs are permanent: lowercase letters, numbers and hyphens)
INSERT INTO events (id, name, opens_at, closes_at, draw_at, eligibility, rules, status)
SELECT 'spring-fair-2027', 'Spring Pet Fair 2027', '2027-04-01T00:00:00-05:00', '2027-04-18T15:00:00-05:00', '2027-04-18T16:00:00-05:00', eligibility, rules, 'open'
FROM events WHERE id = 'marge-durham-dog-fest-2026';

-- Pause or reopen entries
UPDATE events SET status = 'paused' WHERE id = 'marge-durham-dog-fest-2026';

-- Remove a test or ineligible entry from drawings (the record is kept)
UPDATE entries SET eligible = 0 WHERE id = 'ENTRY-ID';

-- Record an unsubscribe
UPDATE customers SET email_suppressed = 1 WHERE email = 'person@example.com';
```

Changing an event's rules or dates makes forms that are already open ask the visitor to reload and agree to the new wording.

To export entries, use **Export CSV** on the drawing page. It includes contact details, marketing choices, suppression flags, and any draw time. Values that spreadsheet apps could run as formulas, including `+1…` phone numbers, get a leading apostrophe.

## Reuse at the next event

Add an events row (see above). Then point that event's QR code at `https://thistleandhoundpetcare.com/giveaway/?event=YOUR-NEW-EVENT-ID`. Update `defaultEvent` in `giveaway/config.js` if a plain `/giveaway/` visit, and the drawing page's default, should use the new event. Old QR links stay tied to their own drawing and show "closed" after their deadline. The prize panel on the page is The Works. Edit `giveaway/index.html` and the event rules if the prize changes.

## Customer records, consent and privacy

The deduplication and consent rules are the same as before:

- A matching email or phone finds an existing customer. If the other field doesn't match, the visitor is asked to use their earlier details or get help at the booth. People are never merged silently, and contact details are never overwritten.
- Repeat submissions for the same event return the same confirmation without a second entry and without changing earlier choices.
- Email and SMS choices are separate, unchecked, and optional. The first opt-in date is kept. A later unchecked box doesn't revoke an earlier opt-in, and the form never clears suppression flags. Only contact people who have the matching opt-in date and no suppression flag. Keep your email and SMS provider's unsubscribe list authoritative, and use a provider that handles confirmation, STOP/HELP, and unsubscribe links.
- The public API never returns customer information. Staff routes require the `ADMIN_KEY` bearer token. The server checks the closing time, validates every field, rejects the honeypot field, and requires a signed form token that is at least one second old, less than four hours old, and tied to the exact rules shown. This is basic bot protection, not a CAPTCHA.

## Local development and tests

```sh
printf 'TOKEN_SECRET=%s\nADMIN_KEY=local-staff-key-123456\n' "$(openssl rand -hex 32)" > .dev.vars
npx wrangler d1 migrations apply thistle-giveaway --local --persist-to ../.giveaway-dev-state
npx wrangler dev --persist-to ../.giveaway-dev-state   # http://localhost:8787/giveaway/ and /giveaway/draw/
node --test tests/giveaway.test.mjs   # Node 22.5+; uses Node's built-in SQLite as a stand-in for D1
```

Keep the local database outside this folder (`--persist-to`). Wrangler watches the whole site folder, so a local database inside it makes the dev server reload endlessly. `.dev.vars`, `.wrangler/`, and `*.local.sql` files are git-ignored.

## Files

- `giveaway/`: registration page (`index.html`, `giveaway.js`, `giveaway.css`, `config.js`) and printable QR codes.
- `giveaway/draw/`: winner drawing page.
- `server/worker.js`: Worker entry point that routes `/api/*` requests. All the giveaway logic is in `server/giveaway.js`.
- `migrations/`: D1 schema and the current event.
- `scripts/import-google-sheet.mjs`: one-time import from the old spreadsheet.
- `tests/`: 20 tests covering normalization, per-event uniqueness, conflicting contacts, consent, deadlines, tokens, retry safety, staff authorization, fair and non-repeating draws, CSV safety, and the sheet import.
- `wrangler.toml`, `.assetsignore`, `_headers`: Cloudflare configuration.
