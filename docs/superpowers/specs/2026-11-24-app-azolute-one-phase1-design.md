# app.azolute.one, phase 1: design

Date: 2026-11-24. Status: draft for approval.
Parent plan: `docs/app-azolute-one-plan.md` (features F1–F4 and 1).

## Why

Azolute's automations run on n8n, and seeing or changing anything means
opening n8n: its data tables, its executions, its workflows. Meta keeps no
WhatsApp history, so the only record of client chats sits in an n8n table on
the Hostinger VPS. Phase 1 gives Miras one logged-in place to read and answer
WhatsApp, see what's running and what failed, and change the automations'
settings, with the messages kept in Azolute's own AWS database. Later the same
app becomes the client portal, so everything is stored per client from day one.

## Goals, non-goals, anti-goals

Goals (phase 1)

- **Login (F1):** only Miras, behind a strong login with two-factor.
- **Clients (F2):** a list of clients: name, plan, modules, and which WhatsApp
  number and Content Engine row belong to them.
- **WhatsApp inbox (1):** the same experience as the `whatsapp-inbox` laptop
  app (chat list, unread counts, open chat, reply, photos, contact names,
  24-hour window, sound and desktop alerts), in the browser, from anywhere.
- **Messages on AWS:** every message and status the Hub logs is also stored in
  an AWS database, with the history copied over once.
- **Health (F4):** last message received, recent errors on messages, recent
  alerts.
- **Automation settings (F3):** edit the values in n8n's `content_settings`
  and `hub_settings` from forms, with secrets write-only and every change
  logged.

Non-goals (later phases)

- Client logins, invitations, roles beyond "Miras".
- Template sending, broadcasts, the AI agent, bookings, content screens,
  reports, billing (plan features 2–25).
- Editing the café's Script Properties (they live in Google Apps Script).
- Replacing n8n: n8n keeps running the automations.

Anti-goals (a failure even if it works)

- A WhatsApp token, a shared secret or a client chat reachable without the
  login, or sent to the browser.
- The inbox showing a different story from the Hub (missing or duplicated
  messages).
- Breaking the Hub: today's tested behaviour (log first, route second, never
  lose a message) must stay exactly as it is, and the Hub must keep working if
  the app is down.
- A setup that needs Miras to log into the AWS console for every change.

## Constraints

- AWS is Azolute's cloud (the website already deploys to S3 from GitHub
  Actions). ClashCWL already runs React + Vite, Lambda and DynamoDB.
- n8n is self-hosted; its Code nodes can't load `crypto` (signing uses the
  Crypto node). The Hub is `IorCSvwB305dpU5g`, the Inbox API
  `BuatfauT1gooTQ9q`, the Alerts workflow `M8FOdndi0Jfx2Qv6`.
- The Meta token stays in n8n (one place to rotate). The app never holds it.
- Costs should stay in AWS's free or near-free range for one user.

## Approaches

Miras handed the how to Claude ("go with your picks"); these are Claude's calls.

1. **Chosen: serverless on AWS, the ClashCWL way.** React + Vite app on S3 and
   CloudFront at `app.azolute.one`; an API on API Gateway (HTTP API) and
   Lambda (Node 22); DynamoDB for data; Cognito for the login. Pay per use,
   nothing to patch, the same pieces Miras already runs.
2. **A small server (Lightsail / EC2) with Postgres.** Simpler to reason about
   one box, but a fixed monthly cost, a server to patch and back up, and a
   different stack from ClashCWL.
3. **Read straight from the Hub's Inbox API, no AWS database.** Fastest, but it
   leaves the only copy of client chats inside n8n, against the owner's
   decision to move the data to AWS.

## Design

### Repository and deployment

- New private repo **`miras-dev/azolute-app`** (Miras creates it empty; the
  public website repo would publish app code to the website bucket).
- `web/`: React + Vite front end. `api/`: Lambda handlers (Node 22, ESM).
  `infra/template.yaml`: one AWS SAM template for everything (S3 bucket,
  CloudFront, certificate, API, Lambdas, DynamoDB, Cognito).
- GitHub Actions deploys on push to `main` with an AWS role (OIDC, no stored
  AWS keys): `sam deploy`, then `vite build` and sync to the app bucket.
- Domain: `app.azolute.one` with an ACM certificate; Miras adds the DNS
  records once (runbook).

### Login (F1)

- Cognito user pool with one user (miras@azolute.one), self sign-up off,
  **TOTP two-factor required**, Cognito's hosted login page.
- API Gateway checks the Cognito token on every app route. Short sessions with
  refresh; "sign out" everywhere.

### Data (DynamoDB, one table `azolute-app`, on-demand)

Every item carries `client` (phase 1: `azolute`, and any Content Engine
client). Access patterns the keys must serve:

- **Messages by conversation:** all messages of one contact on one number,
  in time order.
- **Conversation list:** each contact's latest message, newest first, with
  unread counting (the inbox's chat list).
- **Changes since:** everything written after a time, for the inbox to poll
  (same idea as the Hub's `updated_ms`, with the same two-minute overlap).
- **Message by id (wamid):** to merge status updates and ignore repeats.
- Clients, settings-change log, alerts, contact names: small item types in the
  same table.

The exact keys and indexes are the builder's call; the plan must write them
down.

### Getting messages into AWS

- New **ingest endpoint** `POST /ingest` on the app API, protected by a shared
  secret: an HMAC-SHA256 of the body in a header, made with n8n's Crypto node
  (as the café signing does). Not behind Cognito.
- The ingest **upserts by wamid** (repeats are harmless) and never blanks a
  field with an empty value (the lesson from the inbox review).
- **Hub change, additive only:** after `Log Message`, `Log Status`, `Log Reply
  To Owner`, and the Inbox API's `Log Sent Reply`, a "Copy To Azolute App" HTTP
  node posts the same row. It runs with `continueRegularOutput` and its
  failures only raise an alert, so the Hub behaves exactly as today when the
  app is down. The n8n table stays as the Hub's own record and fallback.
- **Catch-up:** a scheduled Lambda (every 15 min) reads the Hub's
  `wa-inbox/messages?since=` and upserts anything the app missed (app down,
  ingest refused). This also does the one-time history copy on its first run.
- **Alerts:** the Alerts workflow also posts each alert to `/ingest` so Health
  can show them.

### Inbox (1)

- Same layout and look as the `whatsapp-inbox` app: its `public/style.css` and
  page structure are reused, rebuilt as React components.
- Reads from the app API (conversations, thread, changes since). Polls every
  5 s while the tab is visible.
- **Sending:** the app API calls the Hub's `POST /webhook/wa-inbox/send` with
  the Inbox Key (stored in AWS Secrets Manager), so the Meta token stays in
  n8n. The row comes back through ingest like any other.
- **Photos:** the app API proxies the Hub's `wa-inbox/media`. Contact names are
  saved in DynamoDB (replacing the laptop's `contacts.json`).
- The laptop app keeps working (it reads the Hub) until Miras retires it.

### Clients (F2)

- List and edit: name, plan (Starter / Growth / Full), Content (none / Lite /
  Pro), modules, WhatsApp number(s) (phone number id), Content Engine
  `client_key`. Stored in DynamoDB. Seeded with `azolute`.

### Health (F4)

- One page: last message received (and how long ago), messages with an error
  in the last 7 days, the last alerts, and whether the catch-up job ran.
- n8n's own execution list is not read in phase 1 (that would need an n8n API
  key in AWS); a link opens n8n's Executions page.

### Automation settings (F3)

- A small new n8n workflow, **"Azolute App · Settings API"**, behind its own
  header key (like the Inbox API): read and update `content_settings` and
  `hub_settings` rows, only for an allowlist of fields.
- The app shows forms per client, with checks (number formats, required
  fields). **Secret fields** (`cafe_hub_secret`) are write-only: shown as
  "set / not set", never sent back to the browser.
- Every change is logged in DynamoDB (who, when, field, old and new value;
  secrets logged as "changed" only).
- A "Test" button where safe: Content Engine "Make one post now" (calls Plan
  Post's existing manual path if exposed; otherwise phase 2).
- Source of truth stays n8n for now; moving settings into the app's database is
  a later step.

## Cutover and rollout

1. Miras creates the repo, the AWS role, and the DNS records (runbook in the
   new repo).
2. Deploy the app; log in; inbox shows the history after the first catch-up.
3. Add the Hub's "Copy To Azolute App" nodes (additive) and the Settings API.
4. Use it alongside the laptop inbox; retire the laptop app when happy.

Rollback: disable the Hub's copy nodes; the Hub and laptop inbox are untouched.

## What's left to the builder

- DynamoDB keys and indexes (from the access patterns above).
- Cognito and CloudFront details, SAM layout, front-end structure and libraries
  (keep dependencies few, as in ClashCWL).
- Catch-up schedule details and ingest batch size.
- Which settings fields are on the allowlist (all non-secret columns of the two
  tables, plus `cafe_hub_secret` as write-only, is the starting point).
