/**
 * Azolute AI Technologies — homepage scroll story
 *
 * A fixed fullscreen Three.js canvas sits behind the page. As the visitor
 * scrolls through the story chapters, ~1600 particles morph between
 * formations, one per chapter:
 *
 *   0 hero    — galaxy (ambient field)
 *   1 discover— radar sphere with equator scan ring (we study your business)
 *   2 idea    — comet spiral converging on one glowing point (one specific idea)
 *   3 scope   — ordered 3D lattice (mapping your tools, agreeing the scope)
 *   4 build   — particles assemble into a website wireframe (we build)
 *   5 launch  — expanding burst (delivery day)
 *   6 care    — orbit rings around a core (we stay with you)
 *   7 outro   — calm galaxy (CTA)
 *
 * Also drives the chapter progress rail. Respects prefers-reduced-motion
 * (single static frame, no morphing), pauses when the tab is hidden, and
 * fails silently without WebGL — the story text is plain HTML either way.
 */

import * as THREE from './vendor/three.module.min.js';

const canvas = document.getElementById('storyCanvas');
if (canvas) initStory(canvas);

function initStory(canvas) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isSmall = window.matchMedia('(max-width: 760px)').matches;
    const N = isSmall ? 850 : 1600;

    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch (e) {
        canvas.remove();
        return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 80);
    camera.position.set(0, 0, 8);

    /* ---------------- formation generators ---------------- */

    function galaxy(n, radius, flat) {
        const a = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
            const r = radius * (0.3 + 0.7 * Math.cbrt(Math.random()));
            const th = Math.random() * Math.PI * 2;
            const ph = Math.acos(2 * Math.random() - 1);
            a[i * 3] = r * Math.sin(ph) * Math.cos(th);
            a[i * 3 + 1] = r * Math.cos(ph) * flat;
            a[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th) * 0.6 - radius * 0.15;
        }
        return a;
    }

    function radar(n) {
        const a = new Float32Array(n * 3);
        const R = 4.0;
        for (let i = 0; i < n; i++) {
            if (i % 4 === 0) {
                // equator scan ring
                const th = Math.random() * Math.PI * 2;
                const r = R + 0.55 + Math.random() * 0.12;
                a[i * 3] = r * Math.cos(th);
                a[i * 3 + 1] = (Math.random() - 0.5) * 0.08;
                a[i * 3 + 2] = r * Math.sin(th);
            } else {
                // fibonacci sphere surface
                const k = i + 0.5;
                const ph = Math.acos(1 - 2 * k / n);
                const th = Math.PI * (1 + Math.sqrt(5)) * k;
                a[i * 3] = R * Math.sin(ph) * Math.cos(th);
                a[i * 3 + 1] = R * Math.cos(ph);
                a[i * 3 + 2] = R * Math.sin(ph) * Math.sin(th);
            }
        }
        return a;
    }

    function comet(n) {
        const a = new Float32Array(n * 3);
        const fx = 1.4, fy = 0.2; // focal point, slightly right of centre
        for (let i = 0; i < n; i++) {
            if (i % 5 === 0) {
                // dense core around the one idea
                a[i * 3] = fx + (Math.random() - 0.5) * 0.5;
                a[i * 3 + 1] = fy + (Math.random() - 0.5) * 0.5;
                a[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
            } else {
                // log spiral tail sweeping in
                const t = Math.random();
                const ang = t * Math.PI * 3.2 + 0.6;
                const r = 0.35 + (1 - t) * 7.5;
                a[i * 3] = fx + r * Math.cos(ang);
                a[i * 3 + 1] = fy + r * Math.sin(ang) * 0.45;
                a[i * 3 + 2] = (1 - t) * -2.5 + (Math.random() - 0.5) * 0.6;
            }
        }
        return a;
    }

    function lattice(n) {
        const a = new Float32Array(n * 3);
        const nx = 10, ny = 6, nz = 4, s = 1.15;
        const total = nx * ny * nz;
        for (let i = 0; i < n; i++) {
            const k = i % total;
            const x = k % nx;
            const y = Math.floor(k / nx) % ny;
            const z = Math.floor(k / (nx * ny));
            a[i * 3] = (x - (nx - 1) / 2) * s + (Math.random() - 0.5) * 0.06;
            a[i * 3 + 1] = (y - (ny - 1) / 2) * s + (Math.random() - 0.5) * 0.06;
            a[i * 3 + 2] = (z - (nz - 1) / 2) * s - 0.5 + (Math.random() - 0.5) * 0.06;
        }
        return a;
    }

    function browser(n) {
        // particles trace a website wireframe: frame, header bar, text lines, media block
        const a = new Float32Array(n * 3);
        const W = 6.4, H = 4.0, z = 0;
        const segs = [
            // [x1,y1,x2,y2,weight] — frame
            [-W / 2, H / 2, W / 2, H / 2, 2], [-W / 2, -H / 2, W / 2, -H / 2, 2],
            [-W / 2, -H / 2, -W / 2, H / 2, 1.4], [W / 2, -H / 2, W / 2, H / 2, 1.4],
            // header divider + nav dots
            [-W / 2, H / 2 - 0.65, W / 2, H / 2 - 0.65, 1.6],
            // headline lines (left column)
            [-W / 2 + 0.5, 0.85, -0.4, 0.85, 1.2],
            [-W / 2 + 0.5, 0.35, -0.9, 0.35, 1.0],
            // body lines
            [-W / 2 + 0.5, -0.3, -0.3, -0.3, 0.9],
            [-W / 2 + 0.5, -0.7, -0.5, -0.7, 0.9],
            // button
            [-W / 2 + 0.5, -1.35, -W / 2 + 2.0, -1.35, 0.8],
            [-W / 2 + 0.5, -1.15, -W / 2 + 2.0, -1.15, 0.8],
            // media block (right)
            [0.5, 1.0, W / 2 - 0.5, 1.0, 1.0], [0.5, -1.4, W / 2 - 0.5, -1.4, 1.0],
            [0.5, -1.4, 0.5, 1.0, 0.8], [W / 2 - 0.5, -1.4, W / 2 - 0.5, 1.0, 0.8]
        ];
        const totalW = segs.reduce((s, g) => s + g[4], 0);
        let i = 0;
        for (const [x1, y1, x2, y2, w] of segs) {
            const cnt = Math.floor(n * (w / totalW));
            for (let k = 0; k < cnt && i < n; k++, i++) {
                const t = Math.random();
                a[i * 3] = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 0.05;
                a[i * 3 + 1] = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 0.05;
                a[i * 3 + 2] = z + (Math.random() - 0.5) * 0.12;
            }
        }
        for (; i < n; i++) { // leftovers: faint dust behind
            a[i * 3] = (Math.random() - 0.5) * 14;
            a[i * 3 + 1] = (Math.random() - 0.5) * 9;
            a[i * 3 + 2] = -3 - Math.random() * 4;
        }
        return a;
    }

    function burst(n) {
        const a = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
            const r = 5 + Math.random() * 4.5;
            const th = Math.random() * Math.PI * 2;
            const ph = Math.acos(2 * Math.random() - 1);
            a[i * 3] = r * Math.sin(ph) * Math.cos(th);
            a[i * 3 + 1] = r * Math.cos(ph) + 0.8;
            a[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th) - 1.5;
        }
        return a;
    }

    function orbit(n) {
        const a = new Float32Array(n * 3);
        const rings = [
            { r: 2.6, tilt: 0.45 },
            { r: 3.5, tilt: -0.5 },
            { r: 4.4, tilt: 0.15 }
        ];
        for (let i = 0; i < n; i++) {
            if (i % 10 < 3) {
                // core
                a[i * 3] = (Math.random() - 0.5) * 1.1;
                a[i * 3 + 1] = (Math.random() - 0.5) * 1.1;
                a[i * 3 + 2] = (Math.random() - 0.5) * 1.1;
            } else {
                const ring = rings[i % rings.length];
                const th = Math.random() * Math.PI * 2;
                const x = ring.r * Math.cos(th);
                const y0 = (Math.random() - 0.5) * 0.12;
                const zz = ring.r * Math.sin(th);
                a[i * 3] = x;
                a[i * 3 + 1] = y0 * Math.cos(ring.tilt) - zz * Math.sin(ring.tilt) * 0.55;
                a[i * 3 + 2] = zz * Math.cos(ring.tilt);
            }
        }
        return a;
    }

    const formations = [
        galaxy(N, 9, 0.55),  // 0 hero
        radar(N),            // 1 discover
        comet(N),            // 2 idea
        lattice(N),          // 3 scope
        browser(N),          // 4 build
        burst(N),            // 5 launch
        orbit(N),            // 6 care
        galaxy(N, 7, 0.4)    // 7 outro
    ];

    /* ---------------- particle system ---------------- */

    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(formations[0]);
    const colors = new Float32Array(N * 3);
    const seeds = new Float32Array(N);
    const ACCENT_SOFT = new THREE.Color('#a78bfa');
    const BLUE = new THREE.Color('#5e8bff');
    const WHITE = new THREE.Color('#e8e8f6');

    for (let i = 0; i < N; i++) {
        const pick = Math.random();
        const c = pick < 0.6 ? ACCENT_SOFT : (pick < 0.85 ? BLUE : WHITE);
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
        seeds[i] = Math.random() * Math.PI * 2;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
        size: 0.05,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });

    const points = new THREE.Points(geo, mat);
    scene.add(points);

    // wireframe dodecahedron for the hero, fades out as the story starts
    const wireMat = new THREE.LineBasicMaterial({ color: new THREE.Color('#8050f0'), transparent: true, opacity: 0.5 });
    const wire = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.DodecahedronGeometry(1.6)), wireMat);
    wire.position.set(isSmall ? 0 : 2.6, isSmall ? 1.6 : 0.3, 0);
    scene.add(wire);

    /* ---------------- scroll keyframes ---------------- */

    const chapterEls = Array.from(document.querySelectorAll('[data-formation]'));
    let keyframes = [];

    function buildKeyframes() {
        keyframes = chapterEls.map(function (el) {
            const rect = el.getBoundingClientRect();
            const top = rect.top + window.scrollY;
            return {
                f: parseInt(el.dataset.formation, 10),
                // scene reaches this formation when the chapter's middle crosses mid-viewport
                y: top + rect.height * 0.5 - window.innerHeight * 0.5
            };
        }).sort((a, b) => a.y - b.y);
    }

    function smoothstep(t) { return t * t * (3 - 2 * t); }

    function sceneProgress() {
        const y = window.scrollY;
        if (!keyframes.length) return 0;
        if (y <= keyframes[0].y) return keyframes[0].f;
        for (let i = 0; i < keyframes.length - 1; i++) {
            const a = keyframes[i], b = keyframes[i + 1];
            if (y < b.y) {
                const t = smoothstep((y - a.y) / (b.y - a.y));
                return a.f + (b.f - a.f) * t;
            }
        }
        return keyframes[keyframes.length - 1].f;
    }

    /* ---------------- progress rail ---------------- */

    const railDots = Array.from(document.querySelectorAll('.story-rail a'));
    let activeDot = -1;

    function updateRail(p) {
        const idx = Math.min(railDots.length - 1, Math.max(0, Math.round(p) - 1));
        if (idx !== activeDot) {
            activeDot = idx;
            railDots.forEach((d, i) => d.classList.toggle('active', i === idx));
        }
    }

    /* ---------------- sizing, pointer, loop ---------------- */

    function resize() {
        const w = window.innerWidth, h = window.innerHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        buildKeyframes();
    }
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('load', buildKeyframes);

    const target = { x: 0, y: 0 };
    const eased = { x: 0, y: 0 };
    if (!reducedMotion) {
        window.addEventListener('pointermove', function (e) {
            target.x = (e.clientX / window.innerWidth) * 2 - 1;
            target.y = (e.clientY / window.innerHeight) * 2 - 1;
        }, { passive: true });
    }

    const clock = new THREE.Clock();
    let rafId = 0;
    let running = false;

    function frame() {
        rafId = requestAnimationFrame(frame);
        const t = clock.getElapsedTime();
        const p = sceneProgress();

        updateRail(p);

        eased.x += (target.x - eased.x) * 0.04;
        eased.y += (target.y - eased.y) * 0.04;

        // morph between formations
        const i0 = Math.min(formations.length - 1, Math.floor(p));
        const i1 = Math.min(formations.length - 1, i0 + 1);
        const tt = p - i0;
        const A = formations[i0], B = formations[i1];
        const pos = geo.attributes.position.array;
        for (let i = 0; i < N; i++) {
            const j = i * 3;
            const jit = Math.sin(t * 0.5 + seeds[i]) * 0.07;
            pos[j] = A[j] + (B[j] - A[j]) * tt;
            pos[j + 1] = A[j + 1] + (B[j + 1] - A[j + 1]) * tt + jit;
            pos[j + 2] = A[j + 2] + (B[j + 2] - A[j + 2]) * tt;
        }
        geo.attributes.position.needsUpdate = true;

        // gentle global rotation, calmer on structured formations (lattice/browser)
        const structure = Math.max(0, 1 - Math.abs(p - 3) ) + Math.max(0, 1 - Math.abs(p - 4));
        const spin = 0.05 * (1 - Math.min(1, structure));
        points.rotation.y = t * spin + eased.x * 0.1;
        points.rotation.x = eased.y * 0.06;

        // hero wireframe fades away as chapter 1 approaches
        const wireVis = Math.max(0, 1 - p * 1.4);
        wireMat.opacity = 0.5 * wireVis;
        wire.visible = wireVis > 0.01;
        wire.rotation.x = t * 0.1;
        wire.rotation.y = t * 0.14;

        // camera drifts slightly deeper through the story
        camera.position.z = 8 + Math.sin(p * 0.7) * 0.6;
        camera.position.y = -p * 0.08;

        renderer.render(scene, camera);
    }

    function syncLoop() {
        const shouldRun = !document.hidden && !reducedMotion;
        if (shouldRun && !running) { running = true; clock.start(); frame(); }
        else if (!shouldRun && running) { running = false; cancelAnimationFrame(rafId); }
    }
    document.addEventListener('visibilitychange', syncLoop);

    if (reducedMotion) {
        buildKeyframes();
        renderer.render(scene, camera);
    } else {
        syncLoop();
    }

    canvas.classList.add('scene-ready');
}
