# WhatsApp off Twilio: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every system that uses +91 94003 34868 can switch from Twilio to Meta's Cloud API by a setting. A WhatsApp Hub on n8n receives, logs and routes all inbound traffic. A one-page runbook covers cutover day.

**Architecture:** Inbound: Meta → n8n *WhatsApp Hub* (verify signature, log to `wa_messages`, route to Content Engine / café / log only). Outbound: each system calls the Graph API directly, picked by `WHATSAPP_PROVIDER`. The local inbox reads and sends through authenticated Hub endpoints, so the Meta token stays in n8n.

**Tech Stack:** n8n (self-hosted, via the n8n MCP tools), Node 20 ESM with no packages (inbox), Google Apps Script (café), Meta Graph API.

**Spec:** `docs/superpowers/specs/2026-11-24-whatsapp-off-twilio-design.md` (read it first).

## Global Constraints

- Owner's rules: **nothing breaks**, and it makes our lives easier.
- Every provider switch defaults to `twilio`. Shipping code must not change live behaviour until a setting is flipped.
- Tokens and secrets only in n8n credentials, Script Properties or the inbox's gitignored `.env`. Never in code, commits, tests (use fake values like `test-token`) or chat.
- ClashCWL: no code changes (it no longer uses WhatsApp).
- The inbox stays dependency-free (Node built-ins only), in the existing comment and code style.
- Graph API base: `https://graph.facebook.com/<version>`; default version `v23.0` unless a newer stable one is current at build time, set by config, never hard-coded in more than one place per system.
- Phone numbers to Meta: digits only, no `+` (`919207404868`).
- n8n: call `get_user_preferences` and `get_workflow_sdk_reference` before building; workflows stay unpublished until cutover day, except where a task says otherwise.
- Repos: branch `claude/whatsapp-meta` in `toasty` and `whatsapp-inbox`; `azolute` stays on `claude/kind-cannon-5bluac`. The owner is allowing push access for `toasty`.

## Review Focus

1. **Meta delivers the same message twice** (retries). Expected: one row in `wa_messages`, routed once. Pinned in Task 3 (dedupe test) and Task 4.
2. **A status webhook arrives for a message the log has never seen** (sent directly by the café script or Content Engine). Expected: a new `out` row, no error. Pinned in Task 3.
3. **The café owner taps Confirm twice, or two owner numbers tap at once.** Expected: the guest is told once; the second tap hears "Already confirmed". Pinned in Task 2.
4. **A send outside the 24-hour window** (inbox reply, free-text fallback). Expected: Meta's error shown to the person, not a crash; the café's Sheet and email still work. Pinned in Tasks 1, 2, 7.
5. **n8n or the café script down while a message arrives.** Expected: the message is logged before routing; the routing error is saved on the row and emailed. Pinned in Task 4 and Task 6.

---

### Task 1: Café Apps Script provider switch

**Files (toasty repo):**
- Modify: `google-apps-script.gs` (code + the setup comment at the top)
- Create: `test/apps-script.test.mjs` (Node built-ins; loads the `.gs` in `node:vm` with stub `PropertiesService`, `UrlFetchApp`, `Utilities`, `SpreadsheetApp`, `MailApp`, `console`)

**Interfaces:**
- Script Properties: `WHATSAPP_PROVIDER` (`twilio` default | `meta`), `META_WA_TOKEN`, `META_WA_PHONE_NUMBER_ID`, `OWNER_TEMPLATE` (`toasty_new_submission`, body vars 1–3), `TEMPLATE_LANG` (default `en`), `META_GRAPH_VERSION` (default `v23.0`).
- `whatsAppSend(to, message)`; `message` is `{template, vars:[..], buttons?:[payload,..]}` or `{text}`. Dispatches to `twilioSend` (today's ContentSid payload) or `metaSend`; returns Meta's message id or Twilio's SID; throws `Error("Meta <code>: <message>")` on failure. `metaSend` sets `biz_opaque_callback_data:"toasty"`.
- `metaNumber(raw)` = `toWhatsApp(raw)` without `whatsapp:+`.

- [ ] **Step 1: Write failing tests**: with `WHATSAPP_PROVIDER=meta`, `sendOwnerAlert("New reservation — Anna", ["Phone: +49 151", "Guests: 2"], "12.10.2026 20:15")` fetches `https://graph.facebook.com/v23.0/<id>/messages` with `contentType:"application/json"`, `Authorization: Bearer test-token`, a template `toasty_new_submission` whose three body params are the `templateVar`-cleaned values. Without `WHATSAPP_PROVIDER` the Twilio payload equals today's (ContentSid + ContentVariables). `doPost` with a fetch that answers 400 still appends the Sheet row and sends the email.
- [ ] **Step 2: Run** `node test/apps-script.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement**; `setup()` checks the properties the chosen provider needs; `testWhatsApp()` works for both.
- [ ] **Step 4: Run** the test. Expected: pass.
- [ ] **Step 5: Commit** `"Send café WhatsApp alerts through Meta when WHATSAPP_PROVIDER=meta"`.

### Task 2: Café owner approval (Confirm / Decline)

**Files (toasty repo):** `google-apps-script.gs`, `test/apps-script.test.mjs`.

**Interfaces:**
- Properties: `OWNER_APPROVAL` (`true` turns it on; anything else off), `BOOKING_REQUEST_TEMPLATE` (`toasty_booking_request`: body vars name, date and time, guests, phone; quick replies Confirm, Decline), `GUEST_INTRO_TEMPLATE` (`toasty_intro`, no variables), `GUEST_CONFIRMED_TEMPLATE`, `GUEST_DECLINED_TEMPLATE` (wording in the spec, section 5), `CAFE_PHONE`, `HUB_SECRET`. Approval needs `WHATSAPP_PROVIDER=meta` (button replies only reach the Hub); `setup()` warns if not.
- Reservations tab gets columns `Booking ID`, `Status`, `Guest told` at the end (header cells added if missing). Booking id: `R` + base-36 timestamp + 3 random chars.
- Owner alert for a reservation with approval on: template `toasty_booking_request` with button payloads `toasty:confirm:<id>` and `toasty:decline:<id>`. Status `Waiting`.
- `doPost(e)`: when `e.postData.type` is JSON and its `action == "decision"`, it handles a decision; otherwise it's today's form handling, unchanged. Decision body: `{action, booking, decision: "confirm"|"decline", from: "49151…", ts: <ms>, sig}` where `sig` = hex HMAC-SHA256(`HUB_SECRET`, `action|booking|decision|from|ts`). Answers JSON `{ok, ownerText}`.
- `decide({booking, decision, from})` → `ownerText`:
  - `from` not in `OWNER_WHATSAPP_TO` (digits compared) → `ok:false`, no change.
  - Status not `Waiting` → "Already confirmed: <name>." / "Already declined: <name>." and no guest message.
  - Otherwise: if no earlier row with that guest's phone has `Guest told` set, first send `GUEST_INTRO_TEMPLATE` as its own message; then send the confirmed/declined template (even if the intro failed; the owner text then adds "(the introduction message failed)"); set Status `Confirmed`/`Declined` and `Guest told` to the time. If the guest send fails: Status stays as decided, `Guest told` empty, ownerText "Confirmed, but the WhatsApp to <name> failed: <error>. Please call them on <phone>."
  - Success ownerText: "Done: <name> (<guests> guests, <date>) has been told it's confirmed." / "... told you can't take the booking."

- [ ] **Step 1: Write failing tests**: approval off → owner alert unchanged from Task 1; approval on → row has id and `Waiting`, owner template has both button payloads; good decision confirm for a new guest → exactly two guest sends, in order: `toasty_intro`, then `toasty_booking_confirmed` with vars `["2", "24/12/2026 19:00"]`; a second reservation from the same phone confirmed → one send, the confirmation only; intro fails → the confirmation is still sent; decline → declined template with `CAFE_PHONE`; second tap → "Already confirmed", no fetch; bad sig, `ts` 11 minutes old, or a stranger's `from` → `ok:false`, no change; failed guest send → the "please call them" owner text.
- [ ] **Step 2: Run** the tests. Expected: FAIL.
- [ ] **Step 3: Implement.** Lock the decision with `LockService.getScriptLock()` so two quick taps can't both send.
- [ ] **Step 4: Run** the tests. Expected: pass.
- [ ] **Step 5:** Update the setup comment (the new templates' exact text, the properties, how to turn approval on); commit `"Let the café owner confirm or decline bookings on WhatsApp"`; push `claude/whatsapp-meta` once push access is granted.

### Task 3: `wa_messages` table and the Hub's receive-and-log

**n8n:** new data table `wa_messages` (columns as the spec's table, plus `raw` string); new workflow **WhatsApp Hub**.

**Interfaces:**
- Webhook path `whatsapp-hub` (GET + POST).
- Hub settings live in one Set node "Hub Settings" at the top: `verify_token` (from an n8n credential or variable, not literal in exports), `azolute_phone_number_id`, `cafe_script_url` (the café web app's `/exec` URL), `graph_version`.
- Normalised item shape, used by Tasks 5–6: `{wamid, direction, phone_number_id, contact, contact_name, type, text, payload, media_id, media_mime, status, error, source, at}`.

- [ ] **Step 1:** Build GET: answers `hub.challenge` as plain text when `hub.mode=subscribe` and the token matches, else 403.
- [ ] **Step 2:** Build POST: raw body kept; `X-Hub-Signature-256` checked as `sha256=` + HMAC-SHA256(app secret, raw). Find out how this instance allows HMAC (Crypto node or Code node `crypto`); pick that. Bad signature: no further processing, one log line. Answer 200 straight away.
- [ ] **Step 3:** Split into items: each `messages[]` → `in` row (text body, image caption, `button.payload`/`button.text`, `interactive.button_reply.id`/`.title`, media id and mime for image/audio/document/video/sticker; `contact_name` from `contacts[].profile.name`); each `statuses[]` → status update (`status`, `errors[0]` as `"message (code)"`, `biz_opaque_callback_data` → `source`, `recipient_id` → `contact`).
- [ ] **Step 4:** Dedupe and write: `in` rows inserted only if no row has that `wamid`; status: update the row with that `wamid`, or insert an `out` row with type `unknown`.
- [ ] **Step 5: Test** with pinned payloads (use `prepare_workflow_pin_data` / `test_workflow`): a text message, an image with caption, a button reply `approve:p1`, the same text message twice (one row), a `delivered` status for an unseen wamid with `biz_opaque_callback_data:"toasty"` (new `out` row, `source=toasty`), then `read` for it (row updated), and a bad signature (no row). Check rows with `get_data_table_rows`, then delete the test rows.
- [ ] **Step 6:** Export to `docs/n8n/whatsapp-hub.json`; commit `"Add the WhatsApp Hub: receive, verify and log"`.

### Task 4: Hub routing and Owner Replies as a sub-workflow

**n8n:** modify **WhatsApp Hub**; modify **Content Engine · Owner Replies** (`7b7LKdOUEbPPUctx`).

**Interfaces:**
- Owner Replies starts with an Execute Workflow Trigger taking the normalised item (Task 3) plus `client_key`. Its "Read Message" node maps from that shape; all nodes after it are unchanged. Its old WhatsApp Trigger is removed.
- Hub → café: for a button payload matching `^toasty:(confirm|decline):[A-Za-z0-9]+$` on `azolute_phone_number_id`, POST JSON to `cafe_script_url` with `{action:"decision", booking, decision, from: contact, ts: Date.now(), sig}` (sig as Task 2, secret from an n8n credential), following Google's redirect; 30 s timeout. Send the answer's `ownerText` back to the owner as free text (`biz_opaque_callback_data:"hub"`) and log it `source=hub`. On `ok:false` with no text, send nothing.
- Routing order exactly as the spec's rules 1–4. Set `routed_to` on the row.

- [ ] **Step 1:** Convert Owner Replies; re-run its existing simulated tests (Approve not waiting refused, stranger ignored, Edit → `awaiting_edit`, edit note → revision) through the new trigger with pinned input.
- [ ] **Step 2:** Build routing; on any route error write `error` on the row, call the Alerts workflow (Task 6), and continue.
- [ ] **Step 3: Test** with pinned items: owner button `approve:p1` → Owner Replies called; owner text with a post `awaiting_edit` → Owner Replies; owner "hello" → Owner Replies; `toasty:confirm:Rabc` → café call (mocked) with a correct sig, owner text sent; same payload on another `phone_number_id` → not sent; stranger "hi" → `routed_to=none`; café call failing → row `error` set.
- [ ] **Step 4:** Re-export `docs/n8n/whatsapp-hub.json` and `docs/n8n/content-engine-owner-replies.json`; commit `"Route Hub messages to the Content Engine and the café"`.

### Task 5: Inbox API on n8n

**n8n:** new workflow **WhatsApp Hub · Inbox API**, settings: *save successful executions: off*.

**Interfaces** (all behind an n8n Header Auth credential, header `X-Inbox-Key`; only rows with `phone_number_id == azolute_phone_number_id`):
- `GET /webhook/wa-inbox/messages?since=<ISO>&limit=<n ≤ 1000>` → `{rows:[normalised + updatedAt], next: <ISO of last row's updatedAt> }`, oldest first. `since` missing = from the start.
- `POST /webhook/wa-inbox/send` `{to:"919…", text}` → `{ok:true, row}` or `{ok:false, error:"message (code)"}` with HTTP 200 (so the inbox can show it). Logs `source=inbox`.
- `GET /webhook/wa-inbox/media?id=<media_id>` → file bytes with Meta's content type (fresh URL lookup on every call).
- `POST /webhook/wa-inbox/import` `{rows:[normalised]}` → inserts rows whose `wamid` is new; returns `{added, skipped}`.

- [ ] **Step 1:** Build; check how data-table filters handle `updatedAt` > `since`. If system columns can't be filtered, add an `updated_ms` number column set on every write (Task 3 too).
- [ ] **Step 2: Test**: wrong key → 401/403; `messages` paging with 3 test rows and `limit=2`; `send` with Graph mocked; `import` twice (second call `added:0`); row of another `phone_number_id` never returned.
- [ ] **Step 3:** Export `docs/n8n/whatsapp-hub-inbox-api.json`; commit.

### Task 6: Failure alerts

**n8n:** new workflow **WhatsApp Hub · Alerts** (Error Trigger + SMTP email to `miras@azolute.one`, existing SMTP credential). Set as the error workflow of WhatsApp Hub, Inbox API and Owner Replies. The Hub's routing-error branch and failed-status branch (status `failed`) also call it with `{what, wamid, error}`.

- [ ] **Step 1:** Build. Subject `WhatsApp Hub: <what>`; body has workflow name, execution link, wamid, error. Never the message text (client privacy).
- [ ] **Step 2: Test:** run once with a pinned error; check it arrives (owner confirms) or the SMTP node succeeds.
- [ ] **Step 3:** Export `docs/n8n/whatsapp-hub-alerts.json`; commit.

### Task 7: Inbox hub mode and history import

**Files (whatsapp-inbox repo):**
- Create: `hub.js` (talks to the Hub; Node built-ins)
- Create: `import-twilio.js` + `package.json` script `"import-twilio": "node import-twilio.js"`
- Create: `test/hub.test.js` + script `"test": "node test/hub.test.js"`
- Modify: `server.js` (pick source at start; keep the page's API unchanged)
- Modify: `README.md`

**Interfaces:**
- `.env` (gitignored, loaded with `node --env-file-if-exists=.env`): `INBOX_SOURCE=twilio|hub` (default `twilio`), `HUB_URL` (n8n base URL), `HUB_KEY`.
- `createHub({url, key, fetchFn})` → `{ sync() → Promise<void>, conversations() → same shape as today's server.js conversations(), thread(contact), send(to, body) → toClient-shaped message or throws {status, message}, mediaList(wamid) → [{sid: media_id, contentType}], mediaContent(media_id) → Response }`. Contacts stay in the `whatsapp:+<digits>` form the page uses; `sid` is the wamid; `name` falls back to `contact_name`.
- Polling: `sync()` only runs when the page made a request in the last 30 s, at most every 5 s.
- `server.js` in hub mode: no Twilio credentials needed at start; `/api/media` accepts wamids and media ids (validate as `/^[\w.=:-]{5,200}$/` instead of the Twilio SID pattern).
- `import-twilio.js`: reads the Twilio log with today's code (Twilio mode credentials), maps to normalised rows (`wamid` = Twilio SID, `source` = `twilio-import`), posts in batches of 200 to `/webhook/wa-inbox/import`, prints `added/skipped`.

- [ ] **Step 1: Write failing tests** with a fake Hub (fake `fetchFn`): `sync` merges pages and status updates for the same wamid; `conversations()` groups by contact, `lastInboundAt` right, newest first; `send` failure surfaces Meta's error text; no `sync` when idle for 31 s.
- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement** `hub.js` and the `server.js` switch.
- [ ] **Step 4: Run** `npm test` (pass) and start `INBOX_SOURCE=twilio npm start` to check twilio mode still boots up to the credential step.
- [ ] **Step 5:** README: hub mode, `.env`, new costs (Meta pricing; no Twilio fee), import. Commit and push `claude/whatsapp-meta`.

### Task 8: Runbook and Content Engine docs

**Files (azolute):**
- Create: `docs/whatsapp-cutover-runbook.md`
- Modify: `docs/content-engine-setup.md` (Owner Replies is a sub-workflow of the Hub; WhatsApp checklist points to the runbook)

Runbook contents (one checklist; each step has *where*, *exactly what to type or click*, *how to check*, *how to undo*):
- **Before the day:** note the Twilio sender's webhook and ClashCWL's `TWILIO_FORWARD_URL`; Meta Business settings check for path 1/2/3; business verification if asked; Meta app (Business type) + WhatsApp product; System User with `whatsapp_business_messaging` and `whatsapp_business_management`, permanent token; app secret + verify token into n8n credentials; templates (`content_review`, `toasty_new_submission`, `toasty_booking_request`, `toasty_intro`, `toasty_booking_confirmed`, `toasty_booking_declined`; exact bodies); Meta test number end-to-end test of Hub; café script paste (approval off); inbox update; secrets list (which value goes where).
- **On the day:** the spec's cutover order, with exact names and values: remove ClashCWL's `TWILIO_*` and `WATCH_WHATSAPP_TO` env vars; café Script Properties; inbox `.env`, `content_settings.wa_phone_number_id`, subscribe app to the WABA, webhook URL + fields `messages`, publish order (Alerts, Inbox API, Owner Replies, Render & Preview, Hub, Plan Post last), checks per system.
- **After:** unshare Twilio, import history, a quiet week, check the +1 754 number, close Twilio. Token rotation steps (where both copies live: n8n and Script Properties). Turning café approval on after the café owner agrees: test booking first.

- [ ] **Step 1:** Write; check every property and setting name against Tasks 1–7.
- [ ] **Step 2:** Commit and push `"Add the WhatsApp cutover runbook"`.
