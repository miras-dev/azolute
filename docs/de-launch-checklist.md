# Launching the German Booking Desk page

The page (`de/index.html`), the draft Impressum and privacy pages, the form
and its n8n workflow are built (24 Nov 2026) but kept off the live site. Launch
them in late January 2027, once the Gewerbe is registered and before the
February letters go out. Design: `docs/superpowers/specs/2026-11-24-german-booking-desk-page-design.md`.

Do the steps in order. Each has a check.

## Before launch

1. **Fill every placeholder** in `de/impressum.html` and `de/datenschutz.html`
   (name, address, phone, VAT status, AWS region, whether CloudFront logs are
   on and for how long, n8n server location, mail provider, the
   data-protection authority for your state, date).
   Check: `grep -rn '\[\[' de/` prints nothing.
2. **Lawyer check** of the Impressum, the privacy page and the consent wording
   under the form (`#cbConsentText` in `de/index.html`). Change the consent
   wording only together with this check: every stored request keeps the
   wording it was given under.
   Check: the lawyer's written OK.
3. **EU hosting is true.** The page says the data is processed in the EU. n8n
   must be on an EU server (December list, item 7) before launch.
   Check: the Hostinger VPS location in hPanel is in the EU.
4. **Webhook address.** If n8n moved to a new address, update
   `callbackForm.webhookUrl` in `js/site-config.js` and change `?v=20261124-de`
   to a new value on the two script tags in `de/index.html`.
   Check: the form's request goes to the new address (browser network tab).
5. **Workflow.** In n8n, open **Azolute · Rückruf (DE)**: remove
   `http://localhost:8000` from the webhook's allowed origins, delete the test
   row "TEST Claude (bitte löschen)" from the `callback_requests` table, and
   publish the workflow.
   Check: the workflow shows as published; the table is empty.

## Launch

6. **Let search engines in:** in all three `de/` pages change
   `<meta name="robots" content="noindex, nofollow">` to
   `content="index, follow"`, and remove the "until launch" comment above it.
7. **Deploy the pages:** remove the line `--exclude "de/*" \` and the comment
   above the HTML step in `.github/workflows/deploy.yml`.
8. **Sitemap and link:** add `https://azolute.one/de/` to `sitemap.xml`; add a
   "Deutsch" link to `de/` in `components/footer.html`.
9. **Merge to `main`** and let the deploy run.
   Check: `https://azolute.one/de/` loads; the tests still pass
   (`node --test tests/*.test.mjs`; the noindex test will now fail by design,
   so update it to expect `index, follow` in the same commit as step 6).
10. **One real request:** send the form yourself.
    Check: a row in `callback_requests` with the consent text and time; the
    email to miras@azolute.one; the German acknowledgement in your inbox.

## After launch

11. Use `https://azolute.one/de/` on the Google Business Profile, in the
    February letters and in LinkedIn posts.
12. Handling requests: call as asked. Delete a row when someone withdraws
    consent (keep a note of the withdrawal) or 12 months after the last contact
    if no contract followed, as the privacy page promises.

## Undo

Put the `--exclude "de/*" \` line back in `deploy.yml` and run the deploy;
unpublish the workflow. The English site is untouched either way.
