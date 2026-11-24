# WhatsApp off Twilio: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every system that uses +91 94003 34868 can switch from Twilio to Meta's Cloud API by a setting. A WhatsApp Hub on n8n receives, logs and routes all inbound traffic. A one-page runbook covers cutover day.

**Architecture:** Inbound: Meta → n8n *WhatsApp Hub* (verify signature, log to `wa_messages`, route to Content Engine / ClashCWL / log only). Outbound: each system calls the Graph API directly, picked by `WHATSAPP_PROVIDER`. The local inbox reads and sends through authenticated Hub endpoints, so the Meta token stays in n8n.

**Tech Stack:** n8n (self-hosted, via the n8n MCP tools), Node 20 ESM with no packages (ClashCWL Lambda, inbox), Google Apps Script (café), Meta Graph API.

**Spec:** `docs/superpowers/specs/2026-11-24-whatsapp-off-twilio-design.md` (read it first).

## Global Constraints

- Owner's rules: **nothing breaks**, and it makes our lives easier.
- Every provider switch defaults to `twilio`. Shipping code must not change live behaviour until a setting is flipped.
- Tokens and secrets only in n8n credentials, Lambda env vars, Script Properties or the inbox's gitignored `.env`. Never in code, commits, tests (use fake values like `test-token`) or chat.
- ClashCWL: follow `AGENTS.md`: read `docs/PLATFORM_PLAN.md` first; never delete protected files; update the folder `README.md` contracts you touch; never show a defender's name.
- ClashCWL and inbox stay dependency-free (Node built-ins only), in the existing comment and code style.
- Graph API base: `https://graph.facebook.com/<version>`; default version `v23.0` unless a newer stable one is current at build time, set by config, never hard-coded in more than one place per system.
- Phone numbers to Meta: digits only, no `+` (`919207404868`).
- n8n: call `get_user_preferences` and `get_workflow_sdk_reference` before building; workflows stay unpublished until cutover day, except where a task says otherwise.
- Repos: `clash-cwl` and `toasty` are attached read-only in this session. Commit there on branch `claude/whatsapp-meta`; pushing needs the owner (or `add_repo` with push allowed). `azolute` and `whatsapp-inbox` can be pushed.

## Review Focus

1. **Meta delivers the same message twice** (retries). Expected: one row in `wa_messages`, routed once. Pinned in Task 4 (dedupe test) and Task 5.
2. **A status webhook arrives for a message the log has never seen** (sent directly by ClashCWL/café). Expected: a new `out` row, no error. Pinned in Task 4.
3. **A hunter's "Stop." / " START " with punctuation or spaces.** Expected: routed to ClashCWL, same as `watch.inbound` today. Pinned in Task 2 and Task 5.
4. **A send outside the 24-hour window** (inbox reply, free-text fallback). Expected: Meta's error shown to the person, not a crash; the café's Sheet and email still work. Pinned in Tasks 1, 3, 8.
5. **n8n or ClashCWL down while a message arrives.** Expected: the message is logged before routing; the routing error is saved on the row and emailed. Pinned in Task 5 and Task 7.

---

### Task 1: ClashCWL Meta sender and provider switch

**Files:**
- Create: `clients/clashcwl/lambda/whatsapp.mjs`
- Create: `clients/clashcwl/test/whatsapp.test.mjs`
- Modify: `clients/clashcwl/lambda/README.md` (module table: add `whatsapp.mjs`)
- Modify: `scripts/run-tests.mjs` only if it lists test files explicitly

**Interfaces:**
- Consumes: `twilioFromEnv`, `oneLine`, `mask` from `lambda/twilio.mjs` (unchanged).
- Produces:
  - `metaFromEnv(env = process.env, fetchFn = globalThis.fetch)` → `null` or `{ send(text, numbers = envNumbers) → Promise<[{to, ok, id?, error?}]>, envNumbers: string[], recipients: string[], template: boolean, provider: "meta" }`. Env: `META_WA_TOKEN`, `META_WA_PHONE_NUMBER_ID`, `META_WA_TEMPLATE`, `META_WA_TEMPLATE_LANG` (default `en`), `META_GRAPH_VERSION` (default `v23.0`), `WATCH_WHATSAPP_TO`. Returns null without token or phone number id.
  - `whatsappFromEnv(env = process.env, fetchFn)` → `metaFromEnv(...)` when `WHATSAPP_PROVIDER` (trimmed, lower case) is `meta`, else `twilioFromEnv(...)`. Same shape as today's Twilio object, so `watch.mjs` is untouched.

- [ ] **Step 1: Write failing tests** in `test/whatsapp.test.mjs` (same `test()` helper style as `watch.test.mjs`):
  - `provider switch`: `whatsappFromEnv({TWILIO_ACCOUNT_SID:"AC1",TWILIO_AUTH_TOKEN:"t",TWILIO_WHATSAPP_FROM:"+1"})` has no `provider: "meta"`; with `WHATSAPP_PROVIDER:" Meta "` plus `META_WA_TOKEN:"test-token", META_WA_PHONE_NUMBER_ID:"123"` → `provider === "meta"`; `WHATSAPP_PROVIDER:"meta"` without META vars → `null`.
  - `meta template send`: fake fetch records calls; `send("Line one\nLine two", ["+91 98765 43210"])` with `META_WA_TEMPLATE:"watch_alert"` posts once to `https://graph.facebook.com/v23.0/123/messages` with header `Authorization: Bearer test-token`, JSON body `{messaging_product:"whatsapp", to:"919876543210", type:"template", template:{name:"watch_alert", language:{code:"en"}, components:[{type:"body", parameters:[{type:"text", text:"Line one | Line two"}]}]}, biz_opaque_callback_data:"clashcwl"}`; result `[{to:"+9198•••210", ok:true, id:"wamid.X"}]` when fetch answers `{messages:[{id:"wamid.X"}]}`.
  - `meta free text`: no template → body `{messaging_product:"whatsapp", to:"919876543210", type:"text", text:{body:"Line one\nLine two"}, biz_opaque_callback_data:"clashcwl"}`; `template === false`.
  - `meta error`: fetch answers 400 `{error:{message:"Re-engagement message", code:131047}}` → `[{ok:false, error:"Re-engagement message (131047)"}]`; a thrown fetch → `ok:false, error:<message>`.
  - `envNumbers`: `WATCH_WHATSAPP_TO:"+91 1, +91 2"` → `envNumbers` has 2 items, `recipients` masked.

- [ ] **Step 2: Run** `node clients/clashcwl/test/whatsapp.test.mjs`. Expected: FAIL (module missing).
- [ ] **Step 3: Implement** `lambda/whatsapp.mjs` with a header comment in the style of `twilio.mjs` that lists the env vars and the 24-hour rule.
- [ ] **Step 4: Run** the new test and `node clients/clashcwl/test/watch.test.mjs`. Expected: all `ok`.
- [ ] **Step 5: Commit** `git commit -m "Send WhatsApp through Meta's Cloud API when WHATSAPP_PROVIDER=meta"`

### Task 2: ClashCWL inbound route from the Hub, wiring, docs

**Files:**
- Modify: `clients/clashcwl/lambda/whatsapp.mjs` (add signature helpers)
- Modify: `clients/clashcwl/lambda/index.mjs:34` (import), `:870` (watch wiring), before `:1333` (new route)
- Modify: `clients/clashcwl/lambda/watch.mjs:984` (error text names both providers)
- Modify: `clients/clashcwl/lambda/README.md` (route list line 32: add `/whatsapp/inbound`), `clients/clashcwl/lambda/DEFENSE_SETUP.md` (new "Meta Cloud API" section: env vars, template, Hub)
- Test: `clients/clashcwl/test/whatsapp.test.mjs`

**Interfaces:**
- Produces:
  - `hubSignature(secret, raw) → string` = hex HMAC-SHA256 of the raw body; `verifyHub(secret, raw, header) → boolean` (timing-safe; false on missing secret or header).
  - Route `POST /whatsapp/inbound`: body JSON `{from: "919876543210", body: "STOP"}`, header `X-Hub-Key-Signature: <hex>` made with `WHATSAPP_HUB_SECRET`. Answers `200 {reply: string|null}`; `403` on bad signature; `404` when the watch or secret isn't set up. Calls the existing `watch.inbound({from, body})`.
  - `index.mjs` builds the watch with `twilio: whatsappFromEnv()`. `/twilio/whatsapp` stays as it is.

- [ ] **Step 1: Write failing tests**: `hubSignature("s", '{"a":1}')` equals `crypto.createHmac("sha256","s").update('{"a":1}').digest("hex")`; `verifyHub` true for it, false for a changed body, a missing header, and an empty secret. `watch.inbound` already handles `"Stop."` (check with an existing ALERTTO row in `memoryStore`: reply matches `/paused/`), and returns `null` for a number not on the list.
- [ ] **Step 2: Run** the test. Expected: FAIL on the missing exports.
- [ ] **Step 3: Implement** the helpers and the route (reuse `rawOf(event)`; mirror the `/twilio/whatsapp` block's structure and comment style). Replace the sending use of `twilioFromEnv` with `whatsappFromEnv`.
- [ ] **Step 4: Run** `npm test` at the repo root. Expected: all suites pass.
- [ ] **Step 5: Update** the README contract and DEFENSE_SETUP.md section; **commit** `"Take hunters' STOP/START from the WhatsApp Hub"`.

### Task 3: Café Apps Script provider switch

**Files:**
- Modify: `google-apps-script.gs` (toasty repo)
- Create: `test/apps-script.test.mjs` (toasty repo; Node built-ins, loads the `.gs` in `node:vm` with stub `PropertiesService`, `UrlFetchApp`, `Utilities`, `console`)
- Modify: the setup comment block at the top of `google-apps-script.gs` (Meta setup steps and properties)

**Interfaces:**
- Script Properties: `WHATSAPP_PROVIDER` (`twilio` default | `meta`), `META_WA_TOKEN`, `META_WA_PHONE_NUMBER_ID`, `OWNER_TEMPLATE` (e.g. `toasty_new_submission`, body vars 1–3), `CONFIRMATION_TEMPLATE` (vars name, date, guests), `TEMPLATE_LANG` (default `en`), `META_GRAPH_VERSION` (default `v23.0`).
- `whatsAppSend(to, message)` where `message` is `{template: name, vars: [..]}` or `{text}`; it dispatches to `twilioSend` (built from today's `ContentSid` payload) or `metaSend`. `sendOwnerAlert` and `sendGuestConfirmation` build provider-neutral messages.
- `toWhatsApp` unchanged; `metaNumber(raw)` = its digits without `whatsapp:+`.

- [ ] **Step 1: Write failing tests**: with `WHATSAPP_PROVIDER=meta` and `OWNER_TEMPLATE=toasty_new_submission`, `sendOwnerAlert("New reservation — Anna", ["Phone: +49 151", "Guests: 2"], "12.10.2026 20:15")` calls `UrlFetchApp.fetch` with URL `https://graph.facebook.com/v23.0/<id>/messages`, `contentType:"application/json"`, `Authorization: Bearer test-token`, and a template payload whose three body params are the `templateVar`-cleaned values. Without `WHATSAPP_PROVIDER` the Twilio request is byte-for-byte today's (ContentSid + ContentVariables). A Meta 400 throws `Error` with Meta's message (caught by `doPost`, so Sheet and email still run; test `doPost` with a failing fetch still appends the row).
- [ ] **Step 2: Run** `node test/apps-script.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement**; `setup()` checks the properties needed by the chosen provider; `testWhatsApp()` works for both.
- [ ] **Step 4: Run** the test. Expected: pass.
- [ ] **Step 5: Commit** `"Send café WhatsApp alerts through Meta when WHATSAPP_PROVIDER=meta"`.

### Task 4: `wa_messages` table and the Hub's receive-and-log

**n8n:** new data table `wa_messages` (columns as the spec's table, plus `raw` string); new workflow **WhatsApp Hub**.

**Interfaces:**
- Webhook path `whatsapp-hub` (GET + POST).
- Hub settings live in one Set node "Hub Settings" at the top: `verify_token` (from an n8n credential or variable, not literal in exports), `azolute_phone_number_id`, `clashcwl_inbound_url` (`https://api.clashcwl.com/api/whatsapp/inbound`), `graph_version`.
- Normalised item shape, used by Tasks 5–6: `{wamid, direction, phone_number_id, contact, contact_name, type, text, payload, media_id, media_mime, status, error, source, at}`.

- [ ] **Step 1:** Build GET: answers `hub.challenge` as plain text when `hub.mode=subscribe` and the token matches, else 403.
- [ ] **Step 2:** Build POST: raw body kept; `X-Hub-Signature-256` checked as `sha256=` + HMAC-SHA256(app secret, raw). Find out how this instance allows HMAC (Crypto node or Code node `crypto`); pick that. Bad signature: no further processing, one log line. Answer 200 straight away.
- [ ] **Step 3:** Split into items: each `messages[]` → `in` row (text body, image caption, `button.payload`/`button.text`, `interactive.button_reply.id`/`.title`, media id and mime for image/audio/document/video/sticker; `contact_name` from `contacts[].profile.name`); each `statuses[]` → status update (`status`, `errors[0]` as `"message (code)"`, `biz_opaque_callback_data` → `source`, `recipient_id` → `contact`).
- [ ] **Step 4:** Dedupe and write: `in` rows inserted only if no row has that `wamid`; status: update the row with that `wamid`, or insert an `out` row with type `unknown`.
- [ ] **Step 5: Test** with pinned payloads (use `prepare_workflow_pin_data` / `test_workflow`): a text message, an image with caption, a button reply `approve:p1`, the same text message twice (one row), a `delivered` status for an unseen wamid with `biz_opaque_callback_data:"clashcwl"` (new `out` row, `source=clashcwl`), then `read` for it (row updated), and a bad signature (no row). Check rows with `get_data_table_rows`, then delete the test rows.
- [ ] **Step 6:** Export to `docs/n8n/whatsapp-hub.json`; commit `"Add the WhatsApp Hub: receive, verify and log"`.

### Task 5: Hub routing and Owner Replies as a sub-workflow

**n8n:** modify **WhatsApp Hub**; modify **Content Engine · Owner Replies** (`7b7LKdOUEbPPUctx`).

**Interfaces:**
- Owner Replies starts with an Execute Workflow Trigger taking the normalised item (Task 4) plus `client_key`. Its "Read Message" node maps from that shape; all nodes after it are unchanged. Its old WhatsApp Trigger is removed.
- Hub → ClashCWL: POST `clashcwl_inbound_url`, body the exact string `{"from":"<contact>","body":"<text>"}`, header `X-Hub-Key-Signature` = hex HMAC-SHA256 with the `WHATSAPP_HUB_SECRET` value (n8n credential), signed over the same string that is sent; 10 s timeout. If `reply` is a non-empty string, send it as free text through Graph (`biz_opaque_callback_data:"hub"`) and log an `out` row `source=hub`.
- Routing order exactly as the spec's rules 1–4; ClashCWL only when `phone_number_id == azolute_phone_number_id` and the text, lower case with non-letters removed, is one of `stop pause off start resume on status`. Set `routed_to` on the row.

- [ ] **Step 1:** Convert Owner Replies; re-run its existing simulated tests (Approve not waiting refused, stranger ignored, Edit → `awaiting_edit`, edit note → revision) through the new trigger with pinned input.
- [ ] **Step 2:** Build routing; on any route error write `error` on the row and continue (no lost message).
- [ ] **Step 3: Test** with pinned items: owner button `approve:p1` → Owner Replies called; owner text with a post `awaiting_edit` → Owner Replies; owner "hello" → Owner Replies (how-it-works); stranger `"Stop."` → ClashCWL called (HTTP pinned/mocked) with a correct signature; stranger "Stop" on another `phone_number_id` → not sent; stranger "hi" → `routed_to=none`; ClashCWL returning 500 → row `error` set.
- [ ] **Step 4:** Re-export `docs/n8n/whatsapp-hub.json` and `docs/n8n/content-engine-owner-replies.json`; commit `"Route Hub messages to the Content Engine and ClashCWL"`.

### Task 6: Inbox API on n8n

**n8n:** new workflow **WhatsApp Hub · Inbox API**, settings: *save successful executions: off*.

**Interfaces** (all behind an n8n Header Auth credential, header `X-Inbox-Key`; only rows with `phone_number_id == azolute_phone_number_id`):
- `GET /webhook/wa-inbox/messages?since=<ISO>&limit=<n ≤ 1000>` → `{rows:[normalised + updatedAt], next: <ISO of last row's updatedAt> }`, oldest first. `since` missing = from the start.
- `POST /webhook/wa-inbox/send` `{to:"919…", text}` → `{ok:true, row}` or `{ok:false, error:"message (code)"}` with HTTP 200 (so the inbox can show it). Logs `source=inbox`.
- `GET /webhook/wa-inbox/media?id=<media_id>` → file bytes with Meta's content type (fresh URL lookup on every call).
- `POST /webhook/wa-inbox/import` `{rows:[normalised]}` → inserts rows whose `wamid` is new; returns `{added, skipped}`.

- [ ] **Step 1:** Build; check how data-table filters handle `updatedAt` > `since`. If system columns can't be filtered, add an `updated_ms` number column set on every write (Task 4 too).
- [ ] **Step 2: Test**: wrong key → 401/403; `messages` paging with 3 test rows and `limit=2`; `send` with Graph mocked; `import` twice (second call `added:0`); row of another `phone_number_id` never returned.
- [ ] **Step 3:** Export `docs/n8n/whatsapp-hub-inbox-api.json`; commit.

### Task 7: Failure alerts

**n8n:** new workflow **WhatsApp Hub · Alerts** (Error Trigger + SMTP email to `miras@azolute.one`, existing SMTP credential). Set as the error workflow of WhatsApp Hub, Inbox API and Owner Replies. The Hub's routing-error branch and failed-status branch (status `failed`) also call it with `{what, wamid, error}`.

- [ ] **Step 1:** Build. Subject `WhatsApp Hub: <what>`; body has workflow name, execution link, wamid, error. Never the message text (client privacy).
- [ ] **Step 2: Test:** run once with a pinned error; check it arrives (owner confirms) or the SMTP node succeeds.
- [ ] **Step 3:** Export `docs/n8n/whatsapp-hub-alerts.json`; commit.

### Task 8: Inbox hub mode and history import

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

### Task 9: Runbook and Content Engine docs

**Files (azolute):**
- Create: `docs/whatsapp-cutover-runbook.md`
- Modify: `docs/content-engine-setup.md` (Owner Replies is a sub-workflow of the Hub; WhatsApp checklist points to the runbook)

Runbook contents (one checklist; each step has *where*, *exactly what to type or click*, *how to check*, *how to undo*):
- **Before the day:** gate on `TWILIO_FORWARD_URL`; Meta Business settings check for path 1/2/3; business verification if asked; Meta app (Business type) + WhatsApp product; System User with `whatsapp_business_messaging` and `whatsapp_business_management`, permanent token; app secret + verify token into n8n credentials; templates (4, exact bodies); Meta test number end-to-end test of Hub; ClashCWL deploy with flag `twilio`; café script paste; inbox update; secrets list (which value goes where).
- **On the day:** the spec's cutover order, with exact env var names and values for ClashCWL (`WHATSAPP_PROVIDER`, `META_*`, `WHATSAPP_HUB_SECRET`), café Script Properties, inbox `.env`, `content_settings.wa_phone_number_id`, subscribe app to the WABA, webhook URL + fields `messages`, publish order (Alerts, Inbox API, Owner Replies, Render & Preview, Hub, Plan Post last), checks per system.
- **After:** unshare Twilio, import history, a quiet week, remove Twilio settings and route, check the +1 754 number, close Twilio. Token rotation steps (where all three copies live).

- [ ] **Step 1:** Write; check every env var and property name against Tasks 1–8.
- [ ] **Step 2:** Commit and push `"Add the WhatsApp cutover runbook"`.
