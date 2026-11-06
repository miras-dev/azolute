/**
 * Azolute AI Technologies — site behaviour
 * Vanilla JS: header scroll state, mobile nav, scroll reveal.
 * Runs after js/components.js (header/footer already injected).
 */

(function () {
    'use strict';

    document.documentElement.classList.add('js');

    /* ---------- Header scroll state ---------- */
    var header = document.getElementById('siteHeader');

    function onScroll() {
        if (!header) return;
        header.classList.toggle('scrolled', window.scrollY > 10);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ---------- Mobile navigation ---------- */
    var toggle = document.getElementById('navToggle');
    var nav = document.getElementById('siteNav');

    if (toggle && nav) {
        toggle.addEventListener('click', function () {
            var open = nav.classList.toggle('open');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            if (header) header.classList.add('scrolled');
            if (!open) onScroll();
        });

        nav.addEventListener('click', function (e) {
            if (e.target.tagName === 'A') {
                nav.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    /* ---------- Scroll reveal ---------- */
    var items = document.querySelectorAll('.reveal');

    if ('IntersectionObserver' in window && items.length) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

        items.forEach(function (el) { io.observe(el); });
    } else {
        items.forEach(function (el) { el.classList.add('in'); });
    }
})();
