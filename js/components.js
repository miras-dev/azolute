/**
 * Azolute AI Technologies, Component Loader
 *
 * Injects components/header.html and components/footer.html into every
 * page (placeholders: #site-header and #site-footer). Edit those files,
 * or NAV_LINKS below, to update all pages at once.
 */

(function () {
    'use strict';

    /* ------------------------------------------------------------------
       MAIN NAVIGATION
       Edit links here to update header + footer nav on all pages.
    ------------------------------------------------------------------ */
    var NAV_LINKS = [
        { href: 'index.html',    label: 'Home',     key: 'home' },
        { href: 'services.html', label: 'Services', key: 'services' },
        { href: 'about.html',    label: 'About',    key: 'about' },
        { href: 'contact.html',  label: 'Contact',  key: 'contact' }
    ];

    /* Synchronous loader so the header exists before first paint settles. */
    function loadHTML(url) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, false);
        xhr.send(null);
        return xhr.status === 200 ? xhr.responseText : '';
    }

    function getActivePage() {
        var file = window.location.pathname.split('/').pop() || 'index.html';
        if (file === '' || file === 'index.html') return 'home';
        if (file === 'about.html') return 'about';
        if (file === 'services.html' || file === 'service.html') return 'services';
        if (file === 'contact.html') return 'contact';
        return '';
    }

    function buildNav(active) {
        return NAV_LINKS.map(function (l) {
            var cls = l.key === active ? ' class="active" aria-current="page"' : '';
            return '<a href="' + l.href + '"' + cls + '>' + l.label + '</a>';
        }).join('\n');
    }

    var active = getActivePage();
    var nav = buildNav(active);

    var headerHost = document.getElementById('site-header');
    if (headerHost) {
        headerHost.outerHTML = loadHTML('components/header.html').replace('{{NAV}}', nav);
    }

    var footerHost = document.getElementById('site-footer');
    if (footerHost) {
        footerHost.outerHTML = loadHTML('components/footer.html').replace('{{FOOTER_NAV}}', nav);
    }
})();
