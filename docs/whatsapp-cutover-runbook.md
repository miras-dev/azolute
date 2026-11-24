# WhatsApp off Twilio: the runbook

The steps only you can do, in order. Everything else is built and waiting,
switched off. Design: `docs/superpowers/specs/2026-11-24-whatsapp-off-twilio-design.md`.

**The number:** Azolute AI, +91 94003 34868 (your own SIM).
**Rule for every step:** each one says how to check it worked and how to undo
it. If a check fails, stop, undo that step, and nothing else changes.

**Where secrets go (and nowhere else):** n8n credentials, the `hub_settings`
table in n8n, the café's Script Properties, and the inbox's `.env` on your Mac.
Never in chat, email, code or git.

## What's already built

| Piece | Where | State |
|---|---|---|
| **WhatsApp Hub**: receives every message and status, logs it, routes it | n8n, `IorCSvwB305dpU5g` | built, tested, **not published** |
| **WhatsApp Hub · Inbox API**: what the inbox app talks to | n8n, `BuatfauT1gooTQ9q` | built, tested, **not published** |
| **WhatsApp Hub · Alerts**: emails you when something fails | n8n, `M8FOdndi0Jfx2Qv6` | published (does nothing until a failure) |
| **Content Engine · Owner Replies**: now called by the Hub | n8n, `7b7LKdOUEbPPUctx` | changed, not published |
| `wa_messages` (the log), `hub_settings` (the Hub's settings) | n8n → Data tables | created |
| Café script with a Twilio/Meta switch and Confirm/Decline | `miras-dev/toasty`, branch `claude/whatsapp-meta`, `google-apps-script.gs` | pushed, not pasted yet |
| Inbox app with Twilio/Hub modes and history import | `miras-dev/whatsapp-inbox`, branch `claude/whatsapp-meta` | pushed |
| ClashCWL | no change (it moved to Discord) | only its Twilio settings get removed |

---

## Part A: before the day (nothing changes for anyone)

### A1. Look at the Twilio webhook (5 min)

1. Twilio console → **Messaging → Senders → WhatsApp senders** → the +91 94003
   34868 sender. Write down the **"A message comes in"** URL.
2. AWS Lambda → the ClashCWL **API** function → Configuration → Environment
   variables. Write down `TWILIO_FORWARD_URL` (it may not exist).

**Check:** if the first URL is ClashCWL's (`…clashcwl.com/api/twilio/whatsapp`)
and `TWILIO_FORWARD_URL` is empty or missing, nothing else answers customers.
Go on. If `TWILIO_FORWARD_URL` points somewhere, **stop** and tell Claude what it
is: that system needs a place in the Hub first.

### A2. Find out who owns the number in Meta (5 min)

[business.facebook.com](https://business.facebook.com) → your **Azolute**
portfolio → **Settings → Accounts**. Since September 2026 there are two lists:
**WhatsApp accounts** (holds the number) and **Messaging accounts** (holds
templates and billing; the same id as the old "WhatsApp Business Account").

- Find the one with +91 94003 34868. Note which portfolio owns each, and which
  partners (Twilio) they are shared with.
- **Path 1 (expected):** both are owned by your portfolio, shared with Twilio.
  → Follow this runbook as written.
- **Path 2:** the WhatsApp account is yours, but the Messaging account belongs
  to Twilio. → Your app gets its own Messaging account on the same number
  (Meta makes one per app). Number, name and limits stay. Templates must be
  created in **your** Messaging account (step A5).
- **Path 3:** you can't see the number at all, or it's in Twilio's portfolio.
  → **Stop and tell Claude.** The fallback (delete the sender in Twilio, then
  register the number fresh) loses the name approval and limits, so we decide
  it together.

Write down the **Messaging account id** (WABA id) you'll use.

### A3. Business verification (if Meta asks)

Settings → **Business info**. If it isn't verified and Meta asks for it when you
create the app or add the number, verify it (company documents, takes 1–3 days).
Do this first if it's needed, because everything else waits for it.

### A4. Your Meta app and token (20 min)

1. [developers.facebook.com](https://developers.facebook.com) → **My Apps →
   Create app** → type **Business** → connect it to the **Azolute** portfolio.
   Name it e.g. `Azolute WhatsApp`.
2. In the app: **Add product → WhatsApp → Set up**. It also gives you a free
   **test number** (used in A6). Choose the Messaging account from A2 when asked.
3. App settings → **Basic**: note the **App ID** and **App secret**.
4. Business settings → **Users → System users → Add**: name `n8n`, role
   **Admin**. Then **Assign assets**: the app (full control) and the WhatsApp /
   Messaging account (full control).
5. On that system user: **Generate token** → choose the app → expiry **Never** →
   permissions `whatsapp_business_messaging` and `whatsapp_business_management`.
   Copy the token straight into step A7 (it's shown once).
6. WhatsApp Manager → **Phone numbers**: note the **Phone number ID** of
   +91 94003 34868 (a long number, not the phone number), and of the test number.

**Check:** WhatsApp Manager shows the number with your display name and a green
quality rating. **Undo:** delete the app; nothing else used it.

### A5. Templates (submit now; Meta approves in minutes to a day)

WhatsApp Manager → **Message templates → Create**. All **Utility**, language
**English (en)**. If a template with the same name already exists (made through
Twilio) in the Messaging account you use, keep it.

| Name | Body | Buttons |
|---|---|---|
| `toasty_new_submission` | `New website submission: {{1}}` ⏎⏎ `Details: {{2}}` ⏎⏎ `Received {{3}}. Full entry is in the Google Sheet.` | none |
| `toasty_booking_request` | `New reservation: {{1}}, {{2}}, {{3}} guests. Phone: {{4}}. Confirm to tell the guest it's booked.` | Quick reply `Confirm`, Quick reply `Decline` (in this order) |
| `toasty_intro` | `Hello, this is Azolute AI, the booking assistant for Toasty Turtle Cafe. We'll send updates about your booking here.` | none |
| `toasty_booking_confirmed` | `Toasty Turtle Cafe: your table for {{1}} on {{2}} has been confirmed. See you soon!` | none |
| `toasty_booking_declined` | `Toasty Turtle Cafe: sorry, we can't take your booking for {{1}}. Please call {{2}} to find another time.` | none |
| `content_review` | as in `docs/content-engine-setup.md` (header image, two variables, Approve / Edit / Skip) | 3 quick replies |

Sample values Meta asks for: `Anna`, `24/12/2026 19:00`, `2`, `+49 151 2345678`,
`+49 30 1234567`. The booking templates are only used once café approval is
switched on (Part C), but approving them now costs nothing.

**Check:** all show **Active – Approved**.

### A6. Fill in n8n (15 min)

In n8n ([n8n-jrkw.srv2144760.hstgr.cloud](https://n8n-jrkw.srv2144760.hstgr.cloud)):

1. **Credentials → Create:**
   - **WhatsApp OAuth API**, name `WhatsApp App (Hub)`: Client ID = App ID,
     Client Secret = App secret (A4.3).
   - **WhatsApp API**, name `WhatsApp API (Hub)`: Access Token = the token
     (A4.5), Business Account ID = the Messaging account id (A2).
   - **Header Auth**, name `Inbox Key`: Name `X-Inbox-Key`, Value = a long
     random string (make one with `openssl rand -hex 32` in Terminal). You'll
     also put it in the inbox's `.env`.
2. **Pick the credentials on the nodes** (each node → Credential):
   - WhatsApp Hub: `WhatsApp In` → `WhatsApp App (Hub)`; `Reply To The Café
     Owner` → `WhatsApp API (Hub)`.
   - WhatsApp Hub · Inbox API: the four webhook nodes → `Inbox Key`; `Send
     Through Meta`, `Ask Meta For The File Link`, `Download The File` →
     `WhatsApp API (Hub)`.
   - Content Engine (Render & Preview and Owner Replies): every WhatsApp node
     and `Download Photo` → `WhatsApp API (Hub)`.
3. **Data tables → `hub_settings`**, row `azolute`:
   - `azolute_phone_number_id` = the **test number's** Phone number ID for now.
   - `cafe_script_url` = the café's web app address (the `GOOGLE_SCRIPT_URL` in
     the café website's `js/main.js`, ending `/exec`).
   - `cafe_hub_secret` = another long random string (`openssl rand -hex 32`).
     The same value goes in the café's `HUB_SECRET` later (Part C).
   - `graph_version` = `v23.0` (or the newest version Meta lists), `alert_email`
     = `miras@azolute.one`.
4. **Data tables → `content_settings`**, row `azolute`: `wa_phone_number_id` =
   the test number's Phone number ID for now.
5. **Data tables → `wa_messages`**: delete the test rows (wamid starting
   `wamid.TEST` or `SMTEST`).

### A7. Test everything on Meta's test number (30 min)

1. In the app → WhatsApp → **API Setup**, add your personal number
   (919207404868) as a test recipient.
2. In n8n, **publish** in this order: `WhatsApp Hub · Inbox API`, `Content
   Engine · Owner Replies`, `Content Engine · Render & Preview`, `WhatsApp Hub`.
   Publishing the Hub registers its address as the app's webhook.
3. From your phone, message the **test number** "hello".
   **Check:** a row appears in `wa_messages` within seconds, and you get the
   Content Engine's "how it works" reply (your number is the Content Engine
   owner).
4. On your Mac, in the inbox folder: `git pull` (branch `claude/whatsapp-meta`),
   create `.env`:
   ```
   INBOX_SOURCE=hub
   HUB_URL=https://n8n-jrkw.srv2144760.hstgr.cloud
   HUB_KEY=the Inbox Key value
   INBOX_NUMBER=+the test number
   ```
   Start the inbox. **Check:** your "hello" chat shows; reply from the inbox and
   it arrives on your phone.
5. Send the test number a photo. **Check:** it shows in the inbox.
6. Open `Content Engine · Plan Post` → **Make One Now**. **Check:** the preview
   arrives with Approve / Edit / Skip (needs `content_review` approved).
7. **Alerts:** test runs don't send real emails, so the first real alert is
   the check. If you'd like to see one before the day, ask Claude to trigger a
   test alert; an email titled "WhatsApp Hub: …" should reach
   `miras@azolute.one` (check spam once).

**Undo:** unpublish the four workflows; set `INBOX_SOURCE=twilio` in `.env`.
Nothing live was touched (the business number isn't on your app yet).

### A8. Paste the new café script (10 min, no change in behaviour)

1. Open the café's Google Sheet → **Extensions → Apps Script**. Replace the
   code with `google-apps-script.gs` from the toasty branch `claude/whatsapp-meta`.
2. Don't change any Script Properties yet (without `WHATSAPP_PROVIDER` it stays
   on Twilio, exactly as today).
3. **Deploy → Manage deployments → edit → Version: New version → Deploy.**
   (Same URL; the website doesn't change.)
4. Run **testWhatsApp**. **Check:** the café owner gets the usual alert through
   Twilio.

**Undo:** Manage deployments → pick the previous version.

---

## Part B: cutover day (about an hour, in a quiet hour)

| # | Do | Check | Undo |
|---|---|---|---|
| B1 | **Meta, Path 1:** subscribe your app to the number's Messaging account. In Terminal: `curl -X POST "https://graph.facebook.com/v23.0/<WABA_ID>/subscribed_apps" -H "Authorization: Bearer <token>"` (paste the token only into Terminal). Path 2: add the number to your app in WhatsApp Manager as Meta offers. | Answer `{"success":true}`. `curl "https://graph.facebook.com/v23.0/<WABA_ID>/subscribed_apps" -H "Authorization: Bearer <token>"` lists your app. | `curl -X DELETE` the same URL. |
| B2 | n8n `hub_settings`: `azolute_phone_number_id` = the **business number's** Phone number ID. `content_settings`: `wa_phone_number_id` = the same. | — | Put the test number's id back. |
| B3 | From your phone, message **+91 94003 34868** "test". | A row in `wa_messages` with that number id. (Twilio may still get a copy too; that's fine.) | — |
| B4 | **Café:** first, in WhatsApp Manager → Message templates, check the exact name and language code of the owner alert template (one made through Twilio may be `en_US`, not `en`). Then Script Properties → add `WHATSAPP_PROVIDER` = `meta`, `META_WA_TOKEN` = the token, `META_WA_PHONE_NUMBER_ID` = the business number's id, `OWNER_TEMPLATE` = that template's name, `TEMPLATE_LANG` = its language code. If `CUSTOMER_CONFIRMATION` is `true` today, also set `CONFIRMATION_TEMPLATE` to the guest confirmation template's name (or set `CUSTOMER_CONFIRMATION` to `false`), otherwise every booking sends a guest message that fails. Run **setup**, then **testWhatsApp**. | setup says "WhatsApp through Meta … All settings present"; the café owner gets the alert from Azolute AI. Then make one test booking on the website: row in the Sheet, email, WhatsApp. | Set `WHATSAPP_PROVIDER` = `twilio`. |
| B5 | **Inbox:** in `.env`, remove `INBOX_NUMBER` (or set `+919400334868`). Restart the inbox. | Your "test" message shows. Reply to it; it arrives. | `INBOX_SOURCE=twilio`. |
| B6 | **Content Engine:** Plan Post → **Make One Now**, then publish `Content Engine · Plan Post`. | Preview arrives; Approve / Edit / Skip work. | Unpublish Plan Post. |
| B7 | **ClashCWL:** AWS Lambda → both ClashCWL functions (collector and API) → Environment variables → delete `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`, `TWILIO_CONTENT_SID`, `WATCH_WHATSAPP_TO`, `TWILIO_FORWARD_URL`, `TWILIO_WEBHOOK_URL` (whichever exist). Save the values in your password manager first. | Legends admin → Watch list still works; alerts go to Discord. | Put the variables back. |
| B8 | **Old chats:** in the inbox folder, `npm run import-twilio` (needs the Twilio login still). | It ends "Done"; old chats show in the inbox. | Safe to run again. |

Until step C1, going back is: providers back to `twilio`, inbox `.env` back to
`twilio`. No code changes.

## Part C: after the day

| # | When | Do |
|---|---|---|
| C1 | after a quiet week | Business settings → the WhatsApp account and the Messaging account → **remove Twilio** as a partner. In Twilio, delete the WhatsApp sender only after that. |
| C2 | then | Twilio: check nothing uses the US number (+1 754…, $1.15/month): no ClashCWL, café or inbox setting points at it, no SMS/voice webhooks you need. Then release it and close the Twilio account. |
| C3 | when the café owner agrees | **Dry run first:** with `HUB_SECRET` set (below) but `OWNER_APPROVAL` still off, ask Claude to send the café script a test tap for a booking that doesn't exist; the answer should be "I couldn't find that booking". That proves the Hub ↔ script link (Google's redirect included) before a real guest is involved. Then **Café Confirm / Decline:** Script Properties → `OWNER_APPROVAL` = `true`, `HUB_SECRET` = the `cafe_hub_secret` from `hub_settings`, `CAFE_PHONE` = the café's phone, and the four template names (`BOOKING_REQUEST_TEMPLATE` = `toasty_booking_request`, `GUEST_INTRO_TEMPLATE` = `toasty_intro`, `GUEST_CONFIRMED_TEMPLATE` = `toasty_booking_confirmed`, `GUEST_DECLINED_TEMPLATE` = `toasty_booking_declined`). Run **setup**. Make a test booking with your own number as the guest; tap Confirm. **Check:** you get the introduction, then the confirmation; the Sheet says Confirmed; the owner gets "Done: …". Undo: `OWNER_APPROVAL` = `false`. |
| C4 | later | ClashCWL clean-up (separate job): remove its `/twilio/whatsapp` route and `twilio.mjs`, following its `AGENTS.md`. |

## Token rotation (if the token ever leaks or you regenerate it)

The token lives in exactly two places: the n8n credential `WhatsApp API (Hub)`
and the café's Script Property `META_WA_TOKEN`. Generate a new one (A4.5),
replace both, then revoke the old one in Business settings → System users.

## When something goes wrong

- You get an email from "Azolute n8n" saying what failed. Incoming messages are
  written to `wa_messages` before anything else is tried, so a failure further
  along (routing, the café, the Content Engine) never loses the message. If the
  Hub can't run at all (n8n down), Meta keeps retrying for up to 7 days.
- If the café owner taps Confirm/Decline and the café script refuses or breaks,
  the owner is told "I couldn't process that tap … please contact them
  directly", and you get an email. If Meta later reports a guest message as
  undelivered, the owner gets "The WhatsApp to … didn't arrive. Please call them
  on …".
- n8n down for a while: Meta retries deliveries for up to 7 days, so messages
  arrive late, not lost. Sends from the café keep working (they go straight to
  Meta).
- A reply fails with "more than 24 hours have passed": WhatsApp only allows free
  replies within 24 hours of the client's last message. Only templates can go
  out after that.
