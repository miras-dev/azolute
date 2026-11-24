# WhatsApp off Twilio: design

Date: 2026-11-24. Status: draft for approval.

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
- Every sender (ClashCWL, the café script, the Content Engine, the inbox)
  can switch between Twilio and Meta with **one setting**. The code ships
  before cutover day, and on cutover day only settings change.
- The inbox keeps working: read chats, reply, see photos, alerts.
- Tokens live only in n8n credentials, Lambda environment variables and
  Script Properties. Never in code, commits or chat.

Non-goals

- The WhatsApp AI agent itself. The Hub leaves a clear slot for it
  ("everything else"), nothing more.
- Template sending from the inbox (it can't today either).
- Read receipts, typing indicators, reactions.

Anti-goals (a failure even if it works)

- A message lost or silently dropped during cutover.
- A client's chat sent to a system that has no business with it (for
  example ordinary client chats forwarded to ClashCWL).
- Anything that shows a defender's name (ClashCWL rule; nothing here
  touches that, but the Hub must not log ClashCWL alert bodies anywhere
  public).
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
  does with Twilio today). It ties the Content Engine and the inbox to a
  Clash product's deploys and puts client chats through it.
- **C, everything sends through the Hub too** (token only in n8n). Fewer
  token copies, but the café booking alert and hunter alerts would then
  fail whenever n8n is down. Kept as an option for later; the Hub's send
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
| `source` | who sent an `out` row: `inbox`, `clashcwl`, `toasty`, `content`, `hub` |
| `routed_to` | for `in`: `content`, `clashcwl`, `none` |
| `at` | Meta's timestamp |

Status webhooks update the matching `out` row. Messages sent directly by
other systems have no row yet, so a status creates one (type and text
unknown). Senders set Meta's `biz_opaque_callback_data` to their system
name (`clashcwl`, `toasty`, `content`), which Meta echoes in status
webhooks, so the Hub can fill in `source`. (Builder: confirm this field
is echoed; if not, `source` stays empty for those rows.)

**Routing** (for each `in` message, in this order):

1. **Content Engine actions**: if the sender is a client's
   `owner_whatsapp` in `content_settings` (matched on the business
   `phone_number_id`), and the message is a button reply
   `approve:/edit:/skip:<post_id>`, or any text while one of that
   client's posts is `awaiting_edit`, or a photo: call Owner Replies as a
   sub-workflow with the normalised message.
2. **ClashCWL** (Azolute's own number only, `AZOLUTE_PHONE_NUMBER_ID`):
   if the text is one word from STOP / PAUSE / OFF / START / RESUME / ON /
   STATUS (case and punctuation ignored): POST it to ClashCWL's new
   inbound endpoint (below). If ClashCWL answers with a reply, the Hub
   sends it to the hunter and logs it (`source=hub`). ClashCWL itself
   still ignores numbers that aren't on its alert list, and only these
   words are ever sent there.
3. **The owner's other messages**: still go to Owner Replies, which
   answers with its "how it works" note, as it does today. (My call:
   keeps today's behaviour; the owner's number is their personal one and
   only talks to the business number for content.)
4. **Everything else**: stays in the log for the inbox. This is the slot
   for the WhatsApp AI agent later.

**Other businesses' numbers** (my call): when a Content Engine client's
number is later added to the same Meta app, its traffic reaches the same
Hub. Only rules 1 and 3 apply to it; it never goes to ClashCWL, and the
inbox API only returns rows for `AZOLUTE_PHONE_NUMBER_ID`. Their chats
stay in the log, tagged with their `phone_number_id`, for their own
inbox or agent later.

Routing failures (sub-workflow error, ClashCWL down) are written to the
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

Follows its `AGENTS.md`: read `docs/PLATFORM_PLAN.md` first, update
`lambda/README.md` and `DEFENSE_SETUP.md`.

- New `lambda/whatsapp.mjs`: `whatsappFromEnv(env)` returns Twilio's
  sender (`twilioFromEnv`, unchanged) or a new Meta sender, picked by
  `WHATSAPP_PROVIDER=twilio|meta` (default `twilio`). Both have the same
  shape `{ send, envNumbers, recipients, template }`, so `watch.mjs` does
  not change (its parameter keeps the name `twilio`).
- Meta sender settings: `META_WA_TOKEN`, `META_WA_PHONE_NUMBER_ID`,
  `META_WA_TEMPLATE` (template name; its one `{{1}}` takes the whole
  alert through the existing `oneLine`), `META_WA_TEMPLATE_LANG`
  (default `en`), `META_GRAPH_VERSION`. No template set: free text (only
  works inside the 24-hour window, as with Twilio today).
- `index.mjs` uses `whatsappFromEnv()` wherever it used `twilioFromEnv()`
  for sending.
- New inbound route `/whatsapp/inbound`: JSON `{from, body}` from the Hub,
  checked with HMAC-SHA256 over the raw body using `WHATSAPP_HUB_SECRET`
  (header `X-Hub-Key-Signature`). Calls the existing `watch.inbound` and
  answers `{reply}` or `{reply:null}`. The old `/twilio/whatsapp` route
  stays until Twilio is closed, then can be removed.
- Admin error text that names the Twilio variables names both providers.
- Tests in `test/watch.test.mjs` (or a new `test/whatsapp.test.mjs`): Meta
  send request shape (template and free text), provider switch, inbound
  signature good/bad, STOP/START through the new route.
- Deployed by the owner, with `WHATSAPP_PROVIDER` still `twilio`.

### 5. Toasty Turtle Cafe (`miras-dev/toasty`, Apps Script)

- Script Property `WHATSAPP_PROVIDER=twilio|meta` (default `twilio`).
- `meta` uses `META_WA_TOKEN`, `META_WA_PHONE_NUMBER_ID`,
  `OWNER_TEMPLATE` (e.g. `toasty_new_submission`, 3 body variables),
  `CONFIRMATION_TEMPLATE` (3 variables: name, date and time, guests),
  `TEMPLATE_LANG`. Same `templateVar` cleaning. Errors stay caught, so
  the Sheet and email keep working.
- `setup()` checks the settings for the chosen provider; `testWhatsApp()`
  works for both.
- The owner pastes the new script into Apps Script before cutover.

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

- ClashCWL alert: Utility, one variable, e.g. `Watch alert: {{1}}`.
- Café owner alert `toasty_new_submission` (body in the script's header).
- Café guest confirmation (3 variables).
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

1. Meta: app, System User token, Business verification if Meta asks for it.
2. Templates submitted and approved.
3. Hub built and tested with Meta's free test number.
4. ClashCWL deployed, café script pasted, inbox updated, all still on
   `twilio`.

On the day, in a quiet hour:

1. Meta steps for the path found above; Hub set as the webhook.
2. Send a test message to the number: it shows in `wa_messages`.
3. Flip settings: ClashCWL `WHATSAPP_PROVIDER=meta` + `META_*`; café Script
   Properties; inbox `.env`; Content Engine settings row + credential;
   publish the Hub, Owner Replies, Render & Preview.
4. Check each system: ClashCWL admin "Send a test message" and a STOP /
   START from a hunter number; café `testWhatsApp`; inbox send and
   receive; Content Engine "Make One Now".
5. Unshare Twilio from the accounts; run the inbox history import.
6. After a quiet week: remove Twilio settings, the `/twilio/whatsapp`
   route, and close Twilio. Check that nothing uses the US number
   (+1 754…, $1.15/month) before releasing it.

Rollback, until Twilio is unshared: set the providers back to `twilio`
and point the webhook back. No deploy needed.

## Open question (owner)

- **What is `TWILIO_FORWARD_URL` set to** on ClashCWL's API function
  today? ClashCWL forwards every message that isn't STOP/START to it, and
  whatever it answers goes back to the customer. If it's set, a live
  system (bookings or an auto-reply) is behind it, and it needs its own
  branch in the Hub and maybe its own provider switch, built before
  cutover day.

## What's left to the builder

- Exact n8n node choices (Webhook vs WhatsApp Trigger node; how the raw
  body is HMAC-checked on this instance; how data-table filters handle
  `since`).
- Whether the inbox API lives in the Hub workflow or its own workflow.
- Exact log retention (start: keep everything; revisit when the table is
  large).
- Graph API version (current stable at build time).
