# Change log: Content Engine and WhatsApp (23–24 Nov 2026)

Everything changed across two chats with Claude: what was built, where it
lives, what was decided and why, and what is still open. The detailed
guides it points to are the source of truth for each part.

- **Chat 1** (23–24 Nov): built the Content Engine on n8n, then worked out
  how to move the WhatsApp number off Twilio and chose the approach.
- **Chat 2** (24 Nov, started from chat 1): designed and built the
  WhatsApp move. Its own docs are listed in part 3.

## At a glance

| Area | Status |
|---|---|
| Content Engine (Lite, Azolute's own Instagram) | Built and tested on n8n; waiting for Gemini, WhatsApp and Instagram accounts |
| Media Server for post images | Live |
| WhatsApp off Twilio | Designed and built (chat 2), switched off; the runbook lists the steps only the owner can do |
| ClashCWL | No WhatsApp change needed (it moved to Discord); only its Twilio settings get removed |
| Toasty Turtle Cafe booking alerts | Keep working on Twilio until cutover; the new script is ready on a branch |

---

## 1. Content Engine (chat 1)

### What it does

Claude drafts an Instagram post three times a week, Gemini draws the
picture, and the owner gets it on WhatsApp with **Approve / Edit / Skip**.
Approve publishes to Instagram. Edit lets the owner type a change and
Claude redrafts. A photo sent with a note becomes a post. Nothing
publishes without the owner's tap. Full guide: `docs/content-engine-setup.md`.

### Changes on the n8n server (`https://n8n-jrkw.srv2144760.hstgr.cloud`)

These live on n8n, not in git; exports are in `docs/n8n/`.

Workflows:

| Workflow | n8n id | State |
|---|---|---|
| Content Engine · Plan Post | `dJQEkHIlElhTMr14` | built, not published |
| Content Engine · Render & Preview | `7MMg2MhNJJQfXw3A` | built, not published |
| Content Engine · Owner Replies | `7b7LKdOUEbPPUctx` | built in chat 1; chat 2 changed it to be called by the WhatsApp Hub |
| Content Engine · Media Server | `OB4FHohps9OJxdh5` | **published (live)** at `/webhook/content-media?f=<key>` |

Data tables:

| Table | n8n id | Holds |
|---|---|---|
| `content_settings` | `FgcxxifTQHm8YADN` | one row per client: brand voice, audience, themes, hashtags, image style, owner number, WhatsApp and Instagram ids |
| `content_posts` | `RGzZbSzf1Ho4U9Ml` | every draft and its status |
| `content_media` | `NrQdF12IGWYP5nca` | post images (base64), deleted once a post is published or skipped |

Data written:

- Azolute's settings row (`client_key` = `azolute`). The previews go to
  `owner_whatsapp` = 919207404868. `wa_phone_number_id` and
  `ig_user_id` are still `SET_ME`.
- A test draft, `azolute-20261123-62thgq` (status `preview_failed`), and a
  tiny test image `ce-selftest.jpg`. Both can be deleted.
- Three throwaway test workflows ("zz Content Engine spike…") were
  archived.

### Changes in this repo

Commit `639c88f` on branch `claude/kind-cannon-5bluac`:

- `docs/content-engine-setup.md`: build notes and go-live checklist
  (chat 2 later updated it to point at the WhatsApp Hub)
- `docs/n8n/content-engine-plan-post.json`
- `docs/n8n/content-engine-render-preview.json`
- `docs/n8n/content-engine-owner-replies.json` (chat 2 updated it)
- `docs/n8n/content-engine-media-server.json`

### Decisions and why

- **Azolute's own accounts first, built so it can become a client
  template.** All brand and account details sit in one settings row, so
  client #2 is a new row, not a copy of the workflows.
- **Images are stored in an n8n table, not on disk.** n8n on the server
  may only write under `/home/node/.n8n-files`, which doesn't exist.
  Instagram needs a public link to each image, so the Media Server serves
  them from the table.
- **The preview uses a WhatsApp template (`content_review`).** Plan Post
  messages the owner unprompted, and WhatsApp blocks free messages
  outside the 24-hour window. A template can't contain line breaks, so the
  caption is shown as one paragraph in the preview; Instagram gets it
  unchanged.
- **The image style comes only from settings.** In the first live test,
  Claude's image brief chose its own colours (cream and teal); the brief
  now describes only the scene.
- **Safety rules:** only the owner's number can approve; Approve is
  ignored unless the post is still waiting (so a double tap can't publish
  twice); a client with 3 unanswered drafts gets no new ones; captions
  never promise results or invent clients, quotes or numbers.
- **Models:** Claude `claude-sonnet-5-5` for writing, Gemini
  `gemini-2.5-flash-image` for pictures.

### Tested / not tested

Tested on the server:

- the Media Server, including 404s and a `../` path attempt
- image conversion to a 1080×1080 JPEG through the table
- a live Claude draft
- the Approve guard, the stranger filter, Edit, and a real Claude revision

Not tested yet, because they need the accounts: the WhatsApp template
send, the Instagram publish, and the photo-to-post download and crop.

---

## 2. WhatsApp off Twilio: findings and decision (chat 1)

### What we found

The business number **Azolute AI, +91 94003 34868** is the owner's own SIM,
registered through Twilio. Three things used it:

- **ClashCWL** (`miras-dev/clash-cwl`, `clients/clashcwl/lambda/twilio.mjs`):
  hunter alerts and owner reports, plus incoming STOP/START from hunters.
- **Toasty Turtle Cafe** (`miras-dev/toasty`, `google-apps-script.gs`):
  website bookings go to a Google Sheet and an email, plus a WhatsApp alert
  to the owner through Twilio.
- **whatsapp-inbox** (`miras-dev/whatsapp-inbox`): a Mac app that reads and
  answers client chats by polling Twilio's message history.

Chat 1 only read these repos; it changed nothing in them.

### Cost

Meta's fees are the same through Twilio or direct; Twilio passes them on.
Moving removes Twilio's own fee:

- **$0.005 per message** in or out (about ₹0.43), plus $0.001 per failed
  message.
- **$1.15 a month** for a US Twilio number (+1 754…), if nothing else uses it.

For an alert to an Indian number, that's about ₹0.55 through Twilio
against Meta's ₹0.115 direct. Both approaches below cost the same.

### Decision: approach A, "n8n is the front desk"

Meta delivers each incoming message once, to one webhook, and keeps no
history to look up later. So one system must receive every message, keep
a log, and pass each one on.

- **A (chosen):** n8n on Azolute's server receives and logs everything and
  routes it: the owner's Content Engine taps go to the Content Engine,
  everything else to the inbox. Azolute's business line stays on
  Azolute's own server.
- **B (not chosen):** ClashCWL's Lambda stays the receiver and forwards the
  rest. That would make Azolute's line depend on a different project's
  server.

### Café alerts

The café's WhatsApp alerts stop the moment the number leaves Twilio,
unless the script switches at the same time. The Sheet and email keep
working either way, because the script catches WhatsApp errors.

### Corrections made in chat 2

- **Moving the number.** Chat 1 described Meta's old "migrate the number
  between accounts" flow. Under Meta's new WhatsApp account model (live
  since September 2026), a number can't move to another business
  portfolio. The expected path is that the number already sits in the
  owner's portfolio: the owner's own Meta app connects to it, then
  Twilio's access is removed. The first step of the runbook confirms this.
- **ClashCWL** has moved to Discord, so it needs no WhatsApp work. Only its
  Twilio settings get removed.
- **The café** gets an owner approval step: the owner taps Confirm or
  Decline on each booking, and the guest hears back from the Azolute AI
  number. This is built behind a setting that stays off until the café
  owner agrees.

---

## 3. WhatsApp off Twilio: what chat 2 built

As recorded in `docs/whatsapp-cutover-runbook.md`, "What's already built":

| Piece | Where | State |
|---|---|---|
| WhatsApp Hub (receives, logs, routes) | n8n `IorCSvwB305dpU5g` | built, tested, not published |
| WhatsApp Hub · Inbox API | n8n `BuatfauT1gooTQ9q` | built, tested, not published |
| WhatsApp Hub · Alerts (emails on failure) | n8n `M8FOdndi0Jfx2Qv6` | published |
| Owner Replies, called by the Hub | n8n `7b7LKdOUEbPPUctx` | changed, not published |
| `wa_messages` log and `hub_settings` tables | n8n | created |
| Café script with a Twilio/Meta switch and Confirm/Decline | `miras-dev/toasty`, branch `claude/whatsapp-meta` | pushed, not pasted into Apps Script yet |
| Inbox app with Twilio/Hub modes and history import | `miras-dev/whatsapp-inbox`, branch `claude/whatsapp-meta` | pushed |

Its documents, all in this repo:

- `docs/superpowers/specs/2026-11-24-whatsapp-off-twilio-design.md`: the
  approved design
- `docs/superpowers/plans/2026-11-24-whatsapp-off-twilio.md`: the build plan
- `docs/whatsapp-cutover-runbook.md`: the owner's step-by-step list
- `docs/app-azolute-one-plan.md`: the plan for app.azolute.one, with the
  WhatsApp inbox as feature 1

---

## 4. Still open

For the owner:

- **WhatsApp:** follow `docs/whatsapp-cutover-runbook.md`. It covers who
  owns the number in Meta, the Meta app and token, templates, n8n
  settings, a test on Meta's test number, the café script, and cutover day.
- **Content Engine:** add the Gemini key and the Instagram token, fill in
  the two `SET_ME` ids, and publish the workflows (order in
  `docs/content-engine-setup.md`).
- **Branches to merge:** `claude/kind-cannon-5bluac` in this repo, and
  `claude/whatsapp-meta` in `toasty` and `whatsapp-inbox`. Nothing has
  been merged to `main`.

Not built yet:

- Content Engine: YouTube uploads, the monthly content calendar, the
  performance line in the owner report, and the Pro tier (AI video).
- The WhatsApp AI agent: the Hub leaves a slot for it.
