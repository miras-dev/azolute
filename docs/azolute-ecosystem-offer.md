# The Azolute AI Ecosystem — Offer Sheet (internal draft v1)

One subscription that runs the front desk of a small business: answers the
phone, replies on WhatsApp, fills the calendar, chases no-shows, brings
customers back, and reports to the owner every morning.

Positioning line: **"Your business, running itself — with an engineer behind it."**

What makes it different from GoHighLevel resellers: every install is wired by
an engineer into the tools the business already uses, runs on infrastructure
we control, and comes with a human who stays. We sell mechanisms, never
promised revenue numbers.

---

## The three tiers

Prices in EUR for Europe; charge USD equivalents in the GCC. Month-to-month,
cancel anytime, no long contracts. Setup fee is one-time and covers
onboarding, knowledge-base building, number/WhatsApp verification and launch.

### 1. STARTER — €149 / month (+ €490 setup)

*"Never miss another enquiry."*

| Module | What it does |
|---|---|
| WhatsApp AI agent | Replies instantly, 24/7, from the business's approved information only; collects name, need and contact; hands over to the owner for anything it shouldn't answer |
| Online booking | Booking page wired to the business calendar; automated confirmations and reminders (cuts no-shows) |
| Missed-call text-back | Any missed call instantly triggers a WhatsApp/SMS: "Sorry we missed you — book here" |
| Owner's daily report | One WhatsApp/email every morning: enquiries answered, leads captured, bookings made |

Included fair use: 1,000 AI conversations/month (then €15 per extra 500 —
stated up front, never silently billed). Typical hard cost to us: €20–40/mo.

### 2. GROWTH — €299 / month (+ €790 setup)

*Everything in Starter, plus the phone.*

| Additional module | What it does |
|---|---|
| AI phone receptionist | Answers calls 24/7, takes bookings, captures caller details, answers approved questions, transfers to a human when needed. Discloses it is an AI assistant. |
| Review engine | Automatic review requests after a visit; AI-drafted responses to Google reviews for the owner to approve |
| No-show protection | Deposit / card-hold payment links on bookings where the business wants them |

Included: 300 voice minutes/month (then €0.25/min, stated up front).
Typical hard cost to us: €60–90/mo at moderate volume.
GCC caveat: voice AI sold in Europe now; in UAE/KSA only after our telephony
spike validates a compliant local-number route. WhatsApp-first in the Gulf.

### 3. FULL ECOSYSTEM — €499 / month (+ €1,290 setup)

*Everything in Growth, plus the growth engine.*

| Additional module | What it does |
|---|---|
| Customer retention engine | QR opt-ins at the counter/table; personalised offers by spend history; win-back campaigns for lapsed customers (the Germany restaurant playbook, productised) |
| Lightweight CRM | Every call, message and booking becomes a contact with history and a simple pipeline |
| Invoicing & payments | Payment links in chat; deposits; simple invoicing |
| Quarterly optimisation | We review the numbers with the owner and tune the system; one custom automation per quarter included |
| Priority support | Same-day response |

Typical hard cost to us: €90–130/mo. Margin at all tiers: 70–80%+.

---

## Add-ons (any tier)

- Website design & build: existing project pricing (the ecosystem's front door)
- Additional location / branch: +50% of tier price per location
- Additional language for the agents: priced per language (Arabic voice: after validation)
- Custom integrations beyond scope: quoted as small projects
- Content Engine (below): Lite €99/mo or Pro €229/mo

## Add-on: CONTENT ENGINE

Social content, produced by AI, approved by the owner, published
automatically to Instagram and YouTube. The owner is the editor-in-chief;
the AI is the production team. Nothing publishes without their tap.

### Content Engine LITE — €99/month (+ €190 setup)

| Deliverable | Detail |
|---|---|
| 12 Instagram posts/month (~3/week) | AI-drafted caption + hashtags + visual: the owner's photos (enhanced, brand-framed), branded template graphics, or AI-generated brand artwork |
| Up to 4 YouTube uploads/month | Owner supplies the clip; we handle title, description, tags, templated thumbnail, scheduling, publishing |
| One-tap WhatsApp approval | Every post previews in the owner's WhatsApp: Approve / Edit / Skip. Plain-language edits regenerate the draft |
| Monthly content calendar | Auto-suggested from offers, events, seasonality and past performance; approved in the same flow |
| Performance line in the owner's report | Posts, reach, likes, best of the week |

Setup (€190): Instagram Business + Facebook Page + YouTube linking, API
verification, 4-6 branded templates, caption voice trained on approved wording.

### Content Engine PRO — €229/month (+ €190 setup)

Everything in Lite, plus the AI creates the material:

| Deliverable | Detail |
|---|---|
| 12 AI-generated visuals/month | Brand-styled images from a prompt library built at setup |
| 4 AI-generated video Reels/Shorts per month | 15-20s clips with music, captions and branded end-card, published to Instagram Reels + YouTube Shorts |
| One themed monthly campaign | A matched set of visuals + video + copy around one event or offer |

### Not included (printed on every order)

- Filming or video editing: raw clips and photos come from the owner (Lite)
- Replying to DMs/comments (that is the WhatsApp agent's module)
- Paid ads management
- Follower or reach guarantees
- Publishing anything the owner has not approved

### Content guardrails

- Real products are shown with real photos; AI visuals are illustrative /
  branded style only (an AI-invented dish photo is a complaint waiting to
  happen). Same no-fabricated-content rule as the rest of Azolute.
- Platform AI-disclosure flags (Meta, YouTube) are set automatically on
  realistic synthetic media.

### Production pipeline and unit economics

Stills: gemini-2.5-flash-image (~$0.04/image). Video: Veo 3.1 Fast via the
same Gemini API (~$0.10/second) animating our own stills (image-to-video
keeps every clip on-brand); full Veo 3.1 (~$0.40/s) for the monthly hero
piece; FFmpeg assembles clips + branded intro/end-card + captions, so only
8-12s of each Reel is generated. The n8n video step is a provider-agnostic
adapter with fal.ai (Kling/Seedance/MiniMax) as the swap layer, because
this market reprices quarterly.

Higgsfield is deliberately NOT in the pipeline: it is a creator platform
reselling the same models at a markup, its developer API has a ~$700
prepaid floor against our ~€10-25/client/month need, and its strengths
(hand-tuned camera work) apply when a human crafts one video, not when a
pipeline produces forty. A cheap creator subscription remains an optional
artisan tool for Azolute's own marketing and occasional hero pieces.

| | Lite | Pro |
|---|---|---|
| Price | €99/mo | €229/mo |
| Hard cost | ~€4/mo | ~€15-25/mo |
| Founder time after setup | ~1h/mo | ~1-2h/mo |
| Gross margin | ~90% | ~85% |

Overage and extras: additional posts €5 each or +12 for €49/mo; extra
platform (TikTok / Facebook cross-post) +€29/mo.

## What is never included

- Guaranteed revenue or ranking numbers (we show mechanisms, not promises)
- Paid ad management
- The client's Meta/WhatsApp business verification fees or telco charges
  beyond the included allowances (rebilled transparently at cost)

---

## Why we can price here (unit economics)

| | Starter | Growth | Full |
|---|---|---|---|
| Price | €149 | €299 | €499 |
| Our hard cost | €20–40 | €60–90 | €90–130 |
| Gross margin | ~75–85% | ~70–80% | ~74–82% |

Stack: self-hosted n8n (automation brain), WhatsApp Business Cloud API
(official), Cal.com (booking), Twilio/Telnyx (numbers & SMS), Retell/Vapi
(voice agents), Claude/OpenAI APIs (language), our own reporting.
No per-seat platform licence. GoHighLevel's equivalent package carries
~€130+/month in hard costs per business before their platform fee — our
pricing sits at the market level while our costs sit far below it.

## Operational terms (put in every agreement)

- The AI answers only from information the business approves in writing
- Calls open with an AI disclosure; recordings per-country consent rules (GDPR)
- WhatsApp requires the business's Meta verification and customer opt-in
- The client owns their data; export provided on cancellation
- Fair-use allowances and overage prices are printed on the order, never silent

## Sales motion

1. Outreach emails (existing skill) now pitch ONE mechanism from the
   ecosystem that fits the signal we saw, with the tier as the vehicle
2. 15-minute call → pick tier → agree scope → setup fee invoiced
3. Live in 2 weeks (Starter) / 3-4 weeks (Growth, Full)
4. Month 2+: upsell path Starter → Growth → Full driven by the daily report
   ("you missed 23 calls last month" sells the receptionist by itself)

## First ten clients: the financial plan

The full business model, financial plan and execution strategy live in
**docs/azolute-business-plan.md** (the authoritative version). Snapshot:
4/4/2 client mix, €2,790 MRR, €7,700 setup revenue, €2,345/month operating
budget with founder pay (51h × €25) as a real cost, €445/month retained
surplus (~15.9%), founding-client pricing raised for new clients only
after ten (€169/€339/€569).

## Phase plan

- Phase 1 (now): sell Starter + Growth in Europe, Starter in GCC. Build the
  n8n template stack once; client #2 onboards in days
- Phase 2 (3-10 clients): GCC voice spike; consider GHL Unlimited ($297, all
  clients) ONLY if clients ask for a self-serve dashboard
- Phase 3 (10+ clients): productise self-serve onboarding; revisit SaaS mode
