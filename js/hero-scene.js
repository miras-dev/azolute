/**
 * Azolute AI Technologies, Three.js hero scene
 *
 * Mounts a WebGL scene on any <canvas data-scene> element:
 *   data-scene="full"     , wireframe geometry cluster + particle field (homepage)
 *   data-scene="particles", lighter particle field only (inner pages)
 *
 * Respects prefers-reduced-motion (renders a single static frame),
 * pauses when the tab is hidden or the canvas is scrolled out of view,
 * and fails silently if WebGL is unavailable (CSS orbs remain).
 */

import * as THREE from './vendor/three.module.min.js';

const ACCENT = new THREE.Color('#8050f0');
const ACCENT_SOFT = new THREE.Color('#a78bfa');
const BLUE = new THREE.Color('#5e8bff');

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function createParticles(count, radius) {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const seeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
        // distribute in a flattened sphere shell
        const r = radius * (0.35 + 0.65 * Math.cbrt(Math.random()));
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.cos(phi) * 0.55;
        positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) * 0.6 - radius * 0.2;

        const c = Math.random() < 0.75 ? ACCENT_SOFT : BLUE;
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
        seeds[i] = Math.random() * Math.PI * 2;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
        size: 0.045,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });

    const points = new THREE.Points(geo, mat);
    points.userData.seeds = seeds;
    points.userData.basePositions = positions.slice();
    return points;
}

function createWireCluster() {
    const group = new THREE.Group();

    const mats = {
        strong: new THREE.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.55 }),
        soft: new THREE.LineBasicMaterial({ color: ACCENT_SOFT, transparent: true, opacity: 0.28 }),
        blue: new THREE.LineBasicMaterial({ color: BLUE, transparent: true, opacity: 0.22 })
    };

    function wire(geometry, material) {
        return new THREE.LineSegments(new THREE.EdgesGeometry(geometry), material);
    }

    const dodeca = wire(new THREE.DodecahedronGeometry(1.5), mats.strong);
    group.add(dodeca);

    const icosa = wire(new THREE.IcosahedronGeometry(0.85), mats.soft);
    group.add(icosa);

    const octa = wire(new THREE.OctahedronGeometry(0.34), mats.blue);
    octa.position.set(2.3, 0.7, -0.4);
    group.add(octa);

    const octa2 = wire(new THREE.OctahedronGeometry(0.22), mats.soft);
    octa2.position.set(-2.5, -0.9, -0.8);
    group.add(octa2);

    group.userData = { dodeca, icosa, octa, octa2 };
    return group;
}

function mountScene(canvas) {
    const variant = canvas.dataset.scene || 'particles';
    let renderer;

    try {
        renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: true,
            powerPreference: 'low-power'
        });
    } catch (e) {
        canvas.remove();
        return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 60);
    camera.position.set(0, 0, 7);

    const isSmall = window.matchMedia('(max-width: 760px)').matches;

    const particles = createParticles(
        variant === 'full' ? (isSmall ? 450 : 900) : (isSmall ? 250 : 500),
        variant === 'full' ? 9 : 8
    );
    scene.add(particles);

    let cluster = null;
    if (variant === 'full') {
        cluster = createWireCluster();
        cluster.position.set(isSmall ? 0 : 2.4, isSmall ? 1.8 : 0.4, 0);
        if (isSmall) cluster.scale.setScalar(0.65);
        scene.add(cluster);
    }

    // --- sizing ---
    function resize() {
        const host = canvas.parentElement;
        if (!host) return;
        const w = host.clientWidth;
        const h = host.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    // --- pointer parallax ---
    const target = { x: 0, y: 0 };
    const eased = { x: 0, y: 0 };

    if (!reducedMotion) {
        window.addEventListener('pointermove', (e) => {
            target.x = (e.clientX / window.innerWidth) * 2 - 1;
            target.y = (e.clientY / window.innerHeight) * 2 - 1;
        }, { passive: true });
    }

    // --- visibility gating ---
    let inView = true;
    let running = false;
    let rafId = 0;

    const io = ('IntersectionObserver' in window)
        ? new IntersectionObserver((entries) => {
            inView = entries[0].isIntersecting;
            syncLoop();
        }, { threshold: 0 })
        : null;
    if (io) io.observe(canvas);

    document.addEventListener('visibilitychange', syncLoop);

    const clock = new THREE.Clock();

    function frame() {
        rafId = requestAnimationFrame(frame);
        const t = clock.getElapsedTime();

        eased.x += (target.x - eased.x) * 0.04;
        eased.y += (target.y - eased.y) * 0.04;

        // particle drift
        const pos = particles.geometry.attributes.position;
        const base = particles.userData.basePositions;
        const seeds = particles.userData.seeds;
        for (let i = 0; i < seeds.length; i++) {
            const s = seeds[i];
            pos.array[i * 3 + 1] = base[i * 3 + 1] + Math.sin(t * 0.35 + s) * 0.22;
            pos.array[i * 3] = base[i * 3] + Math.cos(t * 0.22 + s) * 0.14;
        }
        pos.needsUpdate = true;

        particles.rotation.y = t * 0.02 + eased.x * 0.12;
        particles.rotation.x = eased.y * 0.08;

        if (cluster) {
            const u = cluster.userData;
            u.dodeca.rotation.x = t * 0.1;
            u.dodeca.rotation.y = t * 0.14;
            u.icosa.rotation.x = -t * 0.18;
            u.icosa.rotation.y = -t * 0.12;
            u.octa.rotation.y = t * 0.4;
            u.octa.position.y = 0.7 + Math.sin(t * 0.6) * 0.25;
            u.octa2.rotation.x = t * 0.5;
            u.octa2.position.y = -0.9 + Math.cos(t * 0.5) * 0.2;
            cluster.rotation.y = eased.x * 0.25;
            cluster.rotation.x = eased.y * 0.18;
        }

        renderer.render(scene, camera);
    }

    function syncLoop() {
        const shouldRun = inView && !document.hidden && !reducedMotion;
        if (shouldRun && !running) {
            running = true;
            clock.start();
            frame();
        } else if (!shouldRun && running) {
            running = false;
            cancelAnimationFrame(rafId);
        }
    }

    if (reducedMotion) {
        renderer.render(scene, camera); // single static frame
    } else {
        syncLoop();
    }

    canvas.classList.add('scene-ready');
}

document.querySelectorAll('canvas[data-scene]').forEach(mountScene);
