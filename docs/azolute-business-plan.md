# AZOLUTE AI ECOSYSTEM

**Business Model, Pricing & Financial Plan — First 10 Clients**

- Business: Azolute AI Technologies
- Target markets: Europe (primary), GCC (secondary)
- Business model: AI automation as a managed monthly subscription
- Initial target: 10 paying clients
- Target operating profit margin: 15–20% after founder compensation

---

## 1. Service packages & pricing

### STARTER — €149/month, €490 setup

Included services:

- WhatsApp AI agent (24/7 customer enquiries)
- Online booking and calendar integration
- Automated booking confirmations and reminders
- Missed-call WhatsApp/SMS follow-ups
- Daily business performance reports
- 1,000 AI conversations per month

Estimated monthly infrastructure cost: €20–40

### GROWTH — €299/month, €790 setup

Everything in Starter, plus:

- AI phone receptionist (24/7)
- 300 AI voice minutes per month
- Automated Google review requests
- AI-assisted review responses
- No-show protection
- Payment/deposit links

Estimated monthly infrastructure cost: €60–90

### FULL ECOSYSTEM — €499/month, €1,290 setup

Everything in Growth, plus:

- Customer retention automation
- Customer win-back campaigns
- Lightweight CRM
- Customer history and lead management
- Invoicing and payment integrations
- Quarterly business optimisation
- One small custom automation per quarter
- Priority support

Estimated monthly infrastructure cost: €90–130

### ADD-ON: CONTENT ENGINE (any tier)

AI-produced social content for Instagram and YouTube, always approved by
the owner in WhatsApp before publishing.

**Lite — €99/month, €190 setup**
- 12 Instagram posts/month: AI captions + hashtags + visuals from the
  owner's photos, branded templates or AI brand artwork
- Up to 4 YouTube uploads/month of owner-supplied clips (title,
  description, tags, thumbnail, scheduling)
- Auto-generated monthly content calendar; performance in the owner report
- Estimated hard cost: ~€4/month; ~90% gross margin

**Pro — €229/month, €190 setup**
- Everything in Lite, plus 12 fully AI-generated visuals and 4 AI-generated
  15-20s video Reels/Shorts per month, and one themed monthly campaign
- Estimated hard cost: ~€15-25/month; ~85% gross margin

Exclusions printed on every order: no filming/video editing, no DM/comment
management, no paid ads, no follower guarantees, nothing published without
owner approval.

Content guardrails: real products use real photos (AI visuals are
illustrative/brand-style only); platform AI-disclosure flags are set
automatically.

Production stack: gemini-2.5-flash-image for stills (~$0.04/image);
Veo 3.1 Fast via the Gemini API (~$0.10/s) animating our own stills, full
Veo (~$0.40/s) for hero pieces; FFmpeg assembly (only 8-12s generated per
Reel, ~€2-4 per finished Reel); provider-agnostic n8n adapter with fal.ai
(Kling/Seedance/MiniMax) as the swap layer. Higgsfield excluded from the
pipeline (reseller markup, ~$700 prepaid API floor, creator-tool strengths
irrelevant to unattended production); a cheap creator subscription remains
optional for hand-crafted hero content.

Revenue note: Content Engine is the designated upsell once the daily
report has earned trust. Three Pro clients add €687 MRR (~25% on top of
the €2,790 base) with no new fixed costs.

---

## 2. Infrastructure & technology stack

| Component | Technology |
|---|---|
| Automation engine | Self-hosted n8n |
| WhatsApp integration | Meta Cloud API |
| AI language models | OpenAI / Claude |
| AI voice receptionist | Retell / Vapi |
| Telephony | Twilio / Telnyx |
| Appointment booking | Cal.com |
| Database & CRM | PostgreSQL |
| Backend services | Node.js / Python |
| Hosting | VPS / Cloud infrastructure |
| Reporting | Custom automated reports |
| Monitoring | Logging, backups and alerts |

Infrastructure strategy:

- Shared infrastructure wherever practical
- Isolated customer data
- Reusable automation templates
- Usage-based AI API billing
- Automated deployments
- Minimal per-client software licensing
- Transparent usage allowances and overage billing

Provider licensing, telephony availability, and data-protection requirements
must be validated before launch.

---

## 3. First 10 clients — sales target

| Package | Clients | Monthly price | Monthly revenue |
|---|---|---|---|
| Starter | 4 | €149 | €596 |
| Growth | 4 | €299 | €1,196 |
| Full Ecosystem | 2 | €499 | €998 |
| **TOTAL** | **10** | | **€2,790** |

- Monthly recurring revenue (MRR): **€2,790**
- Annual recurring revenue (ARR): **€33,480**

ARR assumes all 10 clients remain subscribed for 12 months and excludes
setup fees.

---

## 4. One-time setup revenue

| Package | Clients | Setup fee | Total |
|---|---|---|---|
| Starter | 4 | €490 | €1,960 |
| Growth | 4 | €790 | €3,160 |
| Full Ecosystem | 2 | €1,290 | €2,580 |
| **TOTAL** | **10** | | **€7,700** |

### Estimated onboarding labour

| Package | Total hours |
|---|---|
| Starter | 48 |
| Growth | 88 |
| Full Ecosystem | 76 |
| **Total** | **212 hours** |

Founder hourly compensation assumption: €25

- Onboarding labour cost: 212 × €25 = **€5,300**
- Remaining setup revenue: €7,700 − €5,300 = **€2,400**

This €2,400 is before additional onboarding expenses, such as telephone
provisioning, external integrations, verification, and other
implementation costs.

---

## 5. Monthly infrastructure costs

| Package | Clients | Average cost/client | Total |
|---|---|---|---|
| Starter | 4 | €30 | €120 |
| Growth | 4 | €75 | €300 |
| Full Ecosystem | 2 | €115 | €230 |
| **TOTAL** | **10** | | **€650** |

These are planning estimates, not fixed supplier quotations.

---

## 6. Founder salary calculation

Founder hourly compensation: €25/hour

### Estimated monthly workload

| Responsibility | Hours/month |
|---|---|
| Starter client maintenance | 8 |
| Growth client maintenance | 16 |
| Full Ecosystem maintenance | 12 |
| Shared administration, sales and infrastructure maintenance | 15 |
| **TOTAL** | **51 hours** |

- Monthly founder compensation: 51 × €25 = **€1,275**
- Annual founder compensation: **€15,300**

This compensates 51 hours per month. Additional development, onboarding,
or sales hours must be accounted for separately.

---

## 7. Monthly operating expenses

| Expense | Monthly amount |
|---|---|
| Infrastructure | €650 |
| Founder compensation | €1,275 |
| Business overhead and sales | €300 |
| Contingency allocation | €120 |
| **TOTAL** | **€2,345** |

---

## 8. Company profit calculation

- Monthly revenue: €2,790
- Budgeted operating expenses and contingency: €2,345
- Remaining operating surplus: €2,790 − €2,345 = **€445/month**

### Financial summary

| Metric | Monthly | Annual |
|---|---|---|
| Revenue | €2,790 | €33,480 |
| Infrastructure | €650 | €7,800 |
| Founder compensation | €1,275 | €15,300 |
| Overhead and sales | €300 | €3,600 |
| Contingency allocation | €120 | €1,440 |
| **Company operating surplus** | **€445** | **€5,340** |

Profit margin: €445 ÷ €2,790 × 100 = **15.95%**

Accounting clarification: these figures treat the €120 contingency
allocation as a budgeted cost. If it is simply retained as a cash reserve,
rather than spent or accrued as an expense, operating profit before tax
would be €565/month, or approximately 20.3%.

---

## 9. Personal income vs company profit

**Founder**

- Monthly compensation: €1,275
- Annual compensation: €15,300

**Azolute AI Technologies**

- Monthly retained operating surplus: €445
- Annual retained operating surplus: €5,340

**Combined economic benefit**

- €1,275 + €445 = **€1,720/month** (annual equivalent €20,640)

This is not entirely personal take-home income. Company profit remains in
the business unless lawfully distributed, and applicable taxes have not
been deducted.

---

## 10. Pricing strategy after 10 clients

The first 10 customers receive founding-client pricing. Once actual
operating costs and customer demand have been validated, consider
increasing prices for new customers.

| Package | First 10 clients | Future new clients |
|---|---|---|
| Starter | €149 | €169 |
| Growth | €299 | €339 |
| Full Ecosystem | €499 | €569 |

Pricing policy:

- Existing customers retain agreed subscription terms
- New customers receive updated pricing
- Complex integrations are quoted separately
- Additional locations incur additional fees
- AI and telephony usage beyond included allowances is billed transparently
- Pricing is reviewed against actual infrastructure and support costs

---

## 11. First 10 clients — execution strategy

### Phase 1: Clients 1–3 — validate infrastructure

- Build reusable n8n workflows
- Deploy WhatsApp AI agents
- Integrate Cal.com
- Establish customer-specific data isolation
- Configure monitoring and backups
- Validate actual AI conversation costs
- Validate voice AI operating costs

### Phase 2: Clients 4–6 — standardise delivery

- Reduce onboarding time
- Reuse customer deployment templates
- Automate daily reporting
- Build reusable integrations
- Establish support procedures
- Track actual maintenance hours

### Phase 3: Clients 7–10 — validate profitability

- Reach €2,790 MRR
- Maintain operating costs within budget
- Compensate the founder at the planned hourly rate
- Target 15–20% operating profitability
- Gather testimonials and customer feedback
- Identify profitable upselling opportunities

### Phase 4: After 10 clients — controlled expansion

- Introduce revised pricing for new customers
- Improve infrastructure efficiency
- Reduce manual maintenance
- Standardise onboarding
- Consider additional engineering/support capacity when financially justified
- Expand into additional European and GCC markets

---

## 12. Financial goals

| Metric | Initial target |
|---|---|
| Paying clients | 10 |
| Monthly recurring revenue | €2,790 |
| Annual recurring revenue | €33,480 |
| One-time setup revenue | €7,700 |
| Monthly infrastructure budget | €650 |
| Founder monthly compensation | €1,275 |
| Monthly contingency allocation | €120 |
| Monthly retained operating surplus | €445 |
| Retained surplus margin | 15.95% |
| Long-term operating margin target | 15–20% |

Important: these figures assume a 4/4/2 customer mix, estimated operating
costs, and 51 monthly founder work hours after onboarding. They exclude
business income tax, unexpected major expenses, and any unbudgeted
engineering work.

---

## 13. Core business principles

1. Sell managed AI automation services, not software licences alone
2. Prioritise reliable delivery over acquiring customers at unsustainable prices
3. Keep the initial subscription pricing accessible without excessive discounting
4. Compensate founder engineering time as a real business expense
5. Maintain a target operating profit margin of approximately 15–20%
6. Reuse infrastructure and automation templates wherever possible
7. Keep customer data isolated and provide transparent data-export procedures
8. Define usage limits, support obligations, and customisation boundaries
9. Reinvest retained profits into reliability, automation, and growth
10. Increase pricing for future customers after validating delivery costs and market demand

---

## Final financial snapshot

| | |
|---|---|
| Monthly recurring revenue | €2,790 |
| One-time setup revenue | €7,700 |
| Monthly infrastructure | €650 |
| Founder monthly compensation | €1,275 |
| Monthly overhead | €300 |
| Monthly contingency allocation | €120 |
| Company monthly operating surplus | €445 |
| Company annual operating surplus | €5,340 |
| Budgeted operating surplus margin | 15.95% |

**Business objective:** establish 10 recurring customers, build reliable
reusable infrastructure, pay the founder for actual engineering work, and
retain sufficient operating profit to support sustainable expansion.
