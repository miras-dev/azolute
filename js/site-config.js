/**
 * Azolute AI Technologies, demo layer configuration
 *
 * ONE place to switch the live demos on and off. Everything here is
 * public by design (webhook URLs are public endpoints). Never put API
 * keys or secrets in this file.
 *
 * After editing, bump the ?v= query string on the script tags that load
 * this file (assets are cached for a year by CloudFront).
 */

window.AZOLUTE_CONFIG = {

    /* WhatsApp click-to-chat button (floating, bottom right).
       number: international format, digits only, no "+", no spaces. */
    whatsapp: {
        enabled: true,
        number: '919207404868',
        prefill: 'Hi Azolute, I found you through your website.'
    },

    /* "Book a 15-minute call" via Cal.com.
       calLink: the part after cal.com/, e.g. "miras-azolute/15min".
       While enabled is false the booking sections show a styled
       email fallback instead of the calendar. */
    booking: {
        enabled: true,
        calLink: 'miras-mujeeb-v6smew/15min'
    },

    /* AI chat widget. Dark until the n8n webhook is live.
       webhookUrl: the production URL of the imported workflow in
       docs/n8n/azolute-site-chat.json, e.g.
       https://n8n.azolute.one/webhook/azolute-site-chat */
    chat: {
        enabled: false,
        webhookUrl: ''
    },

    /* Contact form intake. Empty = the form falls back to opening the
       visitor's email app, pre-filled. Set to the production URL of
       docs/n8n/azolute-contact-intake.json, e.g.
       https://n8n.azolute.one/webhook/azolute-contact */
    contactForm: {
        webhookUrl: ''
    },

    /* Live proof strip on ecosystem.html. The strip stays hidden until
       data/stats.json exists (an n8n cron writes it straight to S3,
       see docs/demo-layer-setup.md). */
    stats: {
        url: 'data/stats.json'
    }
};
