/**
 * Azolute, landing page v2 (staging): flying images scene
 *
 * A fixed fullscreen Three.js canvas. Generated images float as rounded
 * cards in a 3D corridor; scrolling flies the camera through them, with
 * mouse parallax, per-card drift, soft violet glows and depth fog.
 * Image slots load from img/landing/ and can be regenerated without
 * touching this code.
 *
 * Respects prefers-reduced-motion (static frame), pauses when the tab
 * is hidden, and the page content remains plain HTML without WebGL.
 */

import * as THREE from './vendor/three.module.min.js';

const canvas = document.getElementById('landingCanvas');
if (canvas) init(canvas);

function init(canvas) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isSmall = window.matchMedia('(max-width: 760px)').matches;

    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch (e) { canvas.remove(); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x07070d, 9, isSmall ? 26 : 34);

    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 120);
    const CAM_START = 8, CAM_END = -50;
    camera.position.set(0, 0, CAM_START);

    /* ---------------- sparse particle atmosphere ---------------- */
    const PN = isSmall ? 300 : 650;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(PN * 3);
    for (let i = 0; i < PN; i++) {
        pPos[i * 3] = (Math.random() - 0.5) * 30;
        pPos[i * 3 + 1] = (Math.random() - 0.5) * 18;
        pPos[i * 3 + 2] = 10 - Math.random() * 75;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const points = new THREE.Points(pGeo, new THREE.PointsMaterial({
        color: 0xa78bfa, size: 0.05, transparent: true, opacity: 0.5,
        depthWrite: false, blending: THREE.AdditiveBlending
    }));
    scene.add(points);

    /* ---------------- glow sprite texture ---------------- */
    function glowTexture() {
        const c = document.createElement('canvas');
        c.width = c.height = 256;
        const g = c.getContext('2d');
        const grad = g.createRadialGradient(128, 128, 10, 128, 128, 128);
        grad.addColorStop(0, 'rgba(128,80,240,0.55)');
        grad.addColorStop(0.5, 'rgba(128,80,240,0.16)');
        grad.addColorStop(1, 'rgba(128,80,240,0)');
        g.fillStyle = grad;
        g.fillRect(0, 0, 256, 256);
        return new THREE.CanvasTexture(c);
    }
    const glowTex = glowTexture();

    /* ---------------- rounded image planes ---------------- */
    function roundedTexture(img) {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const g = c.getContext('2d');
        const r = Math.min(c.width, c.height) * 0.055;
        g.beginPath();
        g.roundRect(0, 0, c.width, c.height, r);
        g.clip();
        g.drawImage(img, 0, 0);
        // faint light-catch edge
        g.strokeStyle = 'rgba(255,255,255,0.22)';
        g.lineWidth = Math.max(2, c.width * 0.004);
        g.beginPath();
        g.roundRect(g.lineWidth / 2, g.lineWidth / 2, c.width - g.lineWidth, c.height - g.lineWidth, r);
        g.stroke();
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        return t;
    }

    // slot layout: [file, width, x, y, z, backdrop?]
    const sx = isSmall ? 0.55 : 1; // pull x in on phones
    const SLOTS = [
        ['card-01.webp',     2.6,  2.9 * sx,  0.4,    3.5],
        ['abstract-01.webp', 2.0, -3.1 * sx,  1.4,    0.5],
        ['card-02.webp',     2.6, -2.8 * sx, -0.9,   -5.5],
        ['abstract-02.webp', 1.7,  3.4 * sx,  1.8,   -9],
        ['card-03.webp',     2.7,  2.7 * sx, -0.5,  -13.5],
        ['backdrop-01.webp', 11,   0,         0.6,  -20, true],
        ['abstract-03.webp', 1.8, -3.5 * sx, -1.6,  -18],
        ['card-04.webp',     2.6, -2.9 * sx,  0.7,  -22.5],
        ['card-05.webp',     2.7,  3.0 * sx,  0.1,  -29],
        ['abstract-04.webp', 1.9, -3.2 * sx,  1.6,  -33],
        ['card-06.webp',     2.6, -2.7 * sx, -0.6,  -38],
        ['backdrop-02.webp', 12,   0,        -0.4,  -47, true]
    ];

    const cards = [];
    const loaderBase = 'img/landing/';

    SLOTS.forEach(function (slot, idx) {
        const [file, w, x, y, z, isBackdrop] = slot;
        const img = new Image();
        img.onload = function () {
            const tex = roundedTexture(img);
            const h = w * (img.naturalHeight / img.naturalWidth);
            const mat = new THREE.MeshBasicMaterial({
                map: tex, transparent: true, fog: true,
                opacity: isBackdrop ? 0.34 : 1
            });
            const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
            mesh.position.set(x, y, z);
            mesh.rotation.set((Math.random() - 0.5) * 0.14, (Math.random() - 0.5) * 0.3 * (x < 0 ? 1 : -1), (Math.random() - 0.5) * 0.08);
            mesh.renderOrder = isBackdrop ? 0 : 2;
            scene.add(mesh);

            if (!isBackdrop) {
                const glow = new THREE.Mesh(
                    new THREE.PlaneGeometry(w * 1.9, h * 1.9),
                    new THREE.MeshBasicMaterial({
                        map: glowTex, transparent: true, opacity: 0.5,
                        depthWrite: false, blending: THREE.AdditiveBlending, fog: false
                    })
                );
                glow.position.set(x, y, z - 0.25);
                glow.renderOrder = 1;
                scene.add(glow);
                mesh.userData.glow = glow;
            }

            mesh.userData.base = { x: x, y: y, z: z, rx: mesh.rotation.x, ry: mesh.rotation.y, rz: mesh.rotation.z };
            mesh.userData.seed = idx * 1.7 + 0.4;
            mesh.userData.backdrop = !!isBackdrop;
            cards.push(mesh);
            if (reducedMotion) renderer.render(scene, camera);
        };
        img.src = loaderBase + file;
    });

    /* ---------------- scroll + pointer ---------------- */
    function scrollProgress() {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    }

    const target = { x: 0, y: 0 };
    const eased = { x: 0, y: 0 };
    if (!reducedMotion) {
        window.addEventListener('pointermove', function (e) {
            target.x = (e.clientX / window.innerWidth) * 2 - 1;
            target.y = (e.clientY / window.innerHeight) * 2 - 1;
        }, { passive: true });
    }

    function resize() {
        const w = window.innerWidth, h = window.innerHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    /* ---------------- loop ---------------- */
    const clock = new THREE.Clock();
    let rafId = 0, running = false;

    function frame() {
        rafId = requestAnimationFrame(frame);
        const t = clock.getElapsedTime();
        const p = scrollProgress();

        eased.x += (target.x - eased.x) * 0.05;
        eased.y += (target.y - eased.y) * 0.05;

        camera.position.z = CAM_START + (CAM_END - CAM_START) * p;
        camera.position.x = eased.x * 0.7;
        camera.position.y = -eased.y * 0.45;
        camera.rotation.y = -eased.x * 0.05;
        camera.rotation.x = eased.y * 0.03;

        for (let i = 0; i < cards.length; i++) {
            const m = cards[i];
            const b = m.userData.base;
            const s = m.userData.seed;
            if (!m.userData.backdrop) {
                m.position.x = b.x + Math.sin(t * 0.32 + s) * 0.18;
                m.position.y = b.y + Math.cos(t * 0.27 + s * 1.3) * 0.22;
                m.rotation.y = b.ry + Math.sin(t * 0.2 + s) * 0.06;
                m.rotation.z = b.rz + Math.cos(t * 0.24 + s) * 0.03;
                const g = m.userData.glow;
                if (g) {
                    g.position.x = m.position.x;
                    g.position.y = m.position.y;
                    g.material.opacity = 0.38 + Math.sin(t * 0.6 + s) * 0.12;
                }
            } else {
                m.position.y = b.y + Math.sin(t * 0.12 + s) * 0.3;
            }
        }

        points.rotation.z = t * 0.004;
        renderer.render(scene, camera);
    }

    function syncLoop() {
        const shouldRun = !document.hidden && !reducedMotion;
        if (shouldRun && !running) { running = true; clock.start(); frame(); }
        else if (!shouldRun && running) { running = false; cancelAnimationFrame(rafId); }
    }
    document.addEventListener('visibilitychange', syncLoop);

    if (reducedMotion) {
        renderer.render(scene, camera);
    } else {
        syncLoop();
    }

    canvas.classList.add('scene-ready');
}
