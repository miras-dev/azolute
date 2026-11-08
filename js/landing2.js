/**
 * Azolute, landing variation 2 (staging): the before/after film
 *
 * A scroll-scrubbed story told in pinned full-viewport stages. Each act
 * reads its progress from the scroll position, so scrolling literally
 * plays (and rewinds) the film:
 *
 *   vignettes - three "before" scenes crossfading with captions
 *   turn      - a violet line splits the screen, cold scene warms up
 *   wipe      - before/after of the same scene, revealed by a wipe
 *
 * Images load from img/landing2/ (scene-N-before/after). A top playhead
 * shows where in the film the visitor is. Reduced motion gets static
 * 50/50 splits; everything is plain DOM/CSS, no WebGL.
 */

(function () {
    'use strict';

    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var acts = Array.from(document.querySelectorAll('[data-fx]'));
    if (!acts.length) return;

    var playhead = document.getElementById('playheadFill');

    function clamp01(v) { return Math.min(1, Math.max(0, v)); }
    function ease(t) { return t * t * (3 - 2 * t); }

    /* per-act progress: 0 when the act pins, 1 when it unpins */
    function progress(el) {
        var rect = el.getBoundingClientRect();
        var total = el.offsetHeight - window.innerHeight;
        if (total <= 0) return rect.top < 0 ? 1 : 0;
        return clamp01(-rect.top / total);
    }

    function applyVignettes(act, p) {
        var figs = act.querySelectorAll('.vignette');
        var n = figs.length;
        figs.forEach(function (fig, i) {
            var start = i / n, end = (i + 1) / n;
            var local = clamp01((p - start) / (end - start));
            // fade in during first 25%, hold, fade out during last 20% (except last)
            var o = ease(clamp01(local / 0.25));
            if (i < n - 1) o *= 1 - ease(clamp01((local - 0.8) / 0.2));
            fig.style.opacity = o;
            fig.style.transform = 'scale(' + (1.04 - 0.04 * local) + ')';
        });
    }

    function applyTurn(act, p) {
        var line = act.querySelector('.turn-line');
        var after = act.querySelector('.img-after');
        var copy1 = act.querySelector('.turn-copy-1');
        var copy2 = act.querySelector('.turn-copy-2');
        if (line) {
            line.style.opacity = ease(clamp01(p / 0.2));
            line.style.transform = 'translateX(-50%) scaleY(' + ease(clamp01(p / 0.3)) + ')';
            line.style.width = (2 + ease(clamp01((p - 0.35) / 0.5)) * 40) + 'vw';
            line.style.filter = 'blur(' + (ease(clamp01((p - 0.35) / 0.5)) * 60) + 'px)';
        }
        if (after) after.style.opacity = ease(clamp01((p - 0.4) / 0.45));
        if (copy1) copy1.style.opacity = ease(clamp01(p / 0.15)) * (1 - ease(clamp01((p - 0.45) / 0.15)));
        if (copy2) copy2.style.opacity = ease(clamp01((p - 0.55) / 0.2));
    }

    function applyWipe(act, p) {
        var after = act.querySelector('.img-after');
        var divider = act.querySelector('.wipe-divider');
        var capB = act.querySelector('.cap-before');
        var capA = act.querySelector('.cap-after');
        // hold a moment at both ends, wipe through the middle 70%
        var w = ease(clamp01((p - 0.15) / 0.7));
        if (reducedMotion) w = 0.5;
        if (after) after.style.clipPath = 'inset(0 ' + ((1 - w) * 100) + '% 0 0)';
        if (divider) {
            divider.style.left = (w * 100) + '%';
            divider.style.opacity = w > 0.005 && w < 0.995 ? 1 : 0;
        }
        if (capB) capB.style.opacity = 1 - ease(clamp01((w - 0.35) / 0.3));
        if (capA) capA.style.opacity = ease(clamp01((w - 0.45) / 0.3));
    }

    var fx = { vignettes: applyVignettes, turn: applyTurn, wipe: applyWipe };

    var ticking = false;
    function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
            ticking = false;
            acts.forEach(function (act) {
                var fn = fx[act.dataset.fx];
                if (fn) fn(act, progress(act));
            });
            if (playhead) {
                var max = document.documentElement.scrollHeight - window.innerHeight;
                playhead.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
            }
        });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
})();
