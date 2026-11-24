# December 2026: the working list

Started 2026-11-24. The plan behind it: `docs/changes/2026-11-24-strategy-and-pricing.md`
(build only what earns money next; app.azolute.one is paused until about ten
clients). Tick items here as they're done. Anything new that isn't on this list
is checked against the strategy first.

Owner: **M** = Miras (needs your accounts, a signature or a live call),
**C** = Claude (can be done from a chat), **M+C** = Claude prepares, Miras acts.

## Hard deadlines

| # | Item | Owner | By | Status |
|---|---|---|---|---|
| 1 | Check the billing currency of the Meta account behind the Azolute number (+91). Meta stops delivering messages from Indian accounts not billed in INR from 1 Jan 2027. If it isn't INR, switch it. | M | 31 Dec | to do |
| 2 | Founding-client agreement (€149/month for 12 months, no setup fee, for a case study, a Google review and three introductions), so the first euro invoice goes out on 1 Feb | M+C | 29 Jan | to do |
| 3 | Decide who owns the café's WhatsApp sending: the café's own number and Meta account (the research's advice) or the Azolute number (today) | M | before the café's paid plan | to do |

## Product

| # | Item | Owner | Status |
|---|---|---|---|
| 4 | WhatsApp cutover off Twilio (`docs/whatsapp-cutover-runbook.md`, Parts A and B) | M (C helps on the n8n steps) | to do |
| 5 | Gemini check: the only Gemini call is the Content Engine's image step; text is Claude everywhere, so Google's price rises don't apply. Image model switched from `gemini-2.5-flash-image` (shuts down 15 Mar 2027) to `gemini-3.1-flash-lite-image` in n8n and the docs. | C | **done 24 Nov** (test with the first real picture once the Gemini credential is set) |
| 6 | Reel automation in the Content Engine (Veo Fast or Lite, 8–12 s generated, the rest assembled) | C (design first) | to do |
| 7 | Move n8n and its data to an EU server (Hostinger VPS in an EU location), before more German clients join | M+C | to do |

## German sales kit

| # | Item | Owner | Status |
|---|---|---|---|
| 8 | One-page Booking Desk site in German on azolute.one | C, then M to launch | **built 24 Nov**, off the live site until the Impressum is complete (late Jan): `docs/de-launch-checklist.md` |
| 9 | Data processing agreement (AVV) with technical measures and a sub-processor list; a German lawyer checks it | M+C | to do |
| 10 | AI disclosure text for the guest messages and the site | C | to do |
| 11 | German price card (from the market research) as a one-page PDF | C | to do |

## Business setup

| # | Item | Owner | Status |
|---|---|---|---|
| 12 | Shortlist three Steuerberater; get IT liability quotes (at least €500,000, covering pure financial loss) | M | to do |
| 13 | Register on Udyam before the next Indian invoice | M | to do |
| 14 | Adopt the three price cards; update the older docs that still show the old offer (ecosystem offer, business plan, sales playbook) | C | to do |
