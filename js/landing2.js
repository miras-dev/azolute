/**
 * Azolute, landing variation 2: interactive before/after sliders
 *
 * Each .ba-card holds a before and an after image of the same scene.
 * When a card first enters the viewport its wipe animates to 55% once
 * (critically damped, no overshoot); after that the visitor owns it:
 * grab anywhere on the card and the divider tracks the pointer 1:1
 * (pointer capture, no transition lag), or use arrow keys on the handle.
 *
 * No scroll-jacking: the page scrolls like a normal landing page.
 * Reduced motion: cards rest at a static 50% split, dragging still works.
 */

(function () {
    'use strict';

    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* showcase scene tabs: swap the pair, keep the slider interactive */
    var tabs = document.querySelectorAll('.scene-tabs [data-scene]');
    var showcase = document.getElementById('showcaseCard');
    var hint = document.getElementById('showcaseHint');
    if (tabs.length && showcase) {
        // preload all pairs so switching is instant
        tabs.forEach(function (t) {
            ['before', 'after'].forEach(function (s) {
                var img = new Image();
                img.src = 'img/landing2/' + t.dataset.scene + '-' + s + '.webp';
            });
        });

        tabs.forEach(function (tab) {
            tab.addEventListener('click', function () {
                tabs.forEach(function (t) {
                    t.classList.toggle('active', t === tab);
                    t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
                });
                showcase.querySelector('.ba-before').src = 'img/landing2/' + tab.dataset.scene + '-before.webp';
                showcase.querySelector('.ba-after').src = 'img/landing2/' + tab.dataset.scene + '-after.webp';
                if (hint) hint.textContent = tab.dataset.hint || '';
                if (showcase.resetSlider) showcase.resetSlider();
            });
        });
    }

    document.querySelectorAll('.ba-card').forEach(function (card) {
        var after = card.querySelector('.ba-after');
        var handle = card.querySelector('.ba-handle');
        var capB = card.querySelector('.ba-tag-before');
        var capA = card.querySelector('.ba-tag-after');
        if (!after || !handle) return;

        var pos = reducedMotion ? 0.5 : 0;
        var dragging = false;
        var played = false;

        function render() {
            var pct = pos * 100;
            after.style.clipPath = 'inset(0 ' + (100 - pct) + '% 0 0)';
            handle.style.left = pct + '%';
            handle.setAttribute('aria-valuenow', Math.round(pct));
            if (capB) capB.style.opacity = pos > 0.82 ? 0 : 1;
            if (capA) capA.style.opacity = pos < 0.18 ? 0 : 1;
        }
        render();

        /* one-time entry reveal: 0 -> 0.55, ease-out, interruptible */
        function play() {
            if (played || reducedMotion) return;
            played = true;
            var start = null, from = pos, to = 0.55, dur = 1100;
            function tick(ts) {
                if (dragging) return;              // the user grabbed it: they win
                if (start === null) start = ts;
                var t = Math.min(1, (ts - start) / dur);
                var e = 1 - Math.pow(1 - t, 3);    // ease-out cubic, no overshoot
                pos = from + (to - from) * e;
                render();
                if (t < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
        }

        if ('IntersectionObserver' in window) {
            var io = new IntersectionObserver(function (entries) {
                if (entries[0].isIntersecting) { play(); io.disconnect(); }
            }, { threshold: 0.45 });
            io.observe(card);
        } else {
            played = true;
            pos = 0.55;
            render();
        }

        /* direct manipulation: divider tracks the pointer 1:1 */
        function setFromEvent(e) {
            var r = card.getBoundingClientRect();
            pos = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
            render();
        }

        card.addEventListener('pointerdown', function (e) {
            dragging = true;
            played = true;
            card.setPointerCapture(e.pointerId);
            card.classList.add('dragging');
            setFromEvent(e);
        });

        card.addEventListener('pointermove', function (e) {
            if (dragging) setFromEvent(e);
        });

        function endDrag() {
            dragging = false;
            card.classList.remove('dragging');
        }
        card.addEventListener('pointerup', endDrag);
        card.addEventListener('pointercancel', endDrag);

        /* a scene switch re-plays a quick reveal from the current position */
        card.resetSlider = function () {
            played = true;
            var start = null, from = pos, to = 0.55, dur = 650;
            function tick(ts) {
                if (dragging) return;
                if (start === null) start = ts;
                var t = Math.min(1, (ts - start) / dur);
                var e = 1 - Math.pow(1 - t, 3);
                pos = from + (to - from) * e;
                render();
                if (t < 1) requestAnimationFrame(tick);
            }
            if (!reducedMotion) requestAnimationFrame(tick);
            else { pos = 0.5; render(); }
        };

        /* keyboard access on the handle */
        handle.addEventListener('keydown', function (e) {
            var step = e.shiftKey ? 0.2 : 0.06;
            if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                pos = Math.max(0, pos - step);
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                pos = Math.min(1, pos + step);
            } else if (e.key === 'Home') { pos = 0; }
            else if (e.key === 'End') { pos = 1; }
            else { return; }
            e.preventDefault();
            played = true;
            render();
        });
    });
})();
