# Start here: where Azolute stands (24 November 2026)

Read this first in any new chat. It joins the two streams of work from 23–24
November 2026, the **market research and strategy for 2026–2028** and the
**n8n automations** (Content Engine and the WhatsApp move off Twilio), into one
picture, and points to the detailed docs. Where this file and a detailed doc
disagree, the detailed doc's newer date wins; update this file when that
happens.

## In one paragraph

Azolute (Miras's AI automation studio) has two working engines on n8n: the
**WhatsApp booking desk** (live at a Berlin café, Toasty Turtle Cafe, today on
Twilio) and the **Content Engine** (Claude drafts Instagram posts, the owner
approves on WhatsApp). The research says: stop pricing like an Indian
freelancer, sell those two engines to independent cafés, restaurants and bars
in **Berlin** in 2027 at fixed price cards (Booking Desk €199/month + €990
setup), and reach a **€5,000 recurring monthly floor by October 2028**. The
WhatsApp number is ready to move from Twilio to Meta's Cloud API through a new
**WhatsApp Hub** on n8n: everything is built and tested, but nothing is
switched on until Miras does the runbook steps. The next build is the
**app.azolute.one** phase 1 (login, clients, WhatsApp inbox on AWS, health,
settings), whose design is drafted and waiting for approval.

## The plan (research, 2026–2028)

Full detail: `docs/azolute-market-research-2026.md` (public edition, with
sources) and `docs/changes/2026-11-24-strategy-and-pricing.md` (the decisions).
The private edition, with client-specific deal terms, is kept outside git
(`research_notes/` and `reports/` are in `.gitignore`).

- **Main market:** Germany, Berlin hospitality first. India and Qatar/GCC are
  referral markets with their own cards. Avoid medical/dental, trades and
  salons (platforms there bundle AI phone agents).
- **Pitch:** a managed result ("bookings and guest messages on WhatsApp,
  answered at once, approved by you with one tap, EU hosting, AVV and AI
  disclosure included"), not features and minutes.
- **Germany card (net):** Booking Desk €199/mo + €990 setup; Booking Desk +
  Phone €349/mo + €1,490 (from Q3 2027, only if three clients ask); Content
  add-on €290/mo or €390 with 2 AI reels; website €2,900; demo video €1,490;
  care €49–99/mo; custom work €90/hour. Founding client only: €149/mo for 12
  months, no setup fee.
- **India / Qatar:** booking desk ₹6,000/mo + ₹40,000 setup; QAR 750/mo + QAR
  6,000 setup. Full cards in the research doc.
- **Deal rules:** quote only from the cards (valid 14 days); concede scope or
  free months, never price; prices change only on 1 January and 1 July.
- **Sales:** no cold email, WhatsApp or LinkedIn (UWG § 7). Warm calls only,
  then founding-client introductions, BNI, Google Business Profile, letters,
  one German LinkedIn post a week. Referral fee ~10% of the first setup fee.
- **Milestones (base case):** ~€1,300 MRR by 30 Jun 2027; ~€2,750 by 31 Dec
  2027 (niche review: add property managers / Tenant Desk in 2028?); ~€3,900
  by 30 Jun 2028; **€5,000 by 31 Oct 2028**; ~€6,500 by 31 Mar 2029.
- **Build order:** Dec 2026 reel automation in the Content Engine; Feb–Mar
  2027 missed-call text-back and the owner's daily report; Q2 2027 per-client
  message/Meta-cost log and review requests; Q3 2027 phone module on demand;
  2028 admin/client portal and retention engine.

Docs already updated to these prices: `docs/azolute-ecosystem-offer.md` (v2),
`docs/azolute-business-plan.md`, `docs/azolute-sales-playbook.md`,
`docs/app-azolute-one-plan.md`, and the public plans page `ecosystem.html`
(24 Nov). **Not yet updated:** the website chat assistant (n8n "Azolute Site
Chat") still tells visitors "from EUR 149 a month, month to month, cancel
anytime"; see `docs/changes/2026-11-24-website-pricing.md`.

## The automations (n8n)

Instance: `https://n8n-jrkw.srv2144760.hstgr.cloud` (Hostinger VPS). Detail:
`docs/changes/2026-11-24-whatsapp-content-engine.md`,
`docs/content-engine-setup.md`, `docs/whatsapp-cutover-runbook.md`,
`docs/superpowers/specs/2026-11-24-whatsapp-off-twilio-design.md`.

State checked live on 24 Nov 2026:

| Workflow | Id | Active | Git export |
|---|---|---|---|
| WhatsApp Hub | `IorCSvwB305dpU5g` | no (built, tested) | none; n8n keeps the version history |
| WhatsApp Hub · Inbox API | `BuatfauT1gooTQ9q` | no (built, tested) | none |
| WhatsApp Hub · Alerts | `M8FOdndi0Jfx2Qv6` | **yes** (only acts on failures) | none |
| Content Engine · Owner Replies | `7b7LKdOUEbPPUctx` | no; called by the Hub | `docs/n8n/content-engine-owner-replies.json` (matches the latest version) |
| Content Engine · Plan Post | `dJQEkHIlElhTMr14` | no (Mon/Wed/Fri 10:00 when on) | `docs/n8n/content-engine-plan-post.json` |
| Content Engine · Render & Preview | `7MMg2MhNJJQfXw3A` | no (sub-workflow) | `docs/n8n/content-engine-render-preview.json` |
| Content Engine · Media Server | `OB4FHohps9OJxdh5` | **yes** | `docs/n8n/content-engine-media-server.json` |
| Azolute Site Chat | `BNbSX6whgbJNrmA7` | **yes** | `docs/n8n/azolute-site-chat.json` (see note) |
| Azolute Contact Intake | `FK6950GDFlPL3Ur8` | **yes** | `docs/n8n/azolute-contact-intake.json` |

Data tables: `wa_messages` (`Cql2asOYThN8DQAY`, the message log; Meta keeps
none), `hub_settings` (`SzK9AOIHvuDsOEGi`, values still `SET_ME`),
`content_settings` (`FgcxxifTQHm8YADN`), `content_posts`
(`RGzZbSzf1Ho4U9Ml`), `content_media` (`NrQdF12IGWYP5nca`).

Notes from the 24 Nov check:

- The Content Engine exports match the latest saved n8n versions. Owner
  Replies also has the Alerts workflow as its error workflow; that setting was
  added to its export.
- Site Chat and Contact Intake don't allow MCP access, so they couldn't be
  compared. Site Chat was edited in n8n (9 Nov, 23:08 UTC) after its export
  was last committed (9 Nov, 09:32 UTC); the export may be behind.
- The Hub, Inbox API and Alerts have no git export yet.

### Other repos in this work

- **Café:** `miras-dev/toasty`, branch `claude/whatsapp-meta` (Apps Script with
  `WHATSAPP_PROVIDER=twilio|meta` and optional owner approval; 25 tests). Not
  merged.
- **Inbox app:** `miras-dev/whatsapp-inbox`, branch `claude/whatsapp-meta`
  (`INBOX_SOURCE=twilio|hub`, Twilio import; 12 tests). Not merged.
- **ClashCWL:** `miras-dev/clash-cwl`, no change; it left WhatsApp for Discord.
  Remove its `TWILIO_*` and `WATCH_WHATSAPP_TO` settings on cutover day.

## Next build: app.azolute.one

- Plan: `docs/app-azolute-one-plan.md` (all features, phases, the automation
  settings page, the move of messages to AWS).
- Phase 1 design: `docs/superpowers/specs/2026-11-24-app-azolute-one-phase1-design.md`
  (draft for approval; builder check done and Miras's answers added). Login
  with two-factor, clients list, WhatsApp inbox in the browser, messages
  stored on AWS, health page, settings forms.
- The research says the full client portal waits until about ten clients;
  phase 1 is Miras's own tool.

## What to do next, in order

**Miras, December 2026**

1. Check the Azolute WhatsApp account's Meta billing currency before
   31 December (Meta stops Indian numbers not billed in INR from 1 Jan 2027).
2. Do Part A of `docs/whatsapp-cutover-runbook.md` (Meta app, System User
   token, templates, n8n credentials, fill `hub_settings`, test on Meta's test
   number, paste the new café script), then Part B (cutover, about an hour)
   and Part C (remove Twilio, close it).
3. Decide who owns the café's WhatsApp sending (the research says each client
   owns its own account) before the café's paid plan starts.
4. Approve or change the app.azolute.one phase 1 design.
5. Update the Site Chat assistant's prices in n8n (or allow MCP access on that
   workflow so Claude can do it).
6. Business set-up: Udyam registration; shortlist a Steuerberater and get IT
   liability quotes.

**Build (Claude), December 2026**

1. Reel automation in the Content Engine.
2. Check which Gemini models the n8n flows call; replace Gemini 2.5 Flash
   Image (shuts down 15 Mar 2027). Generate reels on Veo Fast or Lite.
3. Plan the move of n8n and client data to an EU server.
4. German sales kit: one-page booking-desk site in German, AVV with
   sub-processor list, AI disclosure text, German price card.
5. Optional: export the Hub, Inbox API and Alerts to `docs/n8n/`; refresh the
   Site Chat export.

**Q1 2027:** German business set-up (Gewerbe, ELSTER, VAT choice, insurance,
Impressum); founding-client agreement and first euro invoice on 1 February;
missed-call text-back and daily report; case study; BNI, Google Business
Profile, letters, LinkedIn; 90-day review in early April.

## How to work in this repo

- `main` deploys the website to AWS S3 on every push
  (`.github/workflows/deploy.yml`). `docs/`, `.claude/`, `scripts/` and
  `stash/` are not uploaded, but any `.html` change goes live.
- Work on a `claude/...` branch, then merge to `main`. Before merging, check
  that no other branch has newer versions of the same docs (several chats
  often run at once).
- Never commit `research_notes/`, `reports/`, secrets or client deal terms.
  This repo is the public edition.
- Change logs live in `docs/changes/` (one file per day and topic); add one
  for each session's work and update this file.

## Branches on 24 Nov 2026

Every `claude/...` branch was checked against `main`. Everything newer was
merged into `main` (the new prices in the offer, business plan, playbook and
app plan; the phase 1 design answers). The remaining branches only hold older
copies of files that `main` already has in newer form, or the 9 Nov plugin
experiment (`claude/adoring-pasteur-ufbafo`), whose last commit removed the
plugin config again. Nothing on them
needs merging.
