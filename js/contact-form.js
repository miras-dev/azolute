/**
 * Azolute AI Technologies, contact form intake
 *
 * POSTs the enquiry as JSON to the configured n8n webhook
 * (docs/n8n/azolute-contact-intake.json) and shows an instant
 * confirmation. With no webhook configured, or if the webhook errors,
 * the form falls back to opening the visitor's email app pre-filled:
 * the page keeps working with n8n down.
 */

(function () {
    'use strict';

    var form = document.getElementById('contactForm');
    if (!form) return;

    var cfg = (window.AZOLUTE_CONFIG || {}).contactForm || {};
    var hasHook = !!cfg.webhookUrl;

    var note = document.getElementById('contactFormNote');
    var status = document.getElementById('contactFormStatus');
    var success = document.getElementById('contactSuccess');
    var submitBtn = form.querySelector('button[type="submit"]');
    var submitLabel = submitBtn ? submitBtn.querySelector('span') : null;

    var fields = {
        name: form.querySelector('[name="name"]'),
        email: form.querySelector('[name="email"]'),
        business: form.querySelector('[name="business"]'),
        message: form.querySelector('[name="message"]'),
        honeypot: form.querySelector('[name="website"]')
    };

    if (note) {
        note.innerHTML = hasHook
            ? 'This form runs on the same n8n intake automation we install for clients. Prefer email? <a href="mailto:miras@azolute.one">miras@azolute.one</a> always works.'
            : 'This form opens your email app with everything pre-filled, or write directly to <a href="mailto:miras@azolute.one">miras@azolute.one</a>.';
    }

    function track(name, params) {
        if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
    }

    function setStatus(kind, html) {
        if (!status) return;
        status.className = 'form-status' + (kind ? ' ' + kind : '');
        status.innerHTML = html || '';
    }

    function setBusy(busy) {
        if (!submitBtn) return;
        submitBtn.disabled = busy;
        if (submitLabel) submitLabel.textContent = busy ? 'Sending…' : 'Send enquiry';
    }

    function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

    function validate() {
        var ok = true;
        [['name', !!fields.name.value.trim()],
         ['email', validEmail(fields.email.value.trim())],
         ['message', !!fields.message.value.trim()]].forEach(function (pair) {
            var el = fields[pair[0]];
            el.setAttribute('aria-invalid', pair[1] ? 'false' : 'true');
            if (!pair[1]) ok = false;
        });
        return ok;
    }

    function payload() {
        return {
            name: fields.name.value.trim(),
            email: fields.email.value.trim(),
            business: fields.business ? fields.business.value.trim() : '',
            message: fields.message.value.trim(),
            page: location.pathname,
            submittedAt: new Date().toISOString()
        };
    }

    function mailtoFallback(p) {
        var body = 'Name: ' + p.name + '\n' +
            'Email: ' + p.email + '\n' +
            (p.business ? 'Business: ' + p.business + '\n' : '') +
            '\n' + p.message;
        location.href = 'mailto:miras@azolute.one?subject=' +
            encodeURIComponent('Project enquiry from ' + p.name) +
            '&body=' + encodeURIComponent(body);
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        /* bots fill the hidden field; answer quietly and do nothing */
        if (fields.honeypot && fields.honeypot.value) {
            setStatus('ok', 'Thanks, your message is on its way.');
            return;
        }

        if (!validate()) {
            setStatus('err', 'A name, a valid email and a message are all it takes.');
            return;
        }

        var p = payload();

        if (!hasHook) {
            mailtoFallback(p);
            setStatus('ok', 'Your email app should open with everything pre-filled. If it doesn’t, write to <a href="mailto:miras@azolute.one">miras@azolute.one</a>.');
            track('contact_form_mailto', { page: location.pathname });
            return;
        }

        setBusy(true);
        setStatus('', '');

        var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
        var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 20000) : null;

        fetch(cfg.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(p),
            signal: ctrl ? ctrl.signal : undefined
        }).then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            form.hidden = true;
            if (success) {
                success.hidden = false;
                success.focus();
            }
            track('contact_form_submit', { page: location.pathname });
        }).catch(function () {
            setStatus('err', 'That didn’t go through. Email <a href="mailto:miras@azolute.one">miras@azolute.one</a> instead, it always works.');
            setBusy(false);
        }).then(function () {
            if (timer) clearTimeout(timer);
            if (!form.hidden) setBusy(false);
        });
    });
})();
