# Demo layer: setup and go-live checklist

The site now carries the demo layer: a WhatsApp click-to-chat button, a
Cal.com "book a 15-minute call" embed, an AI chat widget, a contact form
wired for n8n, and a live proof strip. Everything is driven by **one
file**: `js/site-config.js`. Each feature degrades gracefully, so the
site works fully even with every flag off and n8n down.

After editing `js/site-config.js`, bump the `?v=` on its script tags
(all six nav pages) so the year-long CloudFront asset cache does not
serve the old config.

## 1. WhatsApp button (live)

`whatsapp.number` is `919207404868` (confirmed by the owner,
2026-11-09). Digits only, international format, no `+`. Set
`whatsapp.enabled: false` to hide the button entirely.

## 2. Cal.com booking (live)

`booking.calLink` is `miras-mujeeb-v6smew/15min`, shown inline on
`ecosystem.html` and `contact.html`, with a secondary "Ask Claude to
book the call" link (Cal's copy-prompt flow via mcp.cal.com).

The embed loads Cal's official script from `app.cal.com`, themed dark
with the brand violet. If the script fails to load, the section falls
back to the email card after 8 seconds; setting
`booking.enabled: false` shows that fallback permanently.

## 3. AI chat widget (currently dark)

The widget ships dark (`chat.enabled: false`) until the n8n webhook is
live and publicly reachable over HTTPS.

1. Import `docs/n8n/azolute-site-chat.json` into n8n
   (Workflows, Import from File).
2. Open the **Anthropic Chat Model** node, attach your Anthropic API
   credential, and pick the model from the dropdown (a current Haiku is
   ideal for this: fast and cheap). Swapping the node for an OpenAI
   chat model works the same way.
3. Open the **Chat Webhook** node and set *Allowed Origins (CORS)* from
   `*` to `https://azolute.one` (and `https://www.azolute.one` if used).
   The browser cannot call the webhook without CORS.
4. In the **Session Memory** node, check the session key expression
   resolves (`{{ $json.body.sessionId }}`; the widget sends
   `{ sessionId, message, page }`).
5. Activate the workflow and copy the **production** webhook URL
   (not the test URL), e.g.
   `https://n8n.azolute.one/webhook/azolute-site-chat`.
6. Test from a terminal:

   ```bash
   curl -s -X POST https://YOUR-N8N/webhook/azolute-site-chat \
     -H 'Content-Type: application/json' \
     -d '{"sessionId":"test-1","message":"What does the ecosystem cost?"}'
   ```

   Expect `{"reply":"..."}` quoting "from EUR 149 a month".
7. In `js/site-config.js` set `chat.webhookUrl` to that URL and
   `chat.enabled: true`.

The widget already handles n8n being down: errors, timeouts (25s) and
odd payloads all render "Chat is napping right now. Email
miras@azolute.one and Miras will reply personally."

The system prompt in the workflow is built strictly from the site's
approved content (modules, from EUR 149/month, the process, the
contact email) and instructs the agent to decline anything off-topic
and point to the contact page. Edit it in the **Site Assistant** node
if the approved facts change.

## 4. Contact form intake

The form on `contact.html` works today with no webhook: it opens the
visitor's email app pre-filled (mailto fallback), and the email button
and address stay on the page regardless.

1. Import `docs/n8n/azolute-contact-intake.json`.
2. Attach SMTP credentials to both email nodes (**Notify Miras** and
   **Acknowledge Enquirer**). Any transactional SMTP works; the
   acknowledgement node is set to continue on error so a bounced
   auto-reply never fails the submission.
3. Set *Allowed Origins (CORS)* to `https://azolute.one` as above.
4. Activate, copy the production URL, and set
   `contactForm.webhookUrl` in `js/site-config.js`.

The workflow silently drops submissions where the hidden honeypot field
(`website`) is filled or the email has no `@`: bots get a polite 200 and
no email is sent.

## 5. Live proof strip (optional)

`ecosystem.html` has a hidden strip in the "Proof, not promises"
section. It renders only when `data/stats.json` exists, parses, and its
`updated` timestamp is under 30 days old; otherwise the page is
unchanged. Schema: `docs/n8n/stats.sample.json`.

Feed it from an n8n cron (Schedule Trigger, then your counting logic,
then an AWS S3 node or HTTP upload) that overwrites the object:

```bash
aws s3 cp stats.json s3://YOUR-BUCKET/data/stats.json \
  --cache-control "no-cache, no-store, must-revalidate" \
  --content-type "application/json"
```

Notes:

- Deploys will not delete it (the deploy's `--delete` only covers
  `*.html`), and `.github/workflows/deploy.yml` now uploads any
  committed `data/*.json` with no-cache headers. Prefer writing it to
  S3 only; do not commit a `data/stats.json` with made-up numbers (the
  no-fabricated-stats rule applies to the strip too).
- The widget fetches with `cache: no-store` plus a timestamp query, so
  numbers update on every page load.
- Only real counters from the n8n stack belong here, e.g. enquiries
  answered this week, bookings confirmed, median reply time.

## Testing

Before merging to main, open the changed pages in headless Chromium
(Playwright is the house tool) and check: zero console errors, no
horizontal overflow at 390px, chat/booking/form behave with and without
their webhooks, and reduced-motion renders without animation.
