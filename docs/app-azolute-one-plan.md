# app.azolute.one: the plan

Status: **planned, not built.** Started 2026-11-24. Read this first in any new
chat about app.azolute.one. Add features to the list below instead of starting
a new plan.

## What it is

The logged-in web app for Azolute (at `app.azolute.one`): one place to run the
business and, later, the clients' systems. The public site (`azolute.one`, this
repo) stays the marketing site. The app is built so new features drop in as
sections.

## Features

| # | Feature | Status | Notes |
|---|---|---|---|
| 1 | **WhatsApp inbox**: every message in and out of the Azolute WhatsApp Business number, read and reply | planned | First feature. Details below. |
| … | (add more here, one row each) | | |

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
