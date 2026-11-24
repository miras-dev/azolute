# What changed: 24 November 2026 (website prices)

The public plans page now shows the new Germany price card from
`docs/changes/2026-11-24-strategy-and-pricing.md`. It went live with the
push to `main`.

## `ecosystem.html`, pricing section and FAQ

| Before | Now |
|---|---|
| "Three plans", "Month to month, cancel anytime", "founding-client prices for our first ten clients" | "Fixed plans", "The same price for every client. Three months to start, then month to month." |
| Starter €149 + €490 setup, 1,000 AI conversations then €15 per extra 500 | **Booking Desk €199 + €990 setup** (featured): WhatsApp agent, one-tap booking approval, guests told, inbox, missed-call text-back and daily report marked "from March 2027", AVV and AI disclosure. "You pay Meta's WhatsApp message fees directly, with nothing added by us." |
| Growth €299 + €790 setup, 300 voice minutes | **Booking Desk + Phone €349 + €1,490 setup**, marked "Planned for the second half of 2027": phone receptionist, review requests to every guest, deposit links. Fair use of 1,000 minutes. Button: "Register interest". |
| Full Ecosystem €499 + €1,290 setup | Removed (not on sale). Replaced by the **Content add-on €290/month, or €390 with 2 AI reels, no setup fee**, for Booking Desk clients. |
| Note: prices in EUR; "AI phone reception is available in Europe today" | Prices in EUR net of VAT (19% added where it applies); 3-month minimum then monthly; 15% off a year paid ahead; setup scope; separate local-currency price list for India and the Gulf (WhatsApp-first there); +50% per extra location. |
| FAQ "What does it cost?": €149, €299 or €499 | €199 + €990 setup net of VAT; phone and content on top; Meta's fees paid directly. |
| FAQ "What if I want to stop?": month to month, cancel anytime | After the first three months, stop at the end of any month. |

Deliberately left out of the page:

- **"EU hosting"**: the offer sheet lists it, but n8n still runs on the
  Hostinger VPS and the move to an EU server is a December task. Add it to
  the Booking Desk card once the move is done.
- **The founding-client rate** (€149 for 12 months): for the founding client
  only, not public.
- **India and Qatar prices**: the page only says a separate price list
  exists.

No CSS change; the cards reuse the existing plan styles. Checked at desktop
and phone widths (no sideways scroll).

## Still showing old prices or old promises

- ~~The website chat assistant~~: updated the same day (see below).
- **Elsewhere on `ecosystem.html`**: the "What's inside" cards and the
  before/after scenes still present the AI phone receptionist and the
  retention engine as current modules, and the meta description says
  "answers your calls". These are not prices, so they were not changed.

## Website chat assistant (n8n "Azolute Site Chat", `BNbSX6whgbJNrmA7`)

MCP access was switched on for this workflow, so it could be checked and
edited from Claude. Published at 15:13 UTC on 24 Nov 2026.

- **Before:** "subscriptions start from EUR 149 per month … Month to month,
  cancel anytime", and the phone receptionist and retention engine described
  as current modules.
- **Now:** the same card as `ecosystem.html`: Booking Desk EUR 199 + 990
  (missed-call text-back and daily report from March 2027), Booking Desk +
  Phone EUR 349 + 1,490 planned for the second half of 2027, Content add-on
  EUR 290 / 390, net of VAT, 3-month minimum, Meta fees paid directly, +50%
  per extra location, India/Gulf prices via the contact page. The retention
  engine is "planned, not on sale". Two new rules: never describe a planned
  feature as available, never offer discounts or negotiate prices.
- **Tested** before publishing: asked about price, cancelling and the phone
  (correct prices, 3-month minimum, phone marked as planned), and asked for
  the Booking Desk at EUR 149 (refused politely, retention engine marked as
  not on sale).
- **Repo copy** `docs/n8n/azolute-site-chat.json` now matches the live
  workflow. The old copy was also behind on two other points the live
  workflow already had: requests accepted only from azolute.one (the copy
  allowed any site) and the Claude Haiku 5.5 model (the copy said 4.5).
