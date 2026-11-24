# What changed: 24 November 2026 (strategy, pricing and plan)

Everything from the strategy and market-research session, in one place: what
changed, where it lives, and what is still to do. It sits next to
`docs/changes/2026-11-24-whatsapp-content-engine.md`, which covers the
WhatsApp and Content Engine build from the same days.

**Read next:** `docs/azolute-market-research-2026.md`, the public edition of
the research with all sources. A private edition, with client-specific deal
terms, is kept outside the repository.

**Status:** these are the research's recommendations, recorded as the working
plan. Nothing here changes a live client's price until that client is told in
writing. Where any doc disagrees, this doc wins. The older docs were
updated to match on the same day (see "Older docs updated" below).

## In one paragraph

Azolute stops selling one broad catalogue to any appointment-based business
and stops pricing like an Indian freelancer. In 2027 it sells the two engines
it has already built, the **WhatsApp booking desk** and the **Content Engine**,
to independent cafés, restaurants and bars in **Berlin**, starting with the
café that already runs the booking desk as the founding client. Each market
(India, Qatar/GCC, Germany) gets one fixed price card, and prices change only
on 1 January and 1 July. The goal is a **€5,000 monthly recurring floor** that
holds even in a month with no new sales. In the base case it is reached in
October 2028; €6,500 is the target that keeps the floor safe from
cancellations. Build only what earns money next: reel automation first, and
the admin portal waits until about ten clients.

## Decisions made with the owner

| Decision | Choice |
|---|---|
| The milestone | €5,000 a month of **recurring** revenue that lands even with zero new sales. Websites, apps and other projects are extra on top. |
| Main market | Germany. India and Qatar/GCC continue as referral markets at their own price cards. |
| Written vs live work | AI drafts all written material, including German website copy, emails and proposals. People take the live calls. |
| Sales calls | Warm calls only, to people who asked to be contacted. No cold calls. |
| The research report | Full report kept private, outside git. A public edition without personal or client-deal details is on `main`. |

## Strategy: old vs new

| | Before | Now |
|---|---|---|
| Who we sell to | Any appointment-based business in Europe and the GCC, plus an e-commerce track | Independent cafés, restaurants and bars in Berlin that take table bookings (2027) |
| What we sell | Three tiers (Starter / Growth / Full) with many unbuilt features | What is built: the booking desk and the Content Engine, plus add-ons as they are built |
| Niche review | none | December 2027: decide whether to add property managers (Hausverwaltungen) in 2028 with a Tenant Desk |
| Avoid | none | Medical and dental practices (Doctolib bundles an AI phone), trades (HERO, ToolTime and Label bundle one), salons (booking platforms are adding AI receptionists) |
| How we pitch | Features and minutes | A managed result: "Your bookings and guest messages on WhatsApp, answered at once, approved by you with one tap, with EU hosting, a data processing agreement and AI disclosure included." |
| Outcome pricing | none | Not now. From 2028, an optional capped fee per confirmed booking once a client has six months of data. |

Why Berlin hospitality: the booking desk already runs at a Berlin café, 87% of
operators in a DEHOGA NRW survey know no-shows first-hand, and Quandoo shuts
down on 31 December 2026, so restaurants are choosing new tools now.

## Prices: the old offer and what replaces it

| Old (ecosystem offer, business plan) | New (Germany card, net of VAT) |
|---|---|
| Starter €149/month + €490 setup | **Booking Desk €199/month + €990 setup**: WhatsApp booking with one-tap owner approval, guest messages, inbox and alerts, missed-call text-back, daily owner report, AVV, AI disclosure |
| Growth €299/month + €790 setup, "300 minutes included" | **Booking Desk + Phone €349/month + €1,490 setup**, from Q3 2027 and only if three clients ask; fair use of 1,000 minutes, review requests to every guest, deposit link where allowed |
| Full €499/month + €1,290 setup | Removed until its parts (retention, CRM, payments) exist |
| Content Engine Lite €99 / Pro €229 | **Content add-on €290/month, or €390 with 2 AI reels** (desk clients only) |
| Planned rise after 10 clients (€169 / €339 / €569) | Fixed cards; changes only on 1 January and 1 July |
| Commerce track draft (€199 / €349) | Paused. Shops are sold as projects (below). |
| Custom work at €45/hour minimum | €90/hour in Germany, ₹1,500/hour in India, QAR 300/hour in the GCC |

The full cards, with scope and market bands for every row, are in
`docs/azolute-market-research-2026.md`. Headline prices:

| | Germany (EUR, net) | India (INR) | Qatar / GCC (QAR) |
|---|---|---|---|
| Booking desk | €199/mo + €990 setup | ₹6,000/mo + ₹40,000 setup | QAR 750/mo + QAR 6,000 setup |
| Social content | €290–390/mo (add-on) | ₹25,000/mo | QAR 1,100–1,600/mo |
| Business website | €2,900 (booking page €1,490) | ₹60,000 (landing page ₹25,000) | QAR 9,000 (Arabic +QAR 4,000) |
| Online shop | €2,900, referral only | ₹50,000 starter / ₹90,000 | QAR 14,000 |
| Web app or portal | From €10,000, referral only | Portal ₹1,80,000 + ₹5,000/mo care; app from ₹2,00,000 | From QAR 30,000, referral only |
| AI product demo video | €1,490; three for €3,900 | ₹45,000; three for ₹1,20,000 | QAR 1,800; three for QAR 4,900 |
| Care plan | €49/mo site, €99/mo shop | ₹1,500 site, ₹2,000 store, ₹5,000 portal | QAR 400/mo |
| 2028 option | Tenant Desk €490/mo + €1,490 setup | — | — |

Germany terms: 19% VAT on top unless the small-business (Kleinunternehmer)
rule applies; 3-month minimum, then monthly; 15% off for a year paid ahead;
SEPA direct debit monthly in advance; the client pays Meta directly. The
**founding-client rate** (€149/month for 12 months, no setup fee, in return
for a case study, a Google review and three introductions) is for the
founding client only. Qatar: invoiced in QAR, and health-data projects are
declined.

## Deal rules (new)

- Quote only from the cards, and make each quote valid for 14 days.
- Give concessions in scope or free months, never in the price.
- One documented exception only: the founding-client rate.
- Builds in India and Germany are paid 50% at the start, 30% at the preview
  and 20% at acceptance. Qatar is paid 50% on order and 50% on delivery.
- Retainers are paid monthly in advance. Code, admin access and domains are
  handed over only after full payment.
- Existing retainers move to the card only with written notice, never in the
  middle of an agreed period.
- Builds that hold health data in India are designed for the DPDP Rules,
  which apply from 13 May 2027.

## Revenue goal and milestones (base case)

| Date | Recurring revenue |
|---|---|
| 30 Jun 2027 | About €1,300, with 2–3 German clients |
| 31 Dec 2027 | About €2,750, with 6 German clients; niche review |
| 30 Jun 2028 | About €3,900 |
| 31 Oct 2028 | **€5,000 floor** |
| 31 Mar 2029 | About €6,400–6,500, which holds the floor at 4% monthly churn |

The rule behind the numbers: recurring revenue stops growing at about **new
clients per month × average fee ÷ monthly churn**. A second module per client
(content on top of the desk) matters as much as winning new clients.

## Build order (changes `docs/app-azolute-one-plan.md`)

| When | Build | Why |
|---|---|---|
| December 2026 | Reel automation in the Content Engine | Content retainers promise reels; until they are automated, each reel is manual work |
| February to mid-March 2027 | Missed-call text-back and the owner's daily report | The Booking Desk price includes both; both reuse the WhatsApp Hub |
| Q2 2027 | Per-client log of messages and Meta costs; review requests to every guest | Meta now charges per message; asking only happy guests can breach Google's rules |
| Q3 2027 | Phone module, only if three paying clients ask | Compare our own Retell/Vapi build with configuring a German platform |
| 2028 | Admin/client portal, retention engine | 100–150 hours would take 2–4 months of all available build time in 2027 |

## Operations and compliance changes

- **WhatsApp billing:** Meta stops delivering messages from Indian WhatsApp
  accounts that are not billed in INR from 1 January 2027. The Azolute number
  is Indian (+91), so check the currency of its Meta account before
  31 December 2026.
- **Who owns each WhatsApp number (open question):** the research recommends
  that each client own its WhatsApp account and pay Meta directly. Today,
  café guest messages are sent from the Azolute number (decided 23–24 Nov).
  Decide before the café's paid plan starts.
- **Message costs:** since 1 October 2026 Meta charges service messages too
  (Germany: €0.0456 utility/service, €0.1131 marketing). Send fewer, combined
  messages, keep the guest introduction transactional, and get express consent
  for anything promotional.
- **AI models:** check which Gemini models the n8n flows call (Google's price
  list shows increases on 1 Dec 2026 and 1 Jan 2027). Gemini 2.5 Flash Image,
  the Content Engine's image model, shuts down on 15 March 2027. Generate
  reels on Veo Fast or Lite, not Standard.
- **Data:** move n8n and client data to an EU server before more German
  clients join. Sign a data processing agreement (AVV) with every client, with
  standard contractual clauses while any data is handled from India.
- **AI Act:** chat and phone agents say they are AI; realistic AI images and
  video are labelled; calls are never recorded without consent.
- **India:** register on Udyam before the next invoice; it gives a 45-day
  payment protection.
- **Germany:** register a Gewerbe, register for tax through ELSTER, choose a
  Steuerberater, decide between the Kleinunternehmer rule and regular VAT, buy
  IT liability insurance (at least €500,000, including pure financial loss),
  and publish an Impressum.

## Sales channels (changed)

- No cold email, WhatsApp or LinkedIn sales messages. German law (UWG § 7)
  requires prior consent, even between businesses.
- Warm calls only to people who asked. Then introductions from the founding
  client, a BNI chapter, a Google Business Profile, letters (with an objection
  notice) to cafés and restaurants nearby, and one German LinkedIn post a
  week.
- Referral fee: about 10% of the first setup fee.

## Changes, by place

### Azolute repo (this one), on `main`

| File | Change |
|---|---|
| `docs/azolute-market-research-2026.md` | New: public edition of the market research, price cards and scenarios |
| `docs/changes/2026-11-24-strategy-and-pricing.md` | New: this summary |
| `.gitignore` | New: `research_notes/` and `reports/` stay local, because they hold private material |

### Outside the repository (private, not in git)

The full research report (Markdown and PDF) with client-specific deal terms,
and the research notes behind it.

## Older docs updated to the new prices (24 Nov 2026)

- `docs/azolute-ecosystem-offer.md` (now v2): the new packages, add-ons and
  project prices, the India and Qatar/GCC cards, unit economics, terms,
  sales motion and phase plan
- `docs/azolute-business-plan.md`: section 1 prices and the first-10-client
  financials redone with the new prices (founding client + 4 Booking Desk +
  4 Booking Desk with content + 1 with phone and content: €3,930 MRR, €9,410
  setup revenue, €1,870/month surplus at the carried-over €25/hour founder
  rate), the new pricing policy and phases
- `docs/azolute-sales-playbook.md`: the €199 opening line, the change rates
  (€90 / ₹1,500 / QAR 300 an hour) and minimums, a new "Price cards and deal
  rules" section, and the e-commerce track marked paused
- `docs/app-azolute-one-plan.md`: plan names and the timing note (the
  portal waits until about ten clients)

**Still showing the old prices:** the public website's plans page
(`ecosystem.html`: €149 / €299 / €499). Changing it goes live on the next
push to `main`, so it is left for a separate decision.

## Still to do

**December 2026:** adopt the cards; check the Azolute WhatsApp account's
billing currency before 31 December; decide who owns the café's WhatsApp
sending; check the Gemini models and replace the image model; build reel
automation; move n8n to an EU server; prepare the German sales kit (one-page
booking-desk site in German, AVV with a sub-processor list, AI disclosure
text, German price card); shortlist a Steuerberater and get liability quotes;
register on Udyam.

**First quarter of 2027:** set up the German business (Gewerbe, ELSTER, VAT
choice, insurance, Impressum); sign the founding-client agreement and send
the first euro invoice on 1 February; build missed-call text-back and the
daily report; write the founding client's case study; start BNI, the Google
Business Profile, letters and weekly LinkedIn posts; hold a 90-day review in
early April.

**Later:** Q2 cost logging and review requests; Q3 phone module only on
demand; the niche review in December 2027; the admin portal in 2028.
