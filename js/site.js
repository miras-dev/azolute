/**
 * Azolute AI Technologies, site behaviour
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

    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    /* ---------- Rotating headline words ---------- */
    document.querySelectorAll('.word-rotate').forEach(function (el) {
        var words;
        try { words = JSON.parse(el.getAttribute('data-words')); } catch (e) { return; }
        if (!words || words.length < 2 || reducedMotion) return;

        var span = el.querySelector('.word');
        if (!span) return;
        var i = 0;

        setInterval(function () {
            span.classList.add('out');
            setTimeout(function () {
                i = (i + 1) % words.length;
                span.textContent = words[i];
                span.classList.remove('out');
            }, 420);
        }, 3400);
    });

    /* ---------- 3D tilt on cards ---------- */
    if (finePointer && !reducedMotion) {
        document.querySelectorAll('.card, .step, .founder-mark, .chapter-card').forEach(function (el) {
            var lift = el.classList.contains('card') ? ' translateY(-5px)' : '';

            // track 1:1 during the gesture (apple-design §2): the class's
            // 300ms transition would lag the pointer, so suspend it on enter
            el.addEventListener('pointerenter', function () {
                el.style.transition = 'transform 60ms ease-out';
            });

            el.addEventListener('pointermove', function (e) {
                var r = el.getBoundingClientRect();
                var px = (e.clientX - r.left) / r.width - 0.5;
                var py = (e.clientY - r.top) / r.height - 0.5;
                el.style.transform = 'perspective(800px) rotateX(' + (-py * 6).toFixed(2) +
                    'deg) rotateY(' + (px * 8).toFixed(2) + 'deg)' + lift;
            });

            // settle from the current (presentation) value with the slower ease
            el.addEventListener('pointerleave', function () {
                el.style.transition = '';
                el.style.transform = '';
            });
        });
    }

    /* ---------- Cursor glow ---------- */
    if (finePointer && !reducedMotion) {
        var glow = document.createElement('div');
        glow.className = 'cursor-glow';
        glow.setAttribute('aria-hidden', 'true');
        document.body.appendChild(glow);

        var gx = 0, gy = 0, tx = -999, ty = -999, shown = false;

        window.addEventListener('pointermove', function (e) {
            tx = e.clientX;
            ty = e.clientY;
            if (!shown) { gx = tx; gy = ty; glow.classList.add('on'); shown = true; }
        }, { passive: true });

        (function glowLoop() {
            gx += (tx - gx) * 0.12;
            gy += (ty - gy) * 0.12;
            glow.style.transform = 'translate(' + gx.toFixed(1) + 'px,' + gy.toFixed(1) + 'px)';
            requestAnimationFrame(glowLoop);
        })();
    }

    /* ---------- Portfolio filter ---------- */
    var filterButtons = document.querySelectorAll('.filter-row [data-filter]');
    if (filterButtons.length) {
        var workCards = document.querySelectorAll('.work-card[data-cat]');
        filterButtons.forEach(function (btn) {
            btn.addEventListener('click', function () {
                filterButtons.forEach(function (b) { b.classList.toggle('active', b === btn); });
                var f = btn.getAttribute('data-filter');
                workCards.forEach(function (card) {
                    var show = f === 'all' || card.getAttribute('data-cat').split(' ').indexOf(f) !== -1;
                    card.classList.toggle('hidden', !show);
                });
            });
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
