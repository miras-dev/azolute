# German Booking Desk Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A German page at `azolute.one/de/` that sells the Booking Desk to Berlin venues and records consent for a call-back, with draft Impressum and privacy pages, built now and kept off the live site until the Impressum is complete.

**Architecture:** Three self-contained static pages under `de/` (no shared English header/footer: `js/components.js` loads `components/*.html` by relative path, which breaks one folder down, and the English nav doesn't fit). One small form script with pure, unit-tested validation and payload functions. A new n8n workflow receives the call-back, stores it in a data table (the consent record), emails Miras and acknowledges in German. The deploy skips `de/` until launch.

**Tech Stack:** static HTML/CSS, plain JS (no build), `node:test` (Node 22, no dependencies), Playwright (pre-installed) for page checks, n8n Workflow SDK via MCP.

**Spec:** `docs/superpowers/specs/2026-11-24-german-booking-desk-page-design.md`

## Global Constraints

- German throughout, formal "Sie". `<html lang="de">`.
- Prices exactly: **€199 pro Monat + €990 Einrichtung, netto**, "zzgl. 19 % USt., sofern nicht die Kleinunternehmerregelung gilt"; **3 Monate Mindestlaufzeit, danach monatlich kündbar**; "Meta-Gebühren zahlt der Betrieb direkt an Meta".
- Missed-call text-back (Rückruf-SMS/WhatsApp bei verpasstem Anruf) and the daily owner report (Tagesbericht) are labelled **"ab März 2027"**.
- The café is never named: "läuft bereits in einem Berliner Café". The strings `Toasty` and `Turtle` must not appear under `de/`.
- No promises of results and no invented numbers, reviews or clients.
- **No request to any third-party host** from `de/` pages: no Google Fonts, no Google Analytics, no Cal.com, no chat widget, no WhatsApp button. The only outside request is the form POST to the n8n webhook.
- `<meta name="robots" content="noindex, nofollow">` on all three pages until launch.
- Placeholders that must be filled before launch are written `[[LIKE_THIS]]`.
- Webhook URL: `https://n8n-jrkw.srv2144760.hstgr.cloud/webhook/azolute-rueckruf` (changes when n8n moves to the EU server; launch checklist).

## Review Focus

1. A page quietly loads Google Fonts or Analytics (copied head from an English page) → no third-party request at all; pinned in Task 3's network test.
2. Germans type phones as `030 1234567`, `+49 (0)30 123 45 67`, `0171/1234567` → all accepted; `12` and `abc` rejected; pinned in Task 1.
3. Consent box left unticked, or the form sent with Enter → nothing is sent, a German message says why; pinned in Tasks 1 and 3.
4. The webhook is down or times out → a German error with the email address, and the form stays filled in; pinned in Task 3.
5. A double tap on "Absenden" → exactly one request; pinned in Task 3.
6. A 360 px phone → no sideways scrolling on any of the three pages; pinned in Tasks 3 and 4.

---

### Task 1: Call-back form logic

**Files:**
- Create: `js/rueckruf-form.js`
- Create: `tests/rueckruf-form.test.mjs`
- Modify: `js/site-config.js` (add `callbackForm`)

**Interfaces:**
- Produces, on `window.AzoluteRueckruf` and as `module.exports`:
  - `validateCallback(values) -> { ok: boolean, errors: string[] }` where `values = { name, venue, phone, email, bestTime, message, consent }` (strings, `consent` boolean) and `errors` lists failing field names in that order.
  - `buildCallbackPayload(values, consentText, nowIso, pathname) -> object` with exactly the keys `name, venue, phone, email, best_time, message, consent, consent_text, consent_at, page, lang, source, submittedAt`, strings trimmed, `consent: true`, `lang: 'de'`, `source: 'de-booking-desk'`, `consent_at` and `submittedAt` both `nowIso`.
  - DOM wiring runs only when `document.getElementById('callbackForm')` exists. Element ids it uses: `callbackForm`, `cbName`, `cbVenue`, `cbPhone`, `cbEmail`, `cbTime`, `cbMessage`, `cbConsent`, `cbConsentText` (the label text sent as `consent_text`), honeypot `name="website"`, `callbackStatus`, `callbackSuccess`.
- Config: `window.AZOLUTE_CONFIG.callbackForm.webhookUrl`.

- [ ] **Step 1: Write the failing tests** (`node:test`, load the file with `createRequire`):
  - `accepts a complete request`: all fields valid, `consent: true` → `{ ok: true, errors: [] }`.
  - `requires name, venue, phone, email and consent`: all empty, `consent: false` → errors `['name','venue','phone','email','consent']`.
  - `accepts German phone formats`: `030 1234567`, `+49 (0)30 123 45 67`, `0171/1234567`, `+4930123456` each valid.
  - `rejects non-phones`: `12`, `abc`, `+49` → `errors` contains `'phone'`.
  - `rejects a bad email`: `max@cafe` → contains `'email'`.
  - `bestTime and message are optional`: both empty → ok.
  - `builds the payload`: trims `'  Max  '` to `'Max'`, has exactly the 13 keys above, `consent_text` equals the passed text, `consent_at === submittedAt === nowIso`, `lang 'de'`, `source 'de-booking-desk'`.
- [ ] **Step 2:** Run `node --test tests/` → FAIL (module missing).
- [ ] **Step 3: Implement** `js/rueckruf-form.js` (IIFE, `'use strict'`, same style as `js/contact-form.js`). Phone rule: strip spaces, `-`, `/`, `(`, `)`, and a `(0)`; what's left must match `^\+?\d{6,15}$`. Email rule as in `contact-form.js`. Wiring: on submit `preventDefault`; honeypot filled → show success, send nothing; invalid → set `aria-invalid` on each failing field and status text "Bitte füllen Sie die markierten Felder aus und bestätigen Sie die Einwilligung."; valid → disable the button (label "Wird gesendet…"), POST JSON with a 20 s `AbortController` timeout; `res.ok` → hide form, show `#callbackSuccess` and focus it; failure or no `webhookUrl` → status "Das hat leider nicht geklappt. Schreiben Sie uns an <a href=\"mailto:miras@azolute.one\">miras@azolute.one</a>." and re-enable the button, fields kept.
- [ ] **Step 4:** Add to `js/site-config.js`: `callbackForm: { webhookUrl: 'https://n8n-jrkw.srv2144760.hstgr.cloud/webhook/azolute-rueckruf' }` with a comment like its neighbours (English pages don't use it, so their `?v=` stays).
- [ ] **Step 5:** Run `node --test tests/` → all PASS.
- [ ] **Step 6:** Commit: `git add js/rueckruf-form.js js/site-config.js tests/rueckruf-form.test.mjs && git commit -m "Add the German call-back form logic with tests"`

### Task 2: Self-hosted fonts, German stylesheet, deploy guard

**Files:**
- Create: `fonts/` (Inter 400/500/600 and Space Grotesk 500/600/700, latin subset, `.woff2`, plus `fonts/OFL.txt`)
- Create: `css/de.css`
- Modify: `.github/workflows/deploy.yml`

**Interfaces:**
- Produces: `css/de.css`, loaded after `../css/azolute.css` and `../css/demo.css` by every `de/` page. It declares the `@font-face` rules (`font-display: swap`, URLs `../fonts/…`) under the same family names `Inter` and `Space Grotesk`, so `--font-display` / `--font-body` work unchanged. Classes it adds: `.de-header` (brand left, one button right, no nav), `.de-footer` (Impressum · Datenschutz · E-Mail), `.consent-row` (checkbox + label, label text wraps), `.legal` (readable long-form text, max-width 72ch).

- [ ] **Step 1:** Download the six `woff2` files: fetch the Google Fonts CSS for `Inter:wght@400;500;600` and `Space Grotesk:wght@500;600;700` with a desktop Chrome user agent, take the `/* latin */` URL of each weight, save as `fonts/inter-400.woff2` … `fonts/space-grotesk-700.woff2`; add the SIL OFL 1.1 text as `fonts/OFL.txt`. Check: `file fonts/*.woff2` reports Web Open Font Format 2.
- [ ] **Step 2:** Write `css/de.css` with the classes above.
- [ ] **Step 3:** In `deploy.yml`: add `--exclude "tests/*"` to the assets step; add `--exclude "de/*"` to the HTML step with the comment `# German pages stay off the live site until launch: docs/de-launch-checklist.md`.
- [ ] **Step 4:** Check: `grep -n 'de/\*\|tests/\*' .github/workflows/deploy.yml` shows both lines; `python3 -c "import yaml;yaml.safe_load(open('.github/workflows/deploy.yml'))"` passes.
- [ ] **Step 5:** Commit: `git add fonts css/de.css .github/workflows/deploy.yml && git commit -m "Self-host the fonts for the German pages and keep de/ off the live site"`

### Task 3: The German Booking Desk page

**Files:**
- Create: `de/index.html`
- Create: `tests/de-pages.test.mjs`

**Interfaces:**
- Consumes: Task 1 ids and script (`../js/site-config.js?v=20261124-de`, `../js/rueckruf-form.js?v=20261124-de`), Task 2 classes and fonts.
- Produces: footer links `impressum.html` and `datenschutz.html` (Task 4 creates them).

Sections, in order (copy written in German by the implementer within the Global Constraints):
1. `.de-header`: brand "Azolute." and button "Rückruf anfordern" → `#rueckruf`.
2. Hero: the positioning line ("Ihre Reservierungen und Gästenachrichten auf WhatsApp: sofort beantwortet, mit einem Tipp von Ihnen bestätigt. EU-Hosting, Auftragsverarbeitungsvertrag und KI-Hinweis inklusive."), one sub-line for Berlin cafés, restaurants and bars, buttons to `#rueckruf` and `#preis`.
3. So funktioniert's: three steps (Gast reserviert über Ihre Website → Sie tippen Bestätigen oder Ablehnen in WhatsApp → der Gast bekommt sofort Bescheid, neue Gäste mit kurzer Vorstellung und KI-Hinweis).
4. Inklusive: check list (WhatsApp-Buchung mit Bestätigung per Tipp, Gästenachrichten, Posteingang und Warnungen bei Fehlern, AVV, KI-Hinweis, Einrichtung durch uns, funktioniert mit Ihrem Reservierungssystem; Rückruf bei verpassten Anrufen *ab März 2027*; Tagesbericht *ab März 2027*).
5. Proof line: "Läuft bereits in einem Berliner Café." (no name, no numbers).
6. `#preis`: one `.plan` card with the exact price and terms.
7. FAQ (`.accordion` or `<details>`): Reservierungssystem, Datenschutz/EU-Hosting/AVV, KI-Hinweis, Kündigung, Meta-Kosten.
8. `#rueckruf`: the form (Task 1 ids; labels Name, Betrieb, Telefon, E-Mail, Wann passt es Ihnen? (optional), Nachricht (optional)); consent checkbox `#cbConsent` unticked, label `#cbConsentText`: "Ich bin einverstanden, dass Azolute mich zu meiner Anfrage telefonisch oder per E-Mail kontaktiert. Meine Angaben werden nur dafür gespeichert. Ich kann die Einwilligung jederzeit per E-Mail an miras@azolute.one widerrufen. Mehr in der Datenschutzerklärung." (with a link to `datenschutz.html`); success block "Danke, Ihre Anfrage ist da. Miras ruft Sie an, wie gewünscht."
9. `.de-footer`.

- [ ] **Step 1: Write the failing tests** in `tests/de-pages.test.mjs` (`node:test` + Playwright; start `python3 -m http.server` on a free port in `before`, stop in `after`; route the webhook URL with `page.route`):
  - `loads nothing from other hosts`: for each of `de/index.html`, `de/impressum.html`, `de/datenschutz.html`, every request's host is the local server (record `page.on('request')`).
  - `is German, noindex and names no café`: `lang` is `de`; robots meta is `noindex, nofollow`; body text contains `199`, `990`, `ab März 2027`; contains neither `Toasty` nor `Turtle`.
  - `no sideways scroll on a phone`: viewport 360×800, `scrollWidth <= clientWidth` for all three pages.
  - `sends one complete request`: fill all fields, tick consent, double-click submit → exactly one POST; its JSON has `consent: true`, `consent_text` equal to `#cbConsentText` text, `source 'de-booking-desk'`; `#callbackSuccess` visible.
  - `blocks without consent`: fill all, leave consent unticked, press Enter in `#cbEmail` → zero POSTs; `#callbackStatus` non-empty; `#cbConsent` has `aria-invalid="true"`.
  - `keeps the form when the webhook fails`: route aborts → `#callbackStatus` contains `miras@azolute.one`; `#cbName` still holds the typed name; button enabled.
- [ ] **Step 2:** Run `node --test tests/` → the new tests FAIL (pages missing).
- [ ] **Step 3:** Write `de/index.html` (head: charset, viewport, robots noindex, title "WhatsApp-Buchungsdesk für Berliner Gastronomie | Azolute", description, `../favicon.ico`, the three stylesheets; no analytics).
- [ ] **Step 4:** Run `node --test tests/` → all `de/index.html` tests PASS (the two other pages still fail until Task 4).
- [ ] **Step 5:** Screenshot `de/index.html` at 390×844 and 1280×800 and look at both: readable, the price card and form usable, nothing overlapping.
- [ ] **Step 6:** Commit: `git add de/index.html tests/de-pages.test.mjs && git commit -m "Add the German Booking Desk page"`

### Task 4: Impressum and privacy drafts

**Files:**
- Create: `de/impressum.html`, `de/datenschutz.html`

**Interfaces:**
- Consumes: Task 2 classes (`.de-header`, `.de-footer`, `.legal`), Task 3's tests (they already cover both pages).

- [ ] **Step 1: Impressum** (§ 5 DDG), clearly marked "Entwurf, vor Veröffentlichung prüfen lassen": `[[VOLLER_NAME]]`, `[[STRASSE_HAUSNUMMER]]`, `[[PLZ_ORT]]`, E-Mail miras@azolute.one, Telefon `[[TELEFON]]`, USt-IdNr. or Kleinunternehmer note `[[UST_ODER_KLEINUNTERNEHMER]]`, Verantwortlich nach § 18 Abs. 2 MStV `[[VOLLER_NAME]]`, EU dispute-resolution note.
- [ ] **Step 2: Datenschutzerklärung**, same draft marking: controller (`[[…]]` placeholders as above); hosting (AWS CloudFront/S3, `[[REGION]]`); the call-back form: data fields, purpose (answering the request, the call), legal basis Art. 6(1)(a) GDPR consent and (b) pre-contract, storage in n8n on `[[N8N_SERVER_STANDORT]]` (Hostinger), e-mail via `[[SMTP_ANBIETER]]`, deletion after 12 months without a contract or on withdrawal; no cookies, no analytics, no third-party fonts on these pages; rights (Art. 15–21, 77) and withdrawal of consent.
- [ ] **Step 3:** Run `node --test tests/` → all PASS.
- [ ] **Step 4:** Screenshot both at 390 px and look: long text readable.
- [ ] **Step 5:** Commit: `git add de/impressum.html de/datenschutz.html && git commit -m "Add draft German Impressum and privacy pages"`

### Task 5: The call-back workflow on n8n

**Files:**
- Create (n8n): data table `callback_requests`; workflow "Azolute · Rückruf (DE)" (unpublished)
- Create: `docs/n8n/azolute-rueckruf-de.json` (export)

**Interfaces:**
- Consumes: Task 1's payload keys.
- Produces: `POST /webhook/azolute-rueckruf` → `200 {"ok":true}` when stored (and for a filled honeypot, silently, storing nothing); `400 {"ok":false}` when `consent !== true`, email lacks `@`, or phone is empty.

- [ ] **Step 1:** Call `get_user_preferences`, then create the data table `callback_requests` in project `twW8D7PZC2a8nqGu`: `name, venue, phone, email, best_time, message, consent_text, consent_at, page, submitted_at, status` (all string; `status` starts `new`).
- [ ] **Step 2:** Read `get_workflow_sdk_reference`; write the workflow: Webhook (POST, path `azolute-rueckruf`, response from node, `allowedOrigins` `https://azolute.one,http://localhost:8000`) → If honeypot `website` filled → Respond 200 ok (silent) / else If valid → Insert row → Email Miras (SMTP `JU7W8yNmqyToDIQZ`, to miras@azolute.one, subject "Rückruf-Anfrage: {venue}", every field plus the consent text and time) → German acknowledgement to the sender ("Guten Tag {name}, danke für Ihre Anfrage. Miras meldet sich wie gewünscht …", formal, no marketing) → Respond 200 ok; invalid → Respond 400. Email nodes `continueRegularOutput`, so a mail failure never loses the stored request. Validate, then create.
- [ ] **Step 3:** `test_workflow` with pinned webhook data for three cases: valid → row inserted path taken and 200; `consent: false` → 400 path; honeypot filled → silent path, no insert.
- [ ] **Step 4:** Export the workflow JSON to `docs/n8n/azolute-rueckruf-de.json` (no credentials' secrets are in exports; check it).
- [ ] **Step 5:** Commit: `git add docs/n8n/azolute-rueckruf-de.json && git commit -m "Add the German call-back intake workflow (unpublished)"`

### Task 6: Launch checklist

**Files:**
- Create: `docs/de-launch-checklist.md`
- Modify: `docs/december-2026.md` (item 8 → built, waiting for launch)

- [ ] **Step 1:** Write the checklist, each step with its check: fill every `[[…]]` (`grep -rn '\[\[' de/` prints nothing); lawyer checks Impressum, privacy text and the consent wording; set the webhook URL to the EU server if n8n has moved (`js/site-config.js`, bump `?v=` on the `de/` pages); publish "Azolute · Rückruf (DE)" and remove `http://localhost:8000` from its allowed origins; send one real test request and see the row, both emails; remove the robots `noindex` from the three pages; remove the `de/*` exclude from `deploy.yml`; add `de/` to `sitemap.xml`; add a "Deutsch" link to the English footer (`components/footer.html`); use the page on the Google Business Profile and in the February letters. Undo: put the exclude back and redeploy.
- [ ] **Step 2:** Update the December list.
- [ ] **Step 3:** Run `node --test tests/` → all PASS.
- [ ] **Step 4:** Commit: `git add docs && git commit -m "Add the German page launch checklist"`
