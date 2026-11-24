/**
 * Azolute AI Technologies, German call-back form (de/index.html)
 *
 * Validates the "Rückruf anfordern" form and POSTs it as JSON to the n8n
 * workflow "Azolute · Rückruf (DE)" (docs/n8n/azolute-rueckruf-de.json),
 * which stores the request and the exact consent wording: that record is
 * what makes the follow-up call lawful (UWG § 7). Nothing is sent without
 * the consent box ticked.
 *
 * The two pure functions are exported for the unit tests
 * (tests/rueckruf-form.test.mjs).
 */

(function () {
    'use strict';

    function clean(v) { return String(v == null ? '' : v).trim(); }

    function validPhone(v) {
        var digits = clean(v).replace(/\(0\)/g, '').replace(/[\s\-\/()]/g, '');
        return /^\+?\d{6,15}$/.test(digits);
    }

    function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean(v)); }

    function validateCallback(values) {
        var errors = [];
        if (!clean(values.name)) errors.push('name');
        if (!clean(values.venue)) errors.push('venue');
        if (!validPhone(values.phone)) errors.push('phone');
        if (!validEmail(values.email)) errors.push('email');
        if (values.consent !== true) errors.push('consent');
        return { ok: errors.length === 0, errors: errors };
    }

    function buildCallbackPayload(values, consentText, nowIso, pathname) {
        return {
            name: clean(values.name),
            venue: clean(values.venue),
            phone: clean(values.phone),
            email: clean(values.email),
            best_time: clean(values.bestTime),
            message: clean(values.message),
            consent: true,
            consent_text: clean(consentText),
            consent_at: nowIso,
            page: pathname,
            lang: 'de',
            source: 'de-booking-desk',
            submittedAt: nowIso
        };
    }

    var api = { validateCallback: validateCallback, buildCallbackPayload: buildCallbackPayload };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (typeof window === 'undefined') return;
    window.AzoluteRueckruf = api;

    var form = document.getElementById('callbackForm');
    if (!form) return;

    var cfg = (window.AZOLUTE_CONFIG || {}).callbackForm || {};
    var status = document.getElementById('callbackStatus');
    var success = document.getElementById('callbackSuccess');
    var consentText = document.getElementById('cbConsentText');
    var honeypot = form.querySelector('[name="website"]');
    var submitBtn = form.querySelector('button[type="submit"]');
    var submitLabel = submitBtn ? submitBtn.querySelector('span') : null;
    var idleLabel = submitLabel ? submitLabel.textContent : '';
    var ids = { name: 'cbName', venue: 'cbVenue', phone: 'cbPhone', email: 'cbEmail', consent: 'cbConsent' };
    var sending = false;

    function el(id) { return document.getElementById(id); }

    function readValues() {
        return {
            name: el('cbName').value,
            venue: el('cbVenue').value,
            phone: el('cbPhone').value,
            email: el('cbEmail').value,
            bestTime: el('cbTime').value,
            message: el('cbMessage').value,
            consent: el('cbConsent').checked
        };
    }

    function setStatus(kind, html) {
        if (!status) return;
        status.className = 'form-status' + (kind ? ' ' + kind : '');
        status.innerHTML = html || '';
    }

    function setBusy(busy) {
        sending = busy;
        if (!submitBtn) return;
        submitBtn.disabled = busy;
        if (submitLabel) submitLabel.textContent = busy ? 'Wird gesendet…' : idleLabel;
    }

    function track(name) {
        if (typeof window.gtag === 'function') window.gtag('event', name, {});
    }

    var failHtml = 'Das hat leider nicht geklappt. Schreiben Sie uns an <a href="mailto:miras@azolute.one">miras@azolute.one</a>.';

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (sending) return;

        /* bots fill the hidden field: answer as if it worked, send nothing */
        if (honeypot && honeypot.value) {
            form.hidden = true;
            if (success) success.hidden = false;
            return;
        }

        var values = readValues();
        var result = validateCallback(values);
        Object.keys(ids).forEach(function (key) {
            el(ids[key]).setAttribute('aria-invalid', result.errors.indexOf(key) === -1 ? 'false' : 'true');
        });
        if (!result.ok) {
            setStatus('err', 'Bitte füllen Sie die markierten Felder aus und bestätigen Sie die Einwilligung.');
            return;
        }

        if (!cfg.webhookUrl) {
            setStatus('err', failHtml);
            return;
        }

        var payload = buildCallbackPayload(values, consentText ? consentText.textContent.replace(/\s+/g, ' ') : '',
            new Date().toISOString(), location.pathname);

        setBusy(true);
        setStatus('', '');

        var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
        var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 20000) : null;

        fetch(cfg.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: ctrl ? ctrl.signal : undefined
        }).then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            form.hidden = true;
            if (success) {
                success.hidden = false;
                success.focus();
            }
            track('callback_form_submit');
        }).catch(function () {
            setStatus('err', failHtml);
            setBusy(false);
        }).then(function () {
            if (timer) clearTimeout(timer);
        });
    });
})();
