# app.azolute.one: the plan

Status: **paused (2026-11-24), not built.** Miras paused the app the same day
to follow the build order in `docs/changes/2026-11-24-strategy-and-pricing.md`:
the admin and client portal waits until about ten paying clients (2028),
because it would take 2–4 months of all the 2027 build time. The phase 1
design is finished and kept for then
(`docs/superpowers/specs/2026-11-24-app-azolute-one-phase1-design.md`).
Until then the inbox is the WhatsApp Business app and the laptop inbox, and the
chats move to the EU with n8n (December list), not to AWS.

Read this first in any new chat about app.azolute.one. Add features to the list
below instead of starting a new plan.

## What it is

The logged-in web app for Azolute (at `app.azolute.one`): one place to run the
business and, later, the clients' systems. The public site (`azolute.one`, this
repo) stays the marketing site. The app is built so new features drop in as
sections.

## Two sides, one app

- **Azolute admin** (Miras): every client, every automation, health and billing.
- **Client portal**: each client logs in and sees only their own business
  (their inbox, posts, bookings, reports). Same screens, filtered to one client.

Everything is per client from day one (a `client` on every record), because
the Content Engine and the WhatsApp Hub are already built that way
(`content_settings` has one row per client; the Hub logs each number's
`phone_number_id`).

## Features

Status: **built** = the automation runs today (on n8n or elsewhere) and the app
only needs to show and control it; **planned** = in the offer, not built yet.

### Foundation (needed before anything else)

| # | Feature | Automation behind it | Status |
|---|---|---|---|
| F1 | **Login and roles**: Azolute admin, client owner, client staff | — | planned |
| F2 | **Clients**: add a client, their business details, which modules and plan (Starter / Growth / Full, Content Lite / Pro) they have | — | planned |
| F3 | **Automation settings page** (see below): edit the values the n8n automations use, per client, instead of editing n8n tables | all n8n workflows | planned (idea) |
| F4 | **Health**: what ran, what failed, last message received, alerts (today these are emails from *WhatsApp Hub · Alerts*) | Alerts workflow, n8n executions | built (email only) |

### Messaging

| # | Feature | Automation behind it | Status |
|---|---|---|---|
| 1 | **WhatsApp inbox**: every message in and out, reply, photos, contact names, 24-hour window | WhatsApp Hub + Inbox API | built (laptop app); app version planned |
| 2 | **Templates**: the approved WhatsApp templates per number and their status | Meta WhatsApp Manager | planned |
| 3 | **WhatsApp AI agent**: edit the "approved information" it answers from, see its conversations, take over a chat | the Hub's "everything else" slot | planned |
| 4 | **Missed-call text-back**: log of missed calls and the WhatsApp sent | — | planned |
| 5 | **AI phone receptionist**: call log, transcripts, bookings taken | — | planned |

### Content Engine (for Azolute and for clients)

| # | Feature | Automation behind it | Status |
|---|---|---|---|
| 6 | **Drafts queue**: every post waiting, with Approve / Edit / Skip in the app as well as on WhatsApp | Plan Post, Render & Preview, Owner Replies | built (WhatsApp only) |
| 7 | **Brand settings**: voice, audience, themes, hashtags, image style, owner's WhatsApp | `content_settings` | built (table only) |
| 8 | **Content calendar**: the month ahead, approved in the same flow | — | planned (Lite) |
| 9 | **Published posts and performance**: links, reach, likes, best of the week | Owner Replies (publish) | partly built |
| 10 | **Media library**: the owner's photos and generated images | `content_media`, Media Server | built (table only) |
| 11 | **YouTube uploads**: owner's clips with title, description, tags, thumbnail | — | planned (Lite) |
| 12 | **AI Reels / Shorts and monthly campaigns** | — | planned (Pro) |

### Bookings and customers

| # | Feature | Automation behind it | Status |
|---|---|---|---|
| 13 | **Bookings**: website bookings with Waiting / Confirmed / Declined, and Confirm / Decline in the app too | Toasty café script + Hub | built (café, Sheet) |
| 14 | **Online booking and reminders**: calendar booking page, confirmations, reminders | Cal.com | partly built (Azolute's own) |
| 15 | **No-show protection**: deposit / card-hold links | — | planned (Growth) |
| 16 | **Review engine**: review requests after a visit; AI-drafted replies to approve | — | planned (Growth) |
| 17 | **Retention engine**: QR opt-ins, offers by spend, win-back campaigns | — | planned (Full) |
| 18 | **Contacts (light CRM)**: every message, call and booking becomes a contact with history | wa_messages, bookings | planned (Full) |
| 19 | **Invoices and payment links** | — | planned (Full) |

### Reports

| # | Feature | Automation behind it | Status |
|---|---|---|---|
| 20 | **Owner's daily report**: configure and preview the morning WhatsApp / email (enquiries, leads, bookings, posts) | — | planned (Starter) |
| 21 | **Monthly numbers for the quarterly review** | — | planned (Full) |

### Running Azolute itself (admin only)

| # | Feature | Automation behind it | Status |
|---|---|---|---|
| 22 | **Website leads**: contact form enquiries and site-chat conversations | Contact Intake, Site Chat (n8n) | built (email) |
| 23 | **Client onboarding checklist**: Meta app, templates, credentials, first test, per client | the runbook steps | planned |
| 24 | **Usage and costs per client**: messages sent and received (Meta charges per message), AI and image costs, against what they pay | wa_messages, provider bills | planned |
| 25 | **Subscriptions and billing**: plan, setup fee, renewals | — | planned |

## Phases (suggested)

1. **Foundation + inbox:** F1–F4 and feature 1 (with the AWS message store).
2. **Content and bookings:** 6, 7, 9, 10, 13, so the things already running can
   be seen and controlled without n8n.
3. **Everything else**, in the order clients buy it.

## The automation settings page (F3)

**The idea:** one page per client where Miras (and, for some fields, the
client) fills in the values the automations need, instead of opening n8n's
data tables. Today those values live in:

- `content_settings` (n8n): brand voice, audience, themes, hashtags, image
  style, owner's WhatsApp, WhatsApp phone number id, template name, Instagram
  user id, Graph API version, media URL;
- `hub_settings` (n8n): Azolute's phone number id, the café script address and
  shared secret, Graph API version, alert email;
- the café's Script Properties (Google Apps Script): provider, phone number id,
  template names, café phone, approval on/off.

**How it would work (to decide in the design session):**

- Plain fields (names, templates, on/off switches) are edited in forms with
  checks (a phone number must have a country code, a template must exist).
- **Secrets are write-only:** tokens and shared secrets can be set or replaced,
  never shown again; the page only says "set" or "not set". They stay in the
  server-side store (n8n credentials or AWS Secrets Manager), never in the
  browser.
- Every change is logged (who, when, old value, new value).
- **One source of truth:** either the app's database holds the settings and
  n8n reads them through the app's API, or the app writes into n8n's tables
  through n8n's API. The first is cleaner once the data moves to AWS.
- A **"Test" button** per automation (send a test WhatsApp, make one post now)
  so a change can be checked straight away.

## Feature 1: WhatsApp inbox

**What the owner wants:** see the WhatsApp messages that come in to the business
number and the ones sent from it, in app.azolute.one, with the same look as
the existing inbox app.

- **The look to copy:** the local inbox app in the `miras-dev/whatsapp-inbox`
  repo (`public/index.html`, `public/app.js`, `public/style.css`): chat list
  with unread counts, the open chat, replying, photos, contact names, the
  24-hour reply window, sound/desktop alerts.
- **Where the messages come from:** the **WhatsApp Hub** on n8n
  (`IorCSvwB305dpU5g`). Meta keeps no message history, so the Hub logs every
  message and status the moment it arrives. See
  `docs/superpowers/specs/2026-11-24-whatsapp-off-twilio-design.md` and
  `docs/whatsapp-cutover-runbook.md`.
- **Sending:** through the Hub (or the same Graph API call), so Meta's token
  stays on the server, never in the browser.
- **Who can see it:** only Azolute's own logins. Client chats are private
  data: the app needs a real login before this goes live.

## Where the data lives

**Today:** the Hub writes to an n8n data table, `wa_messages`
(`Cql2asOYThN8DQAY`). That table is inside n8n's own database on the
Hostinger VPS, which is fine to start with but is not a database we can build
an app on, back up properly or query well.

**Plan: move the message store to AWS** (owner's choice, 2026-11-24). Open
decisions, for the design session:

- **Which AWS database.** The first option to look at is DynamoDB (pay per
  use, no server, the same kind of store ClashCWL already runs on, so it can
  reuse that know-how). The other is a small Postgres (RDS or Aurora
  Serverless), which is better for searching and reporting and has a fixed
  monthly cost. Decide based on what the app's other features will need.
- **Who writes.** Probably a small AWS API (Lambda + API Gateway) that owns the
  database: the Hub posts each message and status to it, and app.azolute.one
  reads from it. Then n8n doesn't need AWS keys for the database, and the app
  doesn't depend on n8n being up to show history.
- **Moving the history.** Copy what's already in `wa_messages` (and the
  Twilio-era chats that `npm run import-twilio` brought in) into the new store
  once, then switch the Hub's writes, then the inbox reads.
- **Keep the safety the Hub has now:** log first, route second; ignore Meta's
  repeat deliveries (same message id); never lose a message if the database is
  briefly down (the Hub can retry, and Meta itself retries for up to 7 days).
- **Retention and privacy:** how long to keep chats, who can export them,
  deleting a client's chats on request.

## Not decided yet

- The app's tech stack (framework, hosting, login), and whether it lives in
  this repo or its own.
- The rest of the features (add them to the table above).
