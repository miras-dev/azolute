# Content Engine test run on Azolute's Instagram: short design

Date: 2026-11-24. Status: approach chosen by Miras (option 1); design for
approval.

## Why

Before the Content Engine is sold to clients, and before reels are built,
Miras wants proof that it runs on its own: at least 3–4 days of automated
posts on Azolute's own Instagram, before 1 December 2026. What the test shows
decides the next step (reels, and rolling it out to clients).

## Goals, non-goals, anti-goals

- Goals: a post drafted every day at 10:00, previewed to Miras on WhatsApp,
  published to Instagram on Miras's tap; 3–4 days of it before 1 Dec; a short daily
  note of what ran, what failed and what Miras had to change.
- Non-goals: reels; other clients; the real Azolute number (+91 94003 34868)
  or the move off Twilio; the café.
- Anti-goals: anything published without Miras's tap; touching the live
  Twilio flow or the café's bookings; Meta tokens anywhere but n8n credentials.

## Approaches

1. **Chosen (Miras, 24 Nov): the full WhatsApp approval flow on Meta's free
   test number.** Tests exactly what clients will buy. Needs the most Meta
   setup and Meta's approval of the `content_review` template.
2. Approval by email for the test only: less setup, but tests a flow no client
   uses, so it would be tested twice.
3. No approval: fastest, but unseen AI posts on the brand, and it breaks the
   promise the product sells.

## Design

- **Miras sets up** (steps in `docs/your-steps.md`, section 0): a Gemini API
  key; the Meta app with its free test number and Miras's own number as a test
  recipient; the `content_review` template; a system-user token covering
  WhatsApp and Instagram; Instagram as a professional account linked to the
  Azolute Facebook Page; four n8n credentials holding the secrets. Miras sends
  Claude only the non-secret ids.
- **Claude wires and checks:** picks the credentials on the nodes; fills
  `content_settings` and `hub_settings` with the test number's ids and the
  Instagram user id; sets Plan Post to **every day at 10:00, Europe/Berlin**
  for the test (my call: the audience is Europe and the Gulf; it's 14:30 in
  India); publishes Render & Preview, Owner Replies, the WhatsApp Hub, then
  Plan Post; runs **Make One Now** with Miras for the first post.
- **During the test:** each day Claude reads the runs and the post rows and
  adds a line to `docs/content-engine-test-log.md` (posted or not, what failed,
  what Miras edited). After day 3–4, Miras decides with that log.
- **Undo:** unpublish the four workflows. Nothing live was touched.

## Left to the builder

The order of checks in the dry run; how the daily note is collected.
