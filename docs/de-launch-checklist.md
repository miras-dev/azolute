# Launching the German Booking Desk page

The page (`de/index.html`), the draft Impressum and privacy pages, the form
and its n8n workflow are built (24 Nov 2026) but kept off the live site. Launch
them in late January 2027, once the Gewerbe is registered and before the
February letters go out. Design: `docs/superpowers/specs/2026-11-24-german-booking-desk-page-design.md`.

Do the steps in order. Each has a check.

## Launch gates: what the page says must be true

1. **The one-tap flow runs at the café.** The page says the desk "läuft bereits
   in einem Berliner Café" and describes Confirm / Decline by tap, the guest
   message and the introduction for new guests.
   Check: the WhatsApp cutover is done (`docs/whatsapp-cutover-runbook.md`),
   the café script runs with `OWNER_APPROVAL=true`, and a real booking went
   Waiting → Confirmed by tap.
2. **The German introduction with the AI notice is approved by Meta**
   (December list, item 10). Check: the template shows "Approved" in
   WhatsApp Manager.
3. **Who owns the WhatsApp number is decided** (December list, item 3). The
   page says each venue has its own WhatsApp Business account and pays Meta
   directly. If that's not the decision, change the FAQ "Was kostet WhatsApp
   selbst?" and the price card line before launch.
4. **Servers in the EU, and every outside service named.** The page says "unsere
   Server stehen in der EU" and that the AVV lists every service and every
   place data leaves the EU.
   Check: n8n runs on an EU server (December list, item 7; Hostinger hPanel
   shows the location); the AVV's sub-processor list exists (item 9) and
   covers Meta, AWS, Hostinger, the mail provider, Anthropic and any access
   from India; the privacy page's section 5 ("Übermittlung in Drittländer")
   says the same.
5. **Guest replies really reach the venue.** The page says replies "gehen nicht
   verloren: Wir sehen sie und leiten sie an Sie weiter". Check: you know how
   you forward them (today: the Hub logs every reply and the laptop inbox
   shows it).

## Before launch

6. **Fill every placeholder** in `de/impressum.html` and `de/datenschutz.html`
   (name, address, phone, VAT status, AWS region, whether CloudFront logs are
   on and for how long, n8n server location, third-country transfers, mail
   provider, the data-protection authority for your state, date). Then delete
   the yellow `draft-note` paragraph and the `<!-- DRAFT … -->` comment on both
   pages.
   Check: `grep -rn '\[\[' de/` prints nothing.
7. **VAT line.** Once the Steuerberater has settled it, replace "zzgl. 19 % USt.,
   sofern nicht die Kleinunternehmerregelung gilt" in `de/index.html` with
   either "zzgl. 19 % USt." or "Gemäß § 19 UStG wird keine Umsatzsteuer
   berechnet." Check: the price card shows one of the two.
8. **Lawyer check** of the Impressum, the privacy page, the consent wording
   under the form (`#cbConsentText` in `de/index.html`) and the page's claims
   (EU servers, AI notice "seit August 2026"). Change the consent wording only
   together with this check: every stored request keeps the wording it was
   given under. Open points from the review for the lawyer: a highlighted
   right-to-object note (Art. 21(4) GDPR); whether giving the data is required
   (Art. 13(2)(e)); one legal basis per purpose; a Wirtschafts-ID line; "Angebot
   nur für Unternehmer".
   Check: the lawyer's written OK.
9. **Webhook address.** If n8n moved to a new address, update
   `callbackForm.webhookUrl` in `js/site-config.js` and change `?v=20261124-de`
   to a new value on the two script tags in `de/index.html`.
   Check: the form's request goes to the new address (browser network tab).
10. **Workflow.** In n8n, open **Azolute · Rückruf (DE)**: remove
    `http://localhost:8000` from the webhook's allowed origins, delete the test
    row "TEST Claude (bitte löschen)" from the `callback_requests` table, and
    publish the workflow.
    Check: the workflow shows as published; the table is empty.
11. **Short address (optional, recommended for the letters).** The site's
    CloudFront serves S3 directly, so `azolute.one/de/` returns an error; only
    `azolute.one/de/index.html` works. For the short address, add a CloudFront
    Function (viewer request) on the site's distribution:

    ```js
    function handler(event) {
        var req = event.request;
        if (req.uri.endsWith('/')) req.uri += 'index.html';
        else if (req.uri === '/de') req.uri = '/de/index.html';
        return req;
    }
    ```

    Check: `curl -sI https://azolute.one/de/ | head -1` shows `200`. Until
    then, print `azolute.one/de/index.html` everywhere.

## Launch

12. **Let search engines in:** in all three `de/` pages change
    `<meta name="robots" content="noindex, nofollow">` to
    `content="index, follow"`, and remove the "until launch" comment above it.
    In the same commit, change the test "is German, noindex and names no café"
    in `tests/de-pages.test.mjs` to expect `index, follow`.
13. **Deploy the pages:** remove the line `--exclude "de/*" \` and the comment
    above the HTML step in `.github/workflows/deploy.yml`.
14. **Sitemap and link:** add the German page's address to `sitemap.xml`; add a
    "Deutsch" link to `de/index.html` in `components/footer.html`.
15. **Merge to `main`** and let the deploy run.
    Check: the German page loads at the address from step 11; the tests pass
    (`node --test tests/*.test.mjs`).
16. **One real request:** send the form yourself.
    Check: a row in `callback_requests` with the consent text and time, and the
    email to miras@azolute.one. (No email goes to the sender: an automatic
    reply would let anyone send mail from your address.)

## After launch

17. Use the page's address on the Google Business Profile, in the February
    letters and in LinkedIn posts.
18. Handling requests: call as asked. When someone withdraws consent, or 12
    months after the last contact if no contract followed, delete their row in
    `callback_requests` **and** the "Rückruf-Anfrage" email in your mailbox,
    as the privacy page promises. (n8n doesn't keep successful runs of this
    workflow, so nothing else holds a copy.) Keep a short note that consent was
    withdrawn.

## Undo

`aws s3 sync --delete` never deletes files that an exclude filter skips, so
putting the exclude back is not enough. To take the pages down:

```bash
aws s3 rm s3://$S3_BUCKET/de/ --recursive
```

```bash
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/de/*"
```

Then put the `--exclude "de/*" \` line back in `deploy.yml` so the next deploy
doesn't upload them again, and unpublish the workflow. The English site is
untouched either way.
