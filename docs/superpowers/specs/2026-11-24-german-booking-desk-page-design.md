# German Booking Desk page: short design

Date: 2026-11-24. Status: **approved by Miras, 2026-11-24.**
Plan behind it: `docs/changes/2026-11-24-strategy-and-pricing.md`, December
list item 8 in `docs/december-2026.md`.

## Why

In 2027 Azolute sells the WhatsApp Booking Desk to independent cafés,
restaurants and bars in Berlin. German law bars cold email, WhatsApp and
LinkedIn messages and most cold calls (UWG § 7), so leads come from referrals,
BNI, a Google Business Profile, letters and LinkedIn posts, and all of them
need one German page to point to. That page also has to collect the consent
that makes a follow-up call lawful.

## Goals, non-goals, anti-goals

- Goals: one German page that sells the Booking Desk to a Berlin venue owner;
  a call-back form whose consent tick box records permission to call; German
  Impressum and privacy pages, drafted for a lawyer to check.
- Non-goals: translating the rest of the site; the Content add-on or the phone
  module as products of their own (mentioned only as "later, if you want");
  online sign-up or payment.
- Anti-goals: the page going live without a complete Impressum (warning-letter
  risk); naming the café before the founding agreement allows the case study;
  promising results ("fewer no-shows guaranteed"), or invented numbers,
  reviews or clients; claiming features that aren't built without saying when
  they come.

## Constraints

- Static HTML on S3 and CloudFront, deployed from `main` by GitHub Actions;
  shared header and footer in `components/`; the contact form posts JSON to an
  n8n webhook (`js/contact-form.js`).
- The Impressum needs Miras's name and a postal address where Miras can be
  served. Those come with the Gewerbe registration (18–29 Jan 2027).
- Prices from the German card: Booking Desk €199/month + €990 setup, net, plus
  VAT unless the Kleinunternehmer rule applies; 3-month minimum, then monthly.
- Missed-call text-back and the daily owner report are in the price but built
  February to mid-March 2027.

## Approaches

1. **Chosen: one German page at `/de/` in the current site's look**, plus German
   Impressum and privacy pages. Cheapest; reuses the site, its form and its
   deploy.
2. A separate German micro-site on its own domain: more to run and to keep
   legally complete, for no gain at this stage.
3. A German version of the whole site: weeks of work on pages that don't sell
   the one product we sell in Germany.

## Design

- **`/de/index.html`**, German throughout (AI-drafted copy, as decided on
  24 Nov), `lang="de"`, in the site's current look:
  - the positioning line: "Your bookings and guest messages on WhatsApp,
    answered at once, approved by you with one tap, with EU hosting, a data
    processing agreement and AI disclosure included";
  - how it works, in steps: a guest books, the owner taps Confirm or Decline,
    the guest is told;
  - what's included, with missed-call text-back and the daily report marked
    "from March 2027";
  - "already running in a Berlin café", unnamed for now;
  - the price, €199/month + €990 setup, and the terms;
  - questions and answers (works with your reservation tool, data protection,
    AI disclosure, cancelling);
  - the call-back form.
- **Call-back form:** name, venue, phone, email, best time to call, and a
  consent tick box, not pre-ticked, with the exact consent wording stored with
  the enquiry and a timestamp. It posts to the existing contact webhook with a
  `source` field so the enquiry is recognisable.
- **`/de/impressum.html` and `/de/datenschutz.html`:** drafts with clearly
  marked placeholders for name, address and tax details; a German lawyer
  checks them before launch.
- **Going live:** built in December, kept out of the live site until the
  Impressum is complete (late January), before the February letters. Until
  then `noindex` and no links from the English site.

## Left to the builder

The page layout and sections in detail, the German copy, how the page is kept
off the live site until launch, and the form's field names.
