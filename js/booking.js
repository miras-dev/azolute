/**
 * Azolute AI Technologies, Cal.com booking embed
 *
 * Mounts an inline Cal.com calendar into every [data-cal-mount] element.
 * Config lives in js/site-config.js (AZOLUTE_CONFIG.booking). While the
 * embed is disabled, or if Cal.com fails to load, the section degrades
 * to a styled email fallback: the page never shows a broken box.
 */

(function () {
    'use strict';

    var cfg = (window.AZOLUTE_CONFIG || {}).booking || {};
    var mounts = document.querySelectorAll('[data-cal-mount]');
    if (!mounts.length) return;

    function track(name, params) {
        if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
    }

    function renderFallback(el) {
        el.classList.remove('booking-live');
        el.classList.add('booking-fallback');
        el.innerHTML =
            '<h3>Online booking is being wired in</h3>' +
            '<p>Until it goes live, email two or three times that suit you and ' +
            'you’ll get a confirmed slot back, usually the same day.</p>' +
            '<div class="btn-row">' +
                '<a class="btn" href="mailto:miras@azolute.one?subject=' +
                encodeURIComponent('15-minute call') + '"><span>Email to book</span><span class="arrow">→</span></a>' +
            '</div>';
    }

    var enabled = !!(cfg.enabled && cfg.calLink && cfg.calLink.indexOf('REPLACE') === -1);

    if (!enabled) {
        mounts.forEach(renderFallback);
        return;
    }

    /* Official Cal.com embed loader (cal.com/docs, inline embed) */
    (function (C, A, L) {
        var p = function (a, ar) { a.q.push(ar); };
        var d = C.document;
        C.Cal = C.Cal || function () {
            var cal = C.Cal;
            var ar = arguments;
            if (!cal.loaded) {
                cal.ns = {};
                cal.q = cal.q || [];
                d.head.appendChild(d.createElement('script')).src = A;
                cal.loaded = true;
            }
            if (ar[0] === L) {
                var api = function () { p(api, arguments); };
                var namespace = ar[1];
                api.q = api.q || [];
                if (typeof namespace === 'string') {
                    cal.ns[namespace] = cal.ns[namespace] || api;
                    p(cal.ns[namespace], ar);
                    p(cal, ['initNamespace', namespace]);
                } else {
                    p(cal, ar);
                }
                return;
            }
            p(cal, ar);
        };
    })(window, 'https://app.cal.com/embed/embed.js', 'init');

    window.Cal('init', { origin: 'https://app.cal.com' });

    mounts.forEach(function (el) {
        el.classList.add('booking-live');
        window.Cal('inline', {
            elementOrSelector: el,
            calLink: cfg.calLink,
            config: { theme: 'dark' }
        });
    });

    window.Cal('ui', {
        theme: 'dark',
        cssVarsPerTheme: { dark: { 'cal-brand': '#8050f0' } },
        hideEventTypeDetails: false
    });

    track('booking_embed_view', { page: location.pathname });

    /* If the embed script never arrives (blocked, offline), fall back. */
    setTimeout(function () {
        mounts.forEach(function (el) {
            if (!el.querySelector('iframe')) renderFallback(el);
        });
    }, 8000);
})();
