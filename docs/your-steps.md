# Your steps (Miras), December 2026 to February 2027

Written 24 Nov 2026. Everything here needs your accounts, a signature or a
decision; everything else is on Claude's side of `docs/december-2026.md`.
Do them in this order. Each step says where to click and how you know it
worked.

**What only you can do, at a glance**

| When | What | Time it takes |
|---|---|---|
| **Before 31 Dec** (hard deadline) | 1. Check that the Azolute number's Meta account is billed in rupees | 15 min, more if it isn't |
| Any time before launch | 2. Delete the test row in `callback_requests` | 2 min |
| Late January | 3. Launch the German page (checklist) | about 2 hours, plus the lawyer |

---

## 1. Rupee billing for the Azolute WhatsApp number: before 31 December

**Why:** several billing guides report that from 1 January 2027 Meta stops
delivering messages from Indian WhatsApp Business accounts that are not billed
in rupees (INR). The Azolute number (+91 94003 34868) is Indian, and it sends
the café's booking messages. If it stops, the café's bookings stop.
(Caution: this comes from third-party guides; Meta's own page didn't load when
we checked. Treat it as real until Meta or Twilio tells you otherwise in
writing.)

**Start here:** <https://business.facebook.com/billing_hub/>

1. Log in with the Facebook account that runs Azolute's Meta business.
2. Top left, make sure the business selected is Azolute's (not a personal one).
3. Open **Accounts** (or **Payment methods**) and find the **WhatsApp Business
   account** that holds +91 94003 34868.
   - Can't find it? Open <https://business.facebook.com/wa/manage/home/>
     (WhatsApp Manager), pick the account with the number, then
     **Account tools → Payment methods** (the name can differ slightly).
4. Read the **currency** and **who pays**. You'll be in one of three cases:

| You see | What it means | What to do |
|---|---|---|
| **INR / ₹** | Already fine | Nothing. Write the date you checked in `docs/december-2026.md`, item 1. |
| **Billed by Twilio** (a partner credit line, or no payment method of your own) | Twilio pays Meta for this number today | Before 31 Dec: ask Twilio support **in writing** whether messages keep flowing after 1 Jan, or do the WhatsApp cutover (runbook) before 31 Dec and add your own **INR** payment method when Twilio is removed. |
| **Your own card, in USD or EUR** | Not INR | The guides say a currency can't be changed in place; a new INR billing setup is made and the number moved. Open Meta support from <https://www.facebook.com/business/help> → **Get support**, choose WhatsApp Business Platform → Billing, and ask how to move this account to INR before 31 Dec. |

**You know it worked when:** the account shows ₹/INR, or you have Twilio's or
Meta's written answer that delivery continues after 1 January.

Tell Claude the result in any chat; it updates the December list.

---

## 2. Delete the test row: any time before launch

While testing the call-back workflow, Claude stored one test request. n8n's
tools couldn't delete it, so you do it once.

**Start here:** <https://n8n-jrkw.srv2144760.hstgr.cloud/>

1. In the left menu open **Overview**, then the **Data tables** tab.
2. Open **callback_requests**.
3. Tick the row named **TEST Claude (bitte löschen)** (id 1) and click
   **Delete**.

**You know it worked when:** the table shows no rows.

---

## 3. Launch the German page: late January

The full checklist, with the reasons for each step, is
`docs/de-launch-checklist.md`. This is the same list with the links, and with
who does what. "Ask Claude" means: open a chat on the `miras-dev/azolute` repo
and say what's in quotes.

### Before you start: the gates (all must be true)

| # | Gate | How to check | Link |
|---|---|---|---|
| 1 | The one-tap flow runs at the café | The WhatsApp cutover is done; the café script has `OWNER_APPROVAL=true`; one real booking went Waiting → Confirmed by tap | Runbook: <https://github.com/miras-dev/azolute/blob/main/docs/whatsapp-cutover-runbook.md> |
| 2 | Meta approved the German introduction message (with the AI notice) | The template says **Approved** | <https://business.facebook.com/wa/manage/message-templates/> |
| 3 | You've decided who owns each venue's WhatsApp number | The page says each venue has its own account and pays Meta directly. If you decide otherwise, ask Claude: "change the German page's WhatsApp cost answer to …" | — |
| 4 | n8n runs on a server in the EU, and the AVV lists every service | In Hostinger, the VPS shows an EU location; the AVV (December item 9) is done | <https://hpanel.hostinger.com/> → **VPS** → your server → **Overview** (location) |

### The steps

1. **Your details for the legal pages.** Ask Claude: "fill the German
   Impressum and privacy page", and give it your full name, the address where
   you can receive letters, a phone number, your VAT status (from the
   Steuerberater), the state you live in, and your mail provider. Claude fills
   the `[[…]]` blanks, removes the draft notes, and sets the VAT line on the
   price card.
2. **Lawyer.** Send the lawyer these three links from the pull request (or the
   files `de/impressum.html`, `de/datenschutz.html`, `de/index.html`) and the
   list of open points in `docs/de-launch-checklist.md`, step 8. A German
   IT or media lawyer, or a fixed-price legal-text service for websites, can do
   this. Wait for the written OK. Changes they ask for: give them to Claude.
3. **Webhook address.** If n8n moved to a new server address, ask Claude:
   "the n8n address is now …, update the German form".
4. **Publish the workflow.** Open
   <https://n8n-jrkw.srv2144760.hstgr.cloud/workflow/g6aCvYQvXV608TYn>
   (*Azolute · Rückruf (DE)*):
   1. Double-click **Rückruf Webhook** → **Options** → **Allowed Origins
      (CORS)**. Change `https://azolute.one,http://localhost:8000` to
      `https://azolute.one`. Close the node.
   2. Check step 2 above is done (no test row).
   3. Click **Publish** (top right).

   **You know it worked when:** the workflow shows as published.
5. **The short address `azolute.one/de/`** (recommended, for the letters).
   Start here: <https://console.aws.amazon.com/cloudfront/v4/home#/functions>
   1. **Create function**. Name: `azolute-index-rewrite`. Runtime:
      `cloudfront-js-2.0`. **Create**.
   2. Replace the code with the code in `docs/de-launch-checklist.md`, step
      11. **Save changes**.
   3. Open the **Publish** tab → **Publish function**.
   4. Go to **Distributions** → the azolute.one distribution → **Behaviors**
      → select the default behaviour → **Edit**.
   5. Under **Function associations**, **Viewer request**: function type
      **CloudFront Functions**, function `azolute-index-rewrite`. **Save
      changes**. Wait about five minutes.

   **You know it worked when:** <https://azolute.one/about.html> still loads,
   and after the launch <https://azolute.one/de/> loads too.
   (Skipping this step is fine: then use `azolute.one/de/index.html` in the
   letters.)
6. **Go live.** Ask Claude: "launch the German page". It switches on search
   indexing, removes the deploy guard, adds the sitemap entry and a "Deutsch"
   link to the English footer, runs the tests and pushes. Then merge the pull
   request it gives you on GitHub (**Merge pull request** → **Confirm**). The
   deploy runs by itself.
7. **Send one real request** on the live page with your own details.
   **You know it worked when:** a row appears in `callback_requests` (link in
   step 2) and the "Rückruf-Anfrage" email reaches miras@azolute.one.
8. **Use the address** on the Google Business Profile, in the February
   letters and in LinkedIn posts.
9. **When a request comes in:** call as asked. When someone withdraws consent,
   or 12 months after the last contact if nothing came of it, delete their row
   in `callback_requests` **and** the email in your mailbox.

**If something goes wrong after launch:** ask Claude "take the German page
down". It needs the commands in `docs/de-launch-checklist.md`, "Undo", run with
the site's AWS access.

---

## Calls Claude made for you to check

These are decisions Claude took without asking you, in the 24 Nov session.
Each says what it costs if it's wrong. Tell Claude in any chat if one should
change.

### German page

| Call | Why | If it's wrong |
|---|---|---|
| The page says the desk works *alongside* the venue's reservation system and leaves the details to the call, instead of "connects to your system" | No connection to a reservation tool is built yet | The page undersells, if one exists by launch |
| Guests book through the website form only; booking by chatting on WhatsApp isn't mentioned | Only the form flow is built | — |
| No automatic reply email to the person who fills in the form | The reviewer showed it let anyone send mail from miras@azolute.one to any list of addresses with their own text | Visitors get no confirmation email; the page says you'll call |
| The page answers the visitor as soon as the request is stored; your email follows | A stored request is safe; the visitor shouldn't wait for mail | — |
| No limit on how many requests one sender can make | Without the auto-reply, abuse can only fill your own inbox and the table, the same as the English contact form today | A flood means deleting rows by hand |
| Successful runs of the form workflow aren't saved in n8n | So deleting a row really deletes the request, as the privacy page promises | Less to look back on when debugging |
| Links use `index.html` (not `/de/`) | The live site's CloudFront doesn't turn `/de/` into `/de/index.html` | Longer address until step 5 above |
| Impressum: a note that you don't take part in consumer dispute resolution, instead of the EU online dispute-resolution link | The EU platform closed in July 2025 | The lawyer changes one paragraph |
| The trade name "Azolute AI Technologies" next to your name | A sole trader must use their own name; a trade name may be added | The lawyer may remove it |
| Blanks Claude couldn't fill: AWS region, whether access logs are on, n8n server location, transfers outside the EU, mail provider, your data-protection authority, date | Facts Claude doesn't know | — |
| Legal questions the reviewer raised (EU AI Act date, how long consent records are kept, cancellation wording) go to the lawyer | They need a lawyer, not a guess | Copy changes after the lawyer's check |
| The German pages load nothing from Google or anywhere else (fonts are on azolute.one itself) | German courts have fined sites for loading Google Fonts from Google | — |
| The page is built now but kept off the live site and out of search engines until launch | The Impressum can't be complete before the Gewerbe registration | — |

### Content Engine

| Call | Why | If it's wrong |
|---|---|---|
| The image model is now `gemini-3.1-flash-lite-image` (was `gemini-2.5-flash-image`) | The old one shuts down on 15 March 2027; Google names this one as the replacement; it's a little cheaper | Check the first picture it draws against the brand style; switching to `gemini-3.1-flash-image` is a one-field change |

### app.azolute.one (paused, for when you have about ten clients)

The phase 1 design (`docs/superpowers/specs/2026-11-24-app-azolute-one-phase1-design.md`)
holds these calls, to recheck before building: photos copied to AWS before
Meta deletes them; the WhatsApp Hub untouched until the cutover is stable; the
inbox shows Azolute's number only; each chat records its client; the web
address certificate in AWS's US region, everything else in Frankfurt.

---

## Left for later

None of these blocks the launch.

- The form shows one error message whatever is wrong, and the page rejects
  phone numbers written with dots (`030.1234567`).
- Extra points for the lawyer: a Wirtschafts-ID line and "Angebot nur für
  Unternehmer" in the Impressum; a highlighted right-to-object note, whether
  giving the data is required, and one legal basis per purpose in the privacy
  page.
- The stored consent wording comes from the visitor's browser; the server
  could check it against the official version.
- No automated test yet for a form request that hangs or gets an error back
  (the reviewer tried both by hand: the page handles them).
- The "Check" group on the n8n canvas couldn't be made (cosmetic).
