# What changed: 23–24 November 2026

Everything built in the Content Engine and WhatsApp-off-Twilio sessions, in
one place: what changed, where it lives, and what is still to do. Nothing here
changes live behaviour until the settings in the runbook are flipped.

**Read next:** `docs/whatsapp-cutover-runbook.md` (the steps only you can do)
and `docs/app-azolute-one-plan.md` (the app that comes after).

## In one paragraph

The Azolute WhatsApp number (+91 94003 34868) can now move off Twilio onto
Meta's WhatsApp Cloud API. A new **WhatsApp Hub** on n8n receives every
message, keeps a log (Meta keeps none), and routes each message: Content Engine
replies go to the Content Engine, café owners' Confirm / Decline taps go to the
café, everything else waits in the inbox. The café's booking script and the
laptop inbox app can each switch from Twilio to Meta with one setting.
ClashCWL stopped using WhatsApp (it moved to Discord), so it only loses its
Twilio settings. The café also gets an optional new step: the owner confirms or
declines each booking on WhatsApp, and the guest is told.

## Decisions made with the owner

| Decision | Choice |
|---|---|
| Who receives WhatsApp messages | n8n is the front desk (the WhatsApp Hub). Each system still sends directly to Meta. |
| Switching | Every system has a Twilio/Meta setting, Twilio by default. Cutover is flipping settings, not deploying code. |
| ClashCWL | Leaves WhatsApp (moved to Discord). No code change; remove its Twilio settings on the day. |
| Café bookings | New, off by default: the owner gets Confirm / Decline; Confirm tells the guest it's booked, Decline sends a polite sorry with the café's phone. No reminder and no auto-confirm if the owner doesn't tap. |
| Café guest messages | Sent from the Azolute AI number. A guest we've never messaged first gets a separate introduction ("Hello, this is Azolute AI, the booking assistant for Toasty Turtle Cafe…"), then the decision. Returning guests get only the decision. |
| Failures | Emailed to miras@azolute.one, never including the message text. |
| Message storage | Today: n8n table `wa_messages`. Next: move to an AWS database (in the app.azolute.one plan). |
| Build style | Built in one session, then one full review by a fresh reviewer; its findings were fixed. |

## What Meta's docs said (checked 24 Nov 2026)

- Meta's new account model (live since September 2026) no longer moves numbers
  between business portfolios. The number belongs to your business; partners
  like Twilio are shared in and can be removed. So the expected path is: your
  own Meta app joins the same account, and Twilio is removed afterwards.
- Meta retries failed webhook deliveries for up to 7 days.
- Meta keeps no message history; the Hub's log is the only record.
- Since 1 October 2026 only the first 1,000 replies a month inside the 24-hour
  window are free.

## Changes, by place

### n8n (`https://n8n-jrkw.srv2144760.hstgr.cloud`)

| Item | Id | What it is | State |
|---|---|---|---|
| WhatsApp Hub | `IorCSvwB305dpU5g` | Receives every message and status (WhatsApp Trigger), logs it, ignores Meta's repeats, routes it; writes errors on the row and emails alerts | built, tested, not published |
| WhatsApp Hub · Inbox API | `BuatfauT1gooTQ9q` | What the inbox app talks to: read the log, send a reply, fetch a photo, import old chats. Needs the `X-Inbox-Key` header; successful runs aren't saved | built, tested, not published |
| WhatsApp Hub · Alerts | `M8FOdndi0Jfx2Qv6` | Emails when the Hub, the Inbox API or Owner Replies fails, when a café tap is refused, or when Meta reports a send failed | published (does nothing until a failure) |
| Content Engine · Owner Replies | `7b7LKdOUEbPPUctx` | Now called by the Hub instead of having its own WhatsApp trigger; everything after the first node unchanged | changed, not published |
| `wa_messages` table | `Cql2asOYThN8DQAY` | The message log (one row per message, with the original as Meta sent it) | created |
| `hub_settings` table | `SzK9AOIHvuDsOEGi` | The Hub's settings: Azolute's phone number id, café script address and shared secret, Graph API version, alert email | created, values `SET_ME` |
| First Hub version and a test probe | `xLTmM5tYhOVCZXWW`, `0AKOEFNPuu8nsZNH` | replaced | archived |

Tested with sample messages: text, photo, button taps, duplicates, delivery
statuses, café tap signing (matches the café script exactly), café refusals and
errors, a missing settings row (the message is still logged), inbox paging,
sending and importing.

### Café: `miras-dev/toasty`, branch `claude/whatsapp-meta`

`google-apps-script.gs` (commits `610c2f6`, `c4edb0b`, `f4735bf`):

- `WHATSAPP_PROVIDER=twilio|meta` (Twilio by default; the Twilio messages are
  exactly as before).
- Owner approval (`OWNER_APPROVAL=true`, Meta only): booking id and status in
  the Sheet, Confirm / Decline buttons, signed decisions from the Hub, the
  separate introduction for new guests, "Already confirmed" on a second tap,
  phone and date kept exactly as typed, and the owner told if Meta later says a
  guest message didn't arrive.
- `test/apps-script.test.mjs`: 25 tests (runs the script with fake Google
  services).

To use it: paste the script into Apps Script and deploy a new version (runbook
A8). Nothing changes until the Script Properties are set.

### Inbox app: `miras-dev/whatsapp-inbox`, branch `claude/whatsapp-meta`

Commits `4a5529c`, `9f1883c`:

- `INBOX_SOURCE=twilio|hub` in a `.env` file (Twilio by default).
- `hub.js`: reads and sends through the Hub; only polls while the page is open;
  re-reads the last two minutes so no message is skipped.
- `twilio.js`: the original Twilio code, moved unchanged.
- `import-twilio.js` (`npm run import-twilio`): copies old Twilio chats into the
  Hub once; safe to repeat.
- Tests: `npm test` (12 tests). README updated.

### Azolute repo (this one), now on `main`

- `docs/superpowers/specs/2026-11-24-whatsapp-off-twilio-design.md`: the design.
- `docs/superpowers/plans/2026-11-24-whatsapp-off-twilio.md`: the build plan.
- `docs/whatsapp-cutover-runbook.md`: the steps for you, with checks and undo.
- `docs/content-engine-setup.md` and `docs/n8n/content-engine-*.json`: the
  Content Engine notes and workflow exports (Owner Replies now called by the Hub).
- `docs/app-azolute-one-plan.md`: the app.azolute.one plan, with every feature,
  phases, the automation settings page and the move to AWS.
- This file.

### ClashCWL: `miras-dev/clash-cwl`

No change. On cutover day its `TWILIO_*` and `WATCH_WHATSAPP_TO` settings are
removed from both Lambda functions (runbook B7). Removing its Twilio route is a
later clean-up.

## Review: what it found and what was fixed

A fresh reviewer checked everything at the end. Fixed, each with a test:

1. Sheets could turn a digits-only German number into a number (sending to a
   US stranger) and dates into Date objects: phone and date now stay as typed.
2. Two very quick taps could message a guest twice: the status is saved before
   the next tap can read it.
3. A refused or broken café script was silent: now written on the row, emailed,
   and the owner is told.
4. A guest message Meta rejected later still said "done": the owner is now told
   it didn't arrive.
5. The inbox could, rarely, miss a message: it re-reads the last two minutes.
6. A missing settings row lost messages: they're logged first, then the Hub
   stops and emails.

Runbook additions from the review: check the café template's exact name and
language code, set the guest confirmation template if that option is on, and
dry-run the café link before switching approval on.

## Still to do

**You (in order, see the runbook):**

1. Part A, before the day: check the Twilio webhook; check who owns the number
   in Meta; business verification if asked; create the Meta app and System
   User token; submit the templates; fill in the n8n credentials and settings;
   test on Meta's free test number; paste the new café script.
2. Part B, cutover day (about an hour).
3. Part C, after: remove Twilio as a partner, close Twilio, check the US number
   (+1 754…) is unused before releasing it, and switch on café approval when the
   café owner agrees.

**Open pull requests / merges:** the `claude/whatsapp-meta` branches in
`toasty` and `whatsapp-inbox` aren't merged yet.

**Small things left for later** (none loses a message):

- Two copies of the same message, or the same tap, arriving at the same instant
  can both pass; out-of-order delivery statuses can move a status backwards.
- Template messages show as empty bubbles in the inbox.
- Content Engine failures email twice.
- Running the Twilio import long after cutover can add some duplicates.
- The café's new columns (F–H) overwrite anything the owner put there; a
  returning guest whose introduction failed won't get it again.
- No git export of the Hub, Inbox API and Alerts workflows (n8n keeps their
  version history).
- n8n canvases aren't grouped (cosmetic).

**Next project:** app.azolute.one, starting with login, clients, the automation
settings page, health, and the WhatsApp inbox on an AWS message store
(`docs/app-azolute-one-plan.md`).
