# Content Engine: build notes and go-live checklist

The Content Engine (Lite) now runs on our n8n
(`https://n8n-jrkw.srv2144760.hstgr.cloud`), first for Azolute's own
Instagram. Claude drafts a post, Gemini draws the picture, the owner gets
it on WhatsApp with **Approve / Edit / Skip**, and approved posts publish
to Instagram. Nothing publishes without the owner's tap.

The offer it delivers is in `docs/azolute-ecosystem-offer.md`
("Add-on: CONTENT ENGINE"). Exports of the four workflows are in
`docs/n8n/content-engine-*.json`; the live workflows on n8n are the
source of truth.

## What is built

| Workflow (n8n id) | What it does | State |
|---|---|---|
| Content Engine · Plan Post (`dJQEkHIlElhTMr14`) | Mon, Wed, Fri 10:00 (or **Make One Now**): for each active client, Claude writes topic, caption, image brief and alt text, avoiding recent topics. Saves the draft, then calls Render & Preview. Skips a client that already has 3+ drafts waiting. | Draft, not published |
| Content Engine · Render & Preview (`7MMg2MhNJJQfXw3A`) | Sub-workflow. Draws the image with Gemini if needed, converts it to a 1080×1080 JPEG, stores it, and sends the owner the `content_review` WhatsApp template. | Draft, not published |
| Content Engine · Owner Replies (`7b7LKdOUEbPPUctx`) | Called by the **WhatsApp Hub** (`IorCSvwB305dpU5g`) for each message from a client's owner; the Hub owns the Meta webhook and logs every message. Approve publishes to Instagram; Edit asks what to change and Claude revises from the owner's next message; Skip discards; a photo sent with a note becomes a post (cropped to 4:5, caption written from the photo). Ignores anyone but the owner. | Draft, not published |
| Content Engine · Media Server (`OB4FHohps9OJxdh5`) | Public `GET /webhook/content-media?f=<key>` that serves stored images, so Instagram and WhatsApp can fetch them. | **Live** |

Data tables (n8n → Data tables):

- `content_settings`: one row per client (brand voice, audience, themes,
  hashtags, image style, owner WhatsApp number, WhatsApp phone number id,
  template name, Instagram user id, Graph API version, media URL base).
  Azolute's row is filled in except the two ids marked `SET_ME`.
- `content_posts`: every draft and its status.
- `content_media`: the images, as base64. Rows are deleted when a post
  is published or skipped.

Why images live in a table: n8n on the VPS may only touch files under
`/home/node/.n8n-files`, which does not exist in the container, and
Instagram needs a public URL to fetch from. The table plus the Media
Server needs no server access and survives container updates.

Post statuses: `drafting` → `awaiting_approval` → `publishing` →
`published`, with `awaiting_edit`, `skipped`, `failed` (Instagram
refused; tapping Approve again retries) and `preview_failed` (image or
WhatsApp step failed; the error is in the row).

## What was tested

- Media Server: live URL returns the stored JPEG; unknown keys and
  `../` paths return 404.
- Image pipeline on the server: PNG → 1080×1080 JPEG → table → served
  back as a valid image; an 800 KB cell saves fine.
- Plan Post, live: Claude (`claude-sonnet-5-5`) wrote an on-brand draft
  and saved it; Render & Preview then stopped cleanly at the missing
  Gemini credential and marked the post `preview_failed`.
- Owner Replies, with WhatsApp and Instagram calls simulated: Approve on
  a post that is not waiting is refused; a stranger's tap is ignored;
  Edit sets `awaiting_edit`; the owner's typed note makes Claude revise
  the draft and ask for a new picture when requested.

Not yet tested, because they need the accounts below: the WhatsApp
template send, the Instagram publish, and the photo-to-post path
(download and crop).

## Go-live checklist

1. **Gemini.** Create an API key in Google AI Studio. In n8n add a
   *Google Gemini (PaLM) API* credential, then select it on **Generate
   Image** in Render & Preview. Model: `gemini-2.5-flash-image`.
2. **WhatsApp Business Cloud API.** In Meta Business Manager, register the
   business number on the Cloud API (it cannot be the owner's own number:
   previews go *to* `owner_whatsapp`, currently `919207404868`). Create a
   System User token with `whatsapp_business_messaging` and
   `whatsapp_business_management`.
   - n8n credential *WhatsApp API* (token + business account id): select
     it on every WhatsApp node in Render & Preview and Owner Replies, and
     on **Download Photo**.
   - n8n credential *WhatsApp OAuth API* (app id + app secret): select it
     on the WhatsApp Hub's **WhatsApp In** trigger (Owner Replies no longer
     has its own trigger: the Meta app has one webhook, and it's the Hub's).

   The full order of steps for moving the business number off Twilio is in
   `docs/whatsapp-cutover-runbook.md`; follow that instead of this item.
3. **Template.** Create a message template, name `content_review`,
   language English (`en`):
   - Header: Image
   - Body: `New post ready for review: {{1}}` then a blank line, `{{2}}`,
     a blank line, `Approve to publish on Instagram, Edit to change it,
     or Skip.`
   - Buttons: three Quick Replies, in this order: `Approve`, `Edit`, `Skip`.

   Meta must approve it before previews can send. The template is needed
   because Plan Post messages the owner unprompted; WhatsApp blocks free
   messages outside the 24-hour window. The caption in the preview is
   flattened to one paragraph (templates reject line breaks); Instagram
   gets the full caption with its line breaks.
4. **Instagram.** The Instagram account must be a professional account
   linked to a Facebook Page. Give the Meta app `instagram_basic`,
   `instagram_content_publish`, `pages_show_list` and
   `pages_read_engagement`, and make a long-lived System User token.
   Find the Instagram user id with
   `GET /me/accounts?fields=instagram_business_account`. In n8n add a
   *Facebook Graph API* credential with the token and select it on the
   three Instagram nodes in Owner Replies.
5. **Settings row.** In `content_settings`, replace `SET_ME` in
   `wa_phone_number_id` and `ig_user_id`, and confirm `owner_whatsapp`.
6. **Publish** in this order: Render & Preview, Owner Replies, the WhatsApp
   Hub, then Plan Post. Check the instance timezone first (Plan Post fires at 10:00 in
   it; set a timezone in the workflow's settings if needed).
7. **First run.** Open Plan Post and click **Make One Now**. The preview
   arrives on WhatsApp; tap Edit, type a change, check the new preview,
   then Approve and check Instagram. Then send the business number a
   photo with a short note and check that preview too.

## Adding a client later

Add a row to `content_settings` with its own `client_key`, voice,
style, owner number, WhatsApp phone number id and Instagram user id.
All four workflows look the client up from that row (Owner Replies by
the WhatsApp phone number id the message arrived on), so no workflow is
copied. Each client's Meta tokens need their own credentials; until
credentials are chosen per row, one Meta app/token serving several
clients' assets is the simple path.

## Not built yet (Lite scope still open)

- YouTube uploads of owner clips (title, description, tags, thumbnail).
- The monthly content calendar approved in the same flow.
- The performance line in the owner's report.
- Pro tier: AI video Reels/Shorts and the monthly themed campaign.
- An n8n error workflow that alerts on failed runs.

Housekeeping: the test draft `azolute-20261123-62thgq` in
`content_posts` (status `preview_failed`) and the tiny test image
`ce-selftest.jpg` in `content_media` can be deleted.
