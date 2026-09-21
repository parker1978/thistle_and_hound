# Thistle & Hound event giveaway

The page and Google Sheets integration code are ready. The private spreadsheet and Apps Script project have been created. **Google authorization, web-app deployment, and website publication are still pending.** The page shows a registration-not-ready message until the form URL is configured. Never collect entries through the local test preview.

## This event

- 37th Annual Marge Durham Walk and Dog Fest
- Event ID: `marge-durham-dog-fest-2026`
- Entries close Sunday, September 27, 2026 at 3:30 PM America/Chicago (Central Daylight Time).
- Winner drawn that day at 5:00 PM Central. This software does not select or contact the winner automatically.
- Prize: one free **The Works** deluxe grooming package for one dog, worth over $200 depending on size. Bath, blow dry, nails, teeth and ears, plus anal gland expression, sanitary shave and paw shave if needed.
- Entry URL after publishing: `https://thistleandhoundpetcare.com/giveaway/?event=marge-durham-dog-fest-2026`

## Current Google resources

- Private registrations sheet: https://docs.google.com/spreadsheets/d/1cSsDUJ1EHrfYpnTLYf45qDgPlczCehSzUwdrOjSUpgc/edit
- Apps Script project: https://script.google.com/home/projects/1FK7XGmIafA0sn3HbGGFsYBNkeME1NkdWZr6Ro68BoMbUHvCtxTygGnvm/edit
- The event row, September 27 closing/drawing times, Chicago timezone, and private sharing have been verified.

## Connect Google once

1. Open the existing Apps Script project linked above while signed into parker1978@gmail.com.
2. Name it **Thistle & Hound — Giveaway registrations**. Copy `google-apps-script/Code.gs` into the project's Code.gs. Add an HTML file named **Form** and copy `google-apps-script/Form.html` into it.
3. In Project Settings, show the `appsscript.json` manifest, and replace it with the supplied `google-apps-script/appsscript.json`. It uses the Chicago time zone and only the Google Sheets permission.
4. Run **setupGiveaway_** from the editor. The account owner must authorize Google Sheets access. It connects to the private spreadsheet already created, checks its tables, initializes the form signing secret, and prints the spreadsheet URL in the execution log. Run this setup only from the editor; the trailing underscore prevents visitors from calling it. Do not remove that underscore.
5. Open the spreadsheet. Review the **Events** row, especially eligibility and rules. No age or geographic restriction was supplied, so none has been invented. Add any applicable service-area limits before launch. Status is `open`, with an opening date of September 21 and automatic closing at the configured deadline. Change status to `paused` to stop entries at any time. Keep the spreadsheet's sharing set to **Restricted**.
6. Deploy the script as a **Web app**, executing as **Me** (the owner), with access for **Anyone**. This exposes only the public entry form and its two narrow registration functions; it does not publish the spreadsheet. If your Google account does not allow anonymous web apps, use an account that does or arrange another form backend. Do not set execution to the visiting user: visitors should not have to sign in.
7. Copy the deployment URL ending in `/exec` into `formUrl` in `giveaway/config.js`. Keep the default event ID as supplied. No spreadsheet ID, secret, or Google credential goes into the public website.
8. Publish the repository through your existing website workflow. The new route is `/giveaway/`; the home page is unchanged. This page needs no build system or server on your web host.
9. Before printing the QR: open the public URL in a signed-out/private browser and on a real phone. Submit a clearly labeled test entry using contact details you control. Confirm one Customers row and one Entries row; submit the same details again and confirm no extra row. Remove that test entry before the drawing. Confirm the rules and times displayed, and that your anonymous Google deployment works. The actual Google deployment and real Google Sheet writes cannot be verified by local tests.

Editing Apps Script code requires creating a new version under **Manage deployments → Edit**, retaining the existing deployment URL. Changes to Events rows are read immediately and do not require a code deployment.

## Customer records and entries

**Customers** stores one canonical contact record and a generated customer ID. Email is trimmed/lowercased; common US phone formats normalize to `+1…`. A matching email or phone finds an existing record. If the other contact field conflicts, the form asks the visitor to use their earlier details or get staff help. It does not silently merge people or overwrite someone else's contact information. Shared household contacts may need staff assistance. A person changing both email and phone cannot be reliably deduplicated without identity verification; this flow does not perform email/SMS verification.

**Entries** stores one row per customer per event, including dog details, event name/ID, entry time, marketing choices, and the exact consent/rules text. A returning customer can enter each new event. Repeat submissions for the same event return the same confirmation without creating another entry or changing earlier choices. Use customer_id to connect entries to contact details. Pet details remain with the event entry so earlier registrations remain intact; there is no duplicate customer list per event.

**Events** controls name, opening/closing/drawing times, eligibility, rules, and open/paused status. Keep header names and order unchanged. Event IDs are permanent lowercase letters, numbers, and hyphens. Times should be ISO 8601 text with a timezone offset, for example `2026-09-27T15:30:00-05:00`. Do not rename IDs after accepting entries. Rules/date changes invalidate already-open forms so visitors must reload and agree to the updated terms.

The server serializes submissions with a lock, rechecks closing time after acquiring it, and recovers from interrupted writes without adding duplicate entries. It escapes user-entered spreadsheet formulas. No public function returns customer information. All owner/helper functions have private names ending in `_`. The public app has no email-sending, texting, spreadsheet-reading export, or drawing-selection endpoint.

## Marketing choices

Email and SMS choices are separate, unchecked, and optional. Entry is allowed with neither selected. The Entries table holds the audit trail with timestamp, event and exact consent wording. Customers has first opt-in dates as a convenient summary. A later unchecked box does not revoke a prior subscription, and a duplicate entry does not update preferences.

Record an unsubscribe by setting `email_suppressed` or `sms_suppressed` to `yes` on the customer. The form never clears these suppression columns. Only use contacts with the corresponding opt-in date and an empty suppression column, and carry over your email/text provider's unsubscribe list. Keep provider-side suppression authoritative. Collecting a number does not verify ownership. This stores signup requests; it does not enroll people in a provider or send messages. Use an email/SMS provider that handles confirmation, unsubscribe links, and STOP/HELP responses before sending campaigns.

## Reuse at the next event

Add another Events row with a new event ID, name, dates, eligibility, rules and status. Keep the existing Customers and Entries tabs. Make that event's QR point to:

`https://thistleandhoundpetcare.com/giveaway/?event=YOUR-NEW-EVENT-ID`

The page reads the event ID from its URL, and the form reads its event details from the private spreadsheet. Update `defaultEvent` in `giveaway/config.js` if a plain `/giveaway/` visit should use the new event. Old event QR links stay attached to their own drawing and show closed after their deadline. This version reuses **The Works** prize; edit the prize page and event rules if the prize changes.

## Files and verification

- `giveaway/`: static branded landing page and public form URL configuration.
- `google-apps-script/`: backend and hosted entry form. Copy these files into Apps Script.
- `giveaway/marge-durham-2026-qr.png` and `.svg`: printable event QR assets. They point to the final website URL, which must be live before use.
- `tests/giveaway.test.cjs`: run `node --test tests/giveaway.test.cjs` (Node 18+). Fifteen tests cover normalization, per-event uniqueness, contacts that conflict, consent, expiry, malicious cell values, retry recovery and privacy.

The integration uses Google's supported [HTML-service RPC](https://developers.google.com/apps-script/guides/html/communication) and [web-app deployment](https://developers.google.com/apps-script/guides/web). It uses an embedded Google-hosted form instead of relying on cross-origin submission tricks. A direct-form link is available if embedding is blocked. Basic bot checks are a honeypot and a short-lived signed form token; this is not a CAPTCHA or a high-volume abuse prevention system. Google account quotas apply. Verify the live anonymous deployment before the event.
