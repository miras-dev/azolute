# WhatsApp off Twilio: design

Date: 2026-11-24. Status: **approved** (owner asked for a cofounder review
and approval; the review's changes are in "Cofounder review" below).
Owner's two rules: **nothing breaks**, and it makes our lives easier.
Revised the same day after a Q&A with the owner: ClashCWL leaves WhatsApp
(it moved to Discord), and the café gets an owner approval step.

## Why

The business number **Azolute AI, +91 94003 34868** (the owner's own SIM)
sends and receives WhatsApp through Twilio. Twilio adds $0.005 to every
message in or out. That is more than Meta's own utility fee for India. It
also keeps Azolute's WhatsApp stack in someone else's hands, and the
Content Engine and the WhatsApp AI agent Azolute sells should run on a
stack Azolute controls.

Goal: the same number, display name and limits, used directly on Meta's
WhatsApp Cloud API from the owner's own Meta Business portfolio, with
every system that uses it switched over and Twilio closed.

## Goals, non-goals, anti-goals

Goals

- One receiver (the **WhatsApp Hub** on n8n) gets every incoming message
  and status, logs it, and routes it.
- Every sender (the café script, the Content Engine, the inbox) can
  switch between Twilio and Meta with **one setting**. The code ships
  before cutover day, and on cutover day only settings change.
- The inbox keeps working: read chats, reply, see photos, alerts.
- The café owner approves each booking on WhatsApp (Confirm / Decline),
  and the guest is told from the Azolute AI number. Built behind a
  setting that stays off until the café owner agrees.
- Tokens live only in n8n credentials, Script Properties and the inbox's
  gitignored `.env`. Never in code, commits or chat.

Non-goals

- The WhatsApp AI agent itself. The Hub leaves a clear slot for it
  ("everything else"), nothing more.
- Template sending from the inbox (it can't today either).
- Read receipts, typing indicators, reactions.

Anti-goals (a failure even if it works)

- A message lost or silently dropped during cutover.
- A client's chat sent to a system that has no business with it (for
  example a stranger's message treated as a café owner's decision).
- A guest told "confirmed" for a booking the owner didn't confirm, or
  told twice.
- Cutover day needing a code deploy to roll back.

## What Meta's docs say now (checked 2026-11-24)

These differ from what we assumed, so they shape the plan:

- **Meta's new WhatsApp account model is live** (GA 23 Sep 2026, all
  businesses by mid-October). A *WhatsApp account* holds the phone number
  and is always owned by the business. A *Messaging account* (same id as
  the old WABA id) holds templates, billing and webhook subscriptions,
  and each partner can have its own. Partners are **shared in**, and the
  business can remove them later.
- **Moving a number to another business portfolio is not supported** in
  the new model ("can't be moved to another business portfolio"). The old
  "migrate number between WABAs" flow (2FA off, SMS code, register)
  doesn't apply to these accounts.
- So the expected path is: the number is already in the owner's
  portfolio (Twilio's Self Sign-up creates it there); the owner's own
  Meta app subscribes to it, and Twilio is unshared afterwards. Meta says
  this path needs no phone re-verification and conversations go on
  uninterrupted. **This has to be confirmed in Business settings first**
  (runbook step 1); see "Cutover paths" below.
- Templates belong to the Messaging account they were made in. If we end
  up on our own Messaging account, templates are recreated there; if we
  use the existing one, they stay.
- Webhooks: on a non-200 answer Meta retries "with decreasing frequency
  ... for up to 7 days", and retries can arrive twice. Payloads are signed
  (`X-Hub-Signature-256`, HMAC-SHA256 of the body with the app secret).
  Max payload 3 MB.
- There is no API for past messages: "you will not be able to query
  historical webhook event notification data". So the Hub's log is the
  only history.
- Media: `GET /{media-id}` with the token gives a URL that **expires after
  5 minutes**; webhook media ids expire after 7 days.
- Pricing (since 1 Oct 2026): 1,000 free service messages a month, then
  service replies are charged too; utility templates are charged per
  delivered message by country. Still cheaper than Twilio's fee on top.
- Registration (`POST /{phone-number-id}/register` with a 6-digit pin)
  is only needed if the number is not already registered; re-registering
  a registered number succeeds without resetting the PIN. Meta is phasing
  out the PIN for eligible numbers.

## Approaches

Chosen in the earlier conversation: **A, n8n is the front desk.** Meta
sends all incoming traffic for an app to one webhook and keeps no history,
so one receiver must log and route everything. The Hub on n8n does that;
every system still sends directly through the Graph API.

Considered and not chosen:

- **B, ClashCWL's Lambda stays the receiver** and forwards the rest (as it
  does with Twilio today). Ruled out, and now moot: ClashCWL no longer
  uses WhatsApp.
- **C, everything sends through the Hub too** (token only in n8n). Fewer
  token copies, but the café's booking alert would then fail whenever n8n
  is down. Kept as an option for later; the Hub's send
  endpoint (below) makes it easy.

## Design

### 1. WhatsApp Hub (new n8n workflow)

One public webhook, for example
`https://n8n-jrkw.srv2144760.hstgr.cloud/webhook/whatsapp-hub`.

- **GET**: Meta's verification handshake. Answers `hub.challenge` when
  `hub.verify_token` matches the stored verify token; 403 otherwise.
- **POST**: check `X-Hub-Signature-256` against the raw body with the app
  secret. Bad signature: drop and log it (no processing). Good: answer
  200 quickly, then process. A failure after the 200 must not lose the
  message: the raw event is written to the log first, before routing.
- Split the payload into one item per message and per status
  (`entry[].changes[].value.messages[]` / `.statuses[]`), with
  `metadata.phone_number_id` and the contact's profile name.
- **Dedupe** on the message id (`wamid`), since Meta can deliver twice.

Log table **`wa_messages`** (n8n data table), one row per message:

| Column | Meaning |
|---|---|
| `wamid` | Meta's message id (unique) |
| `direction` | `in` or `out` |
| `phone_number_id` | which business number |
| `contact` | the other side, digits only (`919…`) |
| `contact_name` | WhatsApp profile name, when Meta sends it |
| `type` | text, image, button, interactive, audio, document, … |
| `text` | text body or caption, or the button title |
| `payload` | button / interactive reply id (e.g. `approve:<post_id>`) |
| `media_id`, `media_mime` | for media |
| `status` | for `out`: sent, delivered, read, failed |
| `error` | Meta's error, if any |
| `source` | who sent an `out` row: `inbox`, `toasty`, `content`, `hub` |
| `routed_to` | for `in`: `content`, `toasty`, `none` |
| `at` | Meta's timestamp |

Status webhooks update the matching `out` row. Messages sent directly by
other systems have no row yet, so a status creates one (type and text
unknown). Senders set Meta's `biz_opaque_callback_data` to their system
name (`toasty`, `content`), which Meta echoes in status
webhooks, so the Hub can fill in `source`. (Builder: confirm this field
is echoed; if not, `source` stays empty for those rows.)

**Routing** (for each `in` message, in this order):

1. **Content Engine actions**: if the sender is a client's
   `owner_whatsapp` in `content_settings` (matched on the business
   `phone_number_id`), and the message is a button reply
   `approve:/edit:/skip:<post_id>`, or any text while one of that
   client's posts is `awaiting_edit`, or a photo: call Owner Replies as a
   sub-workflow with the normalised message.
2. **Café decisions**: a button reply whose payload starts `toasty:`
   (`toasty:confirm:<booking_id>` or `toasty:decline:<booking_id>`), on
   Azolute's own number (`AZOLUTE_PHONE_NUMBER_ID`): POST it to the café
   script (section 5). The script checks the sender is one of the café's
   owner numbers and answers with a line for the owner; the Hub sends that
   line back to the owner (free text, inside the window their tap just
   opened) and logs it (`source=hub`).
3. **The owner's other messages**: still go to Owner Replies, which
   answers with its "how it works" note, as it does today. (My call:
   keeps today's behaviour; the owner's number is their personal one and
   only talks to the business number for content.)
4. **Everything else**: stays in the log for the inbox. This is the slot
   for the WhatsApp AI agent later.

**Other businesses' numbers** (my call): when a Content Engine client's
number is later added to the same Meta app, its traffic reaches the same
Hub. Only rules 1 and 3 apply to it; it never goes to the café, and the
inbox API only returns rows for `AZOLUTE_PHONE_NUMBER_ID`. Their chats
stay in the log, tagged with their `phone_number_id`, for their own
inbox or agent later.

Routing failures (sub-workflow error, café script down) are written to the
row's `error`; the message is already logged, so nothing is lost.

### 2. Inbox API (on the Hub, same workflow or a sibling)

Three endpoints, all behind an n8n Header Auth credential (a long random
key the inbox sends as a header):

- `GET /webhook/wa-inbox/messages?since=<ISO time>`: rows created or
  updated since then (paged), newest last.
- `POST /webhook/wa-inbox/send` `{to, text}`: sends a text through the
  Graph API, logs it with `source=inbox`, returns the row (or Meta's
  error, e.g. outside the 24-hour window).
- `GET /webhook/wa-inbox/media?id=<media_id>`: fetches the file from Meta
  (new URL each time, since URLs live 5 minutes) and returns the bytes.

The Meta token stays on the server (in n8n). The inbox only holds the
Hub key.

### 3. The inbox (`miras-dev/whatsapp-inbox`)

- New setting `INBOX_SOURCE=twilio|hub` (default `twilio` until cutover),
  plus `HUB_URL` and `HUB_KEY`, read from a `.env` file next to
  `server.js` (already gitignored).
- In `hub` mode, `server.js` keeps an in-memory copy of the log, polls
  `messages?since=` every 5 s, and builds conversations and threads from
  it in the shape the page already uses. The page (`public/`) does not
  change, except contact names can fall back to the WhatsApp profile name.
- Send and media go through the Hub endpoints.
- **One-time history import** (my call, cheap): `npm run import-twilio`
  copies the Twilio message log into `wa_messages` (through a Hub import
  endpoint, same key), so old client chats stay visible after Twilio
  closes. Run it on cutover day, after the switch.
- README updated (costs, settings, how it works).

### 4. ClashCWL (`miras-dev/clash-cwl`)

ClashCWL no longer uses WhatsApp (hunter alerts moved to Discord). No
code change (my call: nothing there can break). On cutover day its
`TWILIO_*` and `WATCH_WHATSAPP_TO` settings are removed from the Lambda
functions and the Twilio sender's webhook stops pointing at it. Its
`/twilio/whatsapp` route and `twilio.mjs` can be deleted in a later
ClashCWL clean-up, following its `AGENTS.md`.

### 5. Toasty Turtle Cafe (`miras-dev/toasty`, Apps Script)

**Provider switch**

- Script Property `WHATSAPP_PROVIDER=twilio|meta` (default `twilio`).
- `meta` uses `META_WA_TOKEN`, `META_WA_PHONE_NUMBER_ID`, template names
  in properties, `TEMPLATE_LANG`. Same `templateVar` cleaning. Errors stay
  caught, so the Sheet and email keep working.
- `setup()` checks the settings for the chosen provider; `testWhatsApp()`
  works for both.

**Owner approval for reservations** (setting `OWNER_APPROVAL=true`, off by
default; until it's on, the café works exactly as today)

What the owner told us: today the alert goes to the café owner only, and
guests hear nothing. Most bookings are for the next 12 hours.

1. A reservation comes in. As today: row in the Sheet, email, WhatsApp to
   the owner. With approval on, the row also gets a booking id and the
   status **Waiting**, and the owner's WhatsApp is the
   `toasty_booking_request` template with two quick-reply buttons,
   **Confirm** and **Decline**, whose payloads are
   `toasty:confirm:<booking_id>` and `toasty:decline:<booking_id>`.
   Messages and franchise enquiries keep the plain alert.
2. The owner taps. The Hub posts `{action:"decision", booking, decision,
   from}` to the script's web app (`doPost`), signed with a shared secret
   (`HUB_SECRET` in Script Properties and in an n8n credential). Apps
   Script can't read request headers, so the HMAC goes in the body with a
   timestamp, and requests older than 10 minutes are refused.
3. The script checks `from` is one of `OWNER_WHATSAPP_TO`, finds the row,
   and only if it is still **Waiting**:
   - **Confirm**: sends the guest the confirmation, sets **Confirmed**.
   - **Decline**: sends the guest the polite "sorry", sets **Declined**.
   It answers the Hub with the owner's line, e.g. "Done: Anna (2 guests,
   24/12 19:00) has been told it's confirmed." A second tap, or a tap by
   another owner number after the first, answers "Already confirmed" (or
   declined) and sends the guest nothing.
4. No tap: nothing happens. The row stays **Waiting** (owner's call; no
   reminder, no auto-confirm).

**What the guest gets** (owner's wording; Utility templates, since the
guest hasn't messaged us)

- **A guest we've never messaged gets two separate messages**, in this
  order (owner's call):
  1. The introduction, `toasty_intro`: "Hello, this is Azolute AI, the
     booking assistant for Toasty Turtle Cafe. We'll send updates about
     your booking here."
  2. The decision (below).
- **A returning guest** gets only the decision.
- The decision templates:
  - `toasty_booking_confirmed`: "Toasty Turtle Cafe: your table for {{1}}
    on {{2}} has been confirmed. See you soon!" ({{1}} guests, {{2}} the
    form's "Date & Time" as typed.)
  - `toasty_booking_declined`: "Toasty Turtle Cafe: sorry, we can't take
    your booking for {{1}}. Please call {{2}} to find another time." ({{1}}
    the date and time, {{2}} `CAFE_PHONE`.)
- The same rule applies to a decline (my call: the guest should know who
  is writing either way).
- If the introduction fails, the decision is still sent (it's the one that
  matters); the failure is noted in the owner's reply.
- Cost: a new guest is two template messages, a returning guest one.
- "First time" means no earlier row in the Reservations tab for that
  phone number has had a guest message sent. The tab gets three new
  columns at the end: Booking ID, Status, Guest told (added to the
  existing header row if missing).
- If the guest replies, it lands in the Azolute inbox like any other chat.


### 6. Content Engine (n8n, branch `claude/kind-cannon-5bluac`)

- Owner Replies loses its own WhatsApp Trigger and starts with an
  "Execute Workflow" trigger fed by the Hub; its first node reads the
  Hub's normalised message. Everything after stays the same.
- Already sends through Meta, so no provider flag needed. Fill
  `wa_phone_number_id` in `content_settings` and the WhatsApp credential.
- `content_review` template created in the Messaging account we use.
- `docs/content-engine-setup.md` and the JSON exports updated.

### 7. Templates

Create in the Messaging account we end up on (keep the old ones if we
stay on the existing account and they are still there):

- Café owner alert `toasty_new_submission` (body in the script's header).
- Café owner booking request `toasty_booking_request`: the reservation
  details plus Confirm / Decline quick-reply buttons.
- The three café guest templates in section 5 (`toasty_intro`, `toasty_booking_confirmed`, `toasty_booking_declined`).
- `content_review` (spec in `docs/content-engine-setup.md`).

They can be submitted before cutover day, so approval isn't on the
critical path.

## Cutover paths

Runbook step 1 is to open Meta Business settings and look at the number's
WhatsApp account and Messaging account: which portfolio owns them, and
which apps/partners they are shared with.

- **Path 1 (expected): our portfolio owns the WhatsApp account and the
  Messaging account.** Our Meta app subscribes to the Messaging account
  (`POST /{waba-id}/subscribed_apps`), a System User token gets access,
  the Hub becomes the webhook, then Twilio is unshared. No new phone
  verification; templates stay.
- **Path 2: the WhatsApp account is ours, but the Messaging account is
  Twilio's.** Our app gets its own Messaging account on the same number
  (Meta creates one per partner). Number, name and limits stay; templates
  are recreated in ours (done ahead of time).
- **Path 3 (only if both are blocked): delete the sender in Twilio, then
  register the number fresh** in our portfolio. Loses display-name
  approval and limits. Needs 2FA off first and an SMS/voice code to the
  SIM.

The code and settings are the same on all three paths; only the Meta
steps in the runbook differ.

## Cutover order (summary; full runbook is a separate deliverable)

Before the day (no effect on live traffic):

0. **Check:** in Twilio, note the sender's "A message comes in" URL, and
   ClashCWL's `TWILIO_FORWARD_URL`. ClashCWL is leaving WhatsApp, so the
   only question is whether anything else is behind the forward URL. If
   so, it gets a route before cutover.
1. Meta: app, System User token, Business verification if Meta asks for it.
2. Templates submitted and approved.
3. Hub built and tested with Meta's free test number.
4. Café script pasted and inbox updated, both still on `twilio`;
   `OWNER_APPROVAL` off.

On the day, in a quiet hour:

1. Meta steps for the path found above; Hub set as the webhook.
2. Send a test message to the number: it shows in `wa_messages`.
3. Flip settings: café Script Properties; remove ClashCWL's `TWILIO_*`
   settings; inbox `.env`; Content Engine settings row + credential;
   publish the Hub, Owner Replies, Render & Preview.
4. Check each system: café `testWhatsApp` and a test reservation; inbox send and
   receive; Content Engine "Make One Now".
5. Unshare Twilio from the accounts; run the inbox history import.
6. After a quiet week: close Twilio. Check that nothing uses the US number
   (+1 754…, $1.15/month) before releasing it.

Rollback, until Twilio is unshared: set the providers back to `twilio`
and point the webhook back. No deploy needed.

## Cofounder review (changes made on approval)

Read against the two rules, nothing breaks and life gets easier:

1. **Know what's on the Twilio webhook before the day.** ClashCWL is
   leaving WhatsApp, but whatever its forward URL points at is checked
   first, so no one loses replies.
2. **We hear about failures instead of finding them.** A small n8n error
   workflow emails `miras@azolute.one` (existing SMTP credential) when the
   Hub or Owner Replies fails, and when a Hub row records a routing error
   or a send fails. The café script already logs its errors, and the
   owner hears about a failed guest message in the reply to their tap.
3. **The inbox mustn't flood n8n.** Polling every 5 s is about 17,000
   runs a day. The inbox server only polls the Hub while the page is open
   (a request in the last 30 s), and the inbox API workflow doesn't save
   successful executions.
4. **One page for cutover day.** The runbook is a single checklist, with
   the exact value to type at each step and the undo for each step next
   to it, so cutover can be done calmly and stopped at any point.

## What's left to the builder

- Exact n8n node choices (Webhook vs WhatsApp Trigger node; how the raw
  body is HMAC-checked on this instance; how data-table filters handle
  `since`).
- Whether the inbox API lives in the Hub workflow or its own workflow.
- Exact log retention (start: keep everything; revisit when the table is
  large).
- Graph API version (current stable at build time).
