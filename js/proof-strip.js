/**
 * Azolute AI Technologies, live proof strip
 *
 * Fills [data-proof-strip] with numbers from data/stats.json, a file an
 * n8n cron overwrites in S3 (see docs/demo-layer-setup.md). The strip
 * stays hidden unless the file exists, parses, and is recent, so the
 * page renders cleanly when the automation has nothing to show.
 *
 * Expected shape:
 * { "updated": "2026-11-09T08:00:00Z",
 *   "stats": [ { "label": "Enquiries answered this week", "value": "12" } ] }
 */

(function () {
    'use strict';

    var mount = document.querySelector('[data-proof-strip]');
    if (!mount) return;

    var cfg = (window.AZOLUTE_CONFIG || {}).stats || {};
    if (!cfg.url) return;

    var MAX_AGE_DAYS = 30; /* older than this reads as abandoned: hide it */

    function relTime(date) {
        var mins = Math.round((Date.now() - date.getTime()) / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return mins + ' min ago';
        var hours = Math.round(mins / 60);
        if (hours < 24) return hours + (hours === 1 ? ' hour ago' : ' hours ago');
        var days = Math.round(hours / 24);
        return days + (days === 1 ? ' day ago' : ' days ago');
    }

    var bust = (cfg.url.indexOf('?') === -1 ? '?' : '&') + 't=' + Date.now();

    fetch(cfg.url + bust, { cache: 'no-store' }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
    }).then(function (data) {
        if (!data || !Array.isArray(data.stats) || !data.stats.length) return;

        var updated = data.updated ? new Date(data.updated) : null;
        if (!updated || isNaN(updated.getTime())) return;
        if (Date.now() - updated.getTime() > MAX_AGE_DAYS * 86400000) return;

        var live = document.createElement('span');
        live.className = 'proof-live';
        live.innerHTML = '<span class="dot" aria-hidden="true"></span>';
        live.appendChild(document.createTextNode('Automation running right now'));
        mount.appendChild(live);

        data.stats.slice(0, 4).forEach(function (s) {
            if (!s || !s.label || s.value === undefined) return;
            var item = document.createElement('span');
            item.className = 'proof-item';
            var n = document.createElement('span');
            n.className = 'n';
            n.textContent = String(s.value);
            var l = document.createElement('span');
            l.className = 'l';
            l.textContent = String(s.label);
            item.appendChild(n);
            item.appendChild(l);
            mount.appendChild(item);
        });

        var up = document.createElement('span');
        up.className = 'proof-updated';
        up.textContent = 'Updated ' + relTime(updated) + ' by our n8n stack';
        mount.appendChild(up);

        mount.hidden = false;
    }).catch(function () { /* no stats file: the strip simply stays hidden */ });
})();
