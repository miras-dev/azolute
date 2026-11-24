# AZOLUTE AI ECOSYSTEM

**Business Model, Pricing & Financial Plan — First 10 Clients**

- Business: Azolute AI Technologies
- Target markets: Germany, Berlin hospitality (primary, from 2027); India
  and Qatar/GCC (referral markets)
- Business model: AI automation as a managed monthly subscription
- Initial target: 10 paying German clients (base case: around mid-2028)
- Longer-term goal: a €5,000/month recurring floor that holds with zero new
  sales (base case: October 2028); €6,500 keeps it safe from cancellations
- Target operating profit margin: at least 15–20% after founder compensation

Prices updated on 24 November 2026; what changed and why is in
`docs/changes/2026-11-24-strategy-and-pricing.md`. Cost assumptions (the
€25/hour internal founder rate and the infrastructure estimates) carry over
from the first version and are not re-estimated; see the note in section 8.

---

## 1. Service packages & pricing (Germany, EUR net of VAT)

### BOOKING DESK — €199/month, €990 setup

Included services:

- WhatsApp AI agent (24/7 guest enquiries, from approved information)
- Website and WhatsApp bookings with one-tap owner approval; works with the
  venue's existing reservation tool
- Inbox and alerts
- Missed-call WhatsApp follow-ups (in build; live by mid-March 2027)
- Daily owner report (in build; live by mid-March 2027)
- Data processing agreement (AVV), AI disclosure and EU hosting
- Meta's message fees are paid by the client directly

Estimated monthly infrastructure cost: €20–40

Founding-client rate: €149/month for 12 months, no setup fee. For the
founding client only, in return for a case study, a Google review and three
introductions.

### BOOKING DESK + PHONE — €349/month, €1,490 setup

On sale from Q3 2027, and built only once three paying clients ask for it.
Everything in the Booking Desk, plus:

- AI phone receptionist (24/7), fair use of 1,000 minutes per month
- Review requests to every guest; AI-assisted review responses
- Deposit links where the venue's terms allow

Estimated monthly infrastructure cost: €60–90

### FULL ECOSYSTEM — not on sale until its parts exist (earliest 2028)

Planned modules: customer retention automation, win-back campaigns,
lightweight CRM, customer history, invoicing and payment integrations,
quarterly business optimisation and priority support.

### ADD-ON: CONTENT (desk clients only)

AI-produced Instagram content, always approved by the owner in WhatsApp
before publishing.

- **€290/month:** 8 posts and 8 stories a month; captions, hashtags and
  visuals from the owner's photos, branded templates or AI brand artwork;
  monthly content calendar; performance in the owner report; labels on
  realistic AI images. Estimated hard cost: ~€4/month.
- **€390/month:** the same, plus 2 AI reels a month. Estimated hard cost:
  ~€10–15/month.
- No separate setup fee: brand setup is done during the desk onboarding.

Exclusions printed on every order: no filming/video editing, no DM/comment
management, no paid ads, no follower guarantees, nothing published without
owner approval.

Content guardrails: real products use real photos (AI visuals are
illustrative/brand-style only); platform AI-disclosure flags are set
automatically.

Production stack: gemini-2.5-flash-image for stills (~$0.04/image; it shuts
down on 15 March 2027, so the image step must move to its successor before
then); Veo 3.1 Fast or Lite via the Gemini API animating our own stills, not
full Veo (Standard) for routine reels; FFmpeg assembly (only 8-12s generated
per Reel); provider-agnostic n8n adapter with fal.ai (Kling/Seedance/MiniMax)
as the swap layer. Higgsfield excluded from the pipeline (reseller markup,
~$700 prepaid API floor, creator-tool strengths irrelevant to unattended
production); a cheap creator subscription remains optional for hand-crafted
hero content.

Revenue note: content is the designated second module, offered within three
months of every desk; clients with two or more modules stay far longer. In
the mix below, content brings €1,840 of the €3,930 MRR (about 47%) with no
new fixed costs.

### Projects and other markets

Websites, shops, portals, AI demo videos and care plans, and the India (INR)
and Qatar/GCC (QAR) cards, are in `docs/azolute-ecosystem-offer.md`.

---

## 2. Infrastructure & technology stack

| Component | Technology |
|---|---|
| Automation engine | Self-hosted n8n |
| WhatsApp integration | Meta Cloud API, through the WhatsApp Hub on n8n |
| AI language models | OpenAI / Claude |
| AI voice receptionist | Retell / Vapi |
| Telephony | Twilio / Telnyx |
| Appointment booking | Cal.com |
| Database & CRM | PostgreSQL |
| Backend services | Node.js / Python |
| Hosting | VPS / Cloud infrastructure, on an EU server for German clients' data |
| Reporting | Custom automated reports |
| Monitoring | Logging, backups and alerts |

Infrastructure strategy:

- Shared infrastructure wherever practical
- Isolated customer data, hosted in the EU for German clients
- Reusable automation templates
- Usage-based AI API billing
- Each client owns its WhatsApp Business account and pays Meta directly
- Automated deployments
- Minimal per-client software licensing
- Transparent usage allowances and overage billing

Provider licensing, telephony availability, and data-protection requirements
must be validated before launch.

---

## 3. First 10 clients — sales target

| Package | Clients | Monthly price | Monthly revenue |
|---|---|---|---|
| Founding client: desk at the founding rate + content | 1 | €149 + €290 | €439 |
| Booking Desk | 4 | €199 | €796 |
| Booking Desk + content | 4 | €199 + €290 | €1,956 |
| Booking Desk + Phone + content with 2 reels | 1 | €349 + €390 | €739 |
| **TOTAL** | **10** | | **€3,930** |

- Monthly recurring revenue (MRR): **€3,930** (about €393 per client)
- Annual recurring revenue (ARR): **€47,160**

The mix assumes most venues start with the desk, about half add content
within three months, and one takes the phone module once it exists. ARR
assumes all 10 clients remain subscribed for 12 months and excludes setup
fees. At 4% monthly churn about one client in 25 cancels each month, so
this is a snapshot, not a steady state; the month-by-month scenarios are in
`docs/azolute-market-research-2026.md`.

---

## 4. One-time setup revenue

| Package | Clients | Setup fee | Total |
|---|---|---|---|
| Founding client | 1 | €0 | €0 |
| Booking Desk | 4 | €990 | €3,960 |
| Booking Desk + content | 4 | €990 | €3,960 |
| Booking Desk + Phone + content | 1 | €1,490 | €1,490 |
| **TOTAL** | **10** | | **€9,410** |

### Estimated onboarding labour

| Package | Hours per client | Total hours |
|---|---|---|
| Founding client (content setup only; the desk is already live) | 4 | 4 |
| Booking Desk | 12 | 48 |
| Booking Desk + content | 16 | 64 |
| Booking Desk + Phone + content | 26 | 26 |
| **Total** | | **142 hours** |

Per-client hours carry over the first plan's estimates (12 hours for the
desk, 22 for the phone) plus 4 hours for content setup.

Founder hourly compensation assumption: €25

- Onboarding labour cost: 142 × €25 = **€3,550**
- Remaining setup revenue: €9,410 − €3,550 = **€5,860**

This €5,860 is before additional onboarding expenses, such as telephone
provisioning, external integrations, verification, and other
implementation costs.

---

## 5. Monthly infrastructure costs

| Package | Clients | Average cost/client | Total |
|---|---|---|---|
| Founding client (desk + content) | 1 | €34 | €34 |
| Booking Desk | 4 | €30 | €120 |
| Booking Desk + content | 4 | €34 | €136 |
| Booking Desk + Phone + content with reels | 1 | €90 | €90 |
| **TOTAL** | **10** | | **€380** |

The desk (€30) and phone (€75) figures carry over from the first plan;
content adds about €4, or €15 with reels. Meta's message fees are paid by
clients directly. These are planning estimates, not fixed supplier
quotations; per-client cost logging from Q2 2027 replaces them.

---

## 6. Founder salary calculation

Founder hourly compensation: €25/hour

### Estimated monthly workload

| Responsibility | Hours/month |
|---|---|
| Founding client (desk + content) | 3 |
| Booking Desk clients (4 × 2h) | 8 |
| Booking Desk + content clients (4 × 3h) | 12 |
| Booking Desk + Phone + content client | 6 |
| Shared administration, sales and infrastructure maintenance | 15 |
| **TOTAL** | **44 hours** |

- Monthly founder compensation: 44 × €25 = **€1,100**
- Annual founder compensation: **€13,200**

This compensates 44 hours per month. Additional development, onboarding,
or sales hours must be accounted for separately.

---

## 7. Monthly operating expenses

| Expense | Monthly amount |
|---|---|
| Infrastructure | €380 |
| Founder compensation | €1,100 |
| Business overhead and sales | €300 |
| German tax adviser and IT liability insurance | €120 |
| Contingency allocation (about 4% of revenue) | €160 |
| **TOTAL** | **€2,060** |

---

## 8. Company profit calculation

- Monthly revenue: €3,930
- Budgeted operating expenses and contingency: €2,060
- Remaining operating surplus: €3,930 − €2,060 = **€1,870/month**

### Financial summary

| Metric | Monthly | Annual |
|---|---|---|
| Revenue | €3,930 | €47,160 |
| Infrastructure | €380 | €4,560 |
| Founder compensation | €1,100 | €13,200 |
| Overhead, sales, tax adviser and insurance | €420 | €5,040 |
| Contingency allocation | €160 | €1,920 |
| **Company operating surplus** | **€1,870** | **€22,440** |

Profit margin: €1,870 ÷ €3,930 × 100 = **47.6%**

Accounting clarification: these figures treat the €160 contingency
allocation as a budgeted cost. If it is simply retained as a cash reserve,
rather than spent or accrued as an expense, operating profit before tax
would be €2,030/month, or approximately 51.7%.

**Founder rate note:** €25/hour is the first plan's internal compensation
figure, not a market rate; German software freelancers bill a median of
about €90/hour. Paying the same 44 hours at €90 (€3,960) would turn this
surplus into a loss of about €990 a month. That is roughly why €5,000 is the
recurring floor: at about that revenue, the same work pays a market rate.

---

## 9. Personal income vs company profit

**Founder**

- Monthly compensation: €1,100
- Annual compensation: €13,200

**Azolute AI Technologies**

- Monthly retained operating surplus: €1,870
- Annual retained operating surplus: €22,440

**Combined economic benefit**

- €1,100 + €1,870 = **€2,970/month** (annual equivalent €35,640)

This is not entirely personal take-home income. Company profit remains in
the business unless lawfully distributed, and applicable taxes have not
been deducted.

---

## 10. Pricing policy

From 24 November 2026, prices come from one fixed card per market
(`docs/azolute-ecosystem-offer.md`) instead of founding prices that rise
after ten clients.

- Quotes come only from the cards and are valid for 14 days
- Prices change only on 1 January and 1 July, with written notice; existing
  customers keep their agreed terms until then
- Concessions are made in scope or free months, never in price; the one
  documented exception is the founding-client rate
- Complex integrations and changes are quoted at €90/hour (₹1,500 in India,
  QAR 300 in the GCC)
- Additional locations: +50% of the package price per location
- Meta's message fees are paid by clients directly; AI and telephony usage
  beyond fair use is billed transparently
- Pricing is reviewed against measured per-client costs (from Q2 2027)

---

## 11. First 10 clients — execution strategy

### Phase 1: Founding client and the first Berlin venues — validate the desk (December 2026 to mid-2027)

- Move the founding client onto the paid founding rate (from 1 February 2027)
- Build reel automation in the Content Engine (December 2026)
- Build missed-call text-back and the daily owner report (by mid-March 2027)
- Move n8n and client data to an EU server; sign an AVV with every client
- Establish customer-specific data isolation; configure monitoring and backups
- Validate actual AI conversation and Meta message costs per client

### Phase 2: Clients 4–6 — standardise delivery

- Reduce onboarding time
- Reuse customer deployment templates
- Offer the content add-on within three months of every desk
- Log messages and Meta costs per client (Q2 2027)
- Establish support procedures
- Track actual maintenance hours

### Phase 3: Clients 7–10 — validate profitability

- Reach about €3,930 MRR
- Maintain operating costs within budget
- Compensate the founder at the planned hourly rate
- Build the phone module only if three paying clients ask (Q3 2027)
- Gather case studies and customer feedback
- December 2027 review: decide whether to add property managers (Tenant
  Desk) in 2028

### Phase 4: After 10 clients — toward the floor

- Reach the €5,000 recurring floor (base case: October 2028), then €6,500
- Build the admin/client portal and the retention engine (2028)
- Improve infrastructure efficiency
- Reduce manual maintenance
- Consider additional engineering/support capacity when financially justified
- Expand beyond Berlin only once the floor holds

---

## 12. Financial goals

| Metric | Initial target |
|---|---|
| Paying clients | 10 |
| Monthly recurring revenue | €3,930 |
| Annual recurring revenue | €47,160 |
| One-time setup revenue | €9,410 |
| Monthly infrastructure budget | €380 |
| Founder monthly compensation | €1,100 |
| Monthly contingency allocation | €160 |
| Monthly retained operating surplus | €1,870 |
| Retained surplus margin | 47.6% |
| Long-term operating margin target | at least 15–20% |
| Recurring floor (longer term) | €5,000/month; €6,500 churn-safe |

Important: these figures assume the client mix in section 3, carried-over
cost estimates, 44 monthly founder work hours after onboarding and the €25
internal founder rate (see the note in section 8). They exclude business
income tax, unexpected major expenses, and any unbudgeted engineering work.

---

## 12b. Sales discipline and the e-commerce track

The sales process, qualification checklists, success metrics, deal rules,
custom pricing framework and the (paused) e-commerce catalogue live in
**docs/azolute-sales-playbook.md**. The rules that bind this plan:

- No prices quoted during discovery calls; proposals within 48 hours from
  the price cards, valid for 14 days
- Custom work is priced at €90/hour in Germany (₹1,500 in India, QAR 300 in
  the GCC), never at the €25/hour internal compensation rate; 60% minimum
  gross margin
- The Booking Desk catalogue serves Berlin hospitality in 2027; shops are
  sold as projects from the cards, and the Commerce track draft is paused
- No cold email, WhatsApp or LinkedIn sales messages and no cold calls in
  Germany (UWG § 7): warm introductions only

## 13. Core business principles

1. Sell managed AI automation services, not software licences alone
2. Prioritise reliable delivery over acquiring customers at unsustainable prices
3. Quote only from the price cards; give concessions in scope, never in price
4. Compensate founder engineering time as a real business expense
5. Maintain an operating profit margin of at least 15–20%
6. Reuse infrastructure and automation templates wherever possible
7. Keep customer data isolated and provide transparent data-export procedures
8. Define usage limits, support obligations, and customisation boundaries
9. Reinvest retained profits into reliability, automation, and growth
10. Change prices only on 1 January and 1 July, with written notice, after reviewing measured costs

---

## Final financial snapshot

| | |
|---|---|
| Monthly recurring revenue | €3,930 |
| One-time setup revenue | €9,410 |
| Monthly infrastructure | €380 |
| Founder monthly compensation | €1,100 |
| Monthly overhead, tax adviser and insurance | €420 |
| Monthly contingency allocation | €160 |
| Company monthly operating surplus | €1,870 |
| Company annual operating surplus | €22,440 |
| Budgeted operating surplus margin | 47.6% |

**Business objective:** establish 10 recurring customers in Berlin
hospitality, build reliable reusable infrastructure, pay the founder for
actual engineering work, and grow toward a €5,000 recurring floor that holds
without new sales.
