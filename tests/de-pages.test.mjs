// Browser checks for the German pages (de/). Serves the repo locally and
// drives Chromium with Playwright (pre-installed). The n8n webhook is routed,
// so nothing is sent anywhere.
// Run: node --test tests/*.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import net from 'node:net';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PAGES = ['de/index.html', 'de/impressum.html', 'de/datenschutz.html'];
const WEBHOOK = 'https://n8n-jrkw.srv2144760.hstgr.cloud/webhook/azolute-rueckruf';

let server, browser, base;

function freePort() {
    return new Promise((resolve) => {
        const s = net.createServer();
        s.listen(0, () => { const { port } = s.address(); s.close(() => resolve(port)); });
    });
}

before(async () => {
    const port = await freePort();
    base = `http://127.0.0.1:${port}/`;
    server = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
    for (let i = 0; i < 50; i++) {
        try { await fetch(base); break; } catch { await new Promise((r) => setTimeout(r, 100)); }
    }
    browser = await chromium.launch();
});

after(async () => {
    await browser?.close();
    server?.kill();
});

async function open(path, opts = {}) {
    const page = await browser.newPage(opts);
    const requests = [];
    page.on('request', (r) => requests.push(r));
    await page.route(WEBHOOK, opts.webhook || ((route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' })));
    const res = await page.goto(base + path, { waitUntil: 'networkidle' });
    assert.equal(res.status(), 200, path);
    return { page, requests };
}

async function fillForm(page) {
    await page.fill('#cbName', 'Max Muster');
    await page.fill('#cbVenue', 'Café Beispiel');
    await page.fill('#cbPhone', '030 1234567');
    await page.fill('#cbEmail', 'max@cafe-beispiel.de');
    await page.fill('#cbTime', 'vormittags');
}

const posts = (requests) => requests.filter((r) => r.url() === WEBHOOK && r.method() === 'POST');

test('loads nothing from other hosts', async () => {
    for (const path of PAGES) {
        const { page, requests } = await open(path);
        const outside = requests.map((r) => new URL(r.url())).filter((u) => u.origin !== new URL(base).origin && u.protocol !== 'data:');
        assert.deepEqual(outside.map(String), [], path);
        await page.close();
    }
});

test('is German, noindex and names no café', async () => {
    for (const path of PAGES) {
        const { page } = await open(path);
        assert.equal(await page.getAttribute('html', 'lang'), 'de', path);
        assert.equal(await page.getAttribute('meta[name="robots"]', 'content'), 'noindex, nofollow', path);
        const text = await page.textContent('body');
        assert.ok(!/Toasty|Turtle/i.test(text), path);
        await page.close();
    }
    const { page } = await open('de/index.html');
    const text = await page.textContent('body');
    for (const s of ['199', '990', 'ab März 2027']) assert.ok(text.includes(s), s);
    await page.close();
});

test('no sideways scroll on a phone', async () => {
    for (const path of PAGES) {
        const { page } = await open(path, { viewport: { width: 360, height: 800 } });
        const [sw, cw] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
        assert.ok(sw <= cw, `${path}: scrollWidth ${sw} > clientWidth ${cw}`);
        await page.close();
    }
});

test('sends one complete request', async () => {
    const { page, requests } = await open('de/index.html');
    await fillForm(page);
    await page.check('#cbConsent');
    await page.dblclick('#callbackForm button[type="submit"]');
    await page.waitForSelector('#callbackSuccess:not([hidden])');
    const sent = posts(requests);
    assert.equal(sent.length, 1);
    const body = JSON.parse(sent[0].postData());
    const label = (await page.textContent('#cbConsentText')).replace(/\s+/g, ' ').trim();
    assert.equal(body.consent, true);
    assert.equal(body.consent_text, label);
    assert.equal(body.source, 'de-booking-desk');
    assert.equal(body.name, 'Max Muster');
    await page.close();
});

test('blocks without consent', async () => {
    const { page, requests } = await open('de/index.html');
    await fillForm(page);
    await page.press('#cbEmail', 'Enter');
    await page.waitForTimeout(300);
    assert.equal(posts(requests).length, 0);
    assert.ok((await page.textContent('#callbackStatus')).trim().length > 0);
    assert.equal(await page.getAttribute('#cbConsent', 'aria-invalid'), 'true');
    await page.close();
});

test('keeps the form when the webhook fails', async () => {
    const { page } = await open('de/index.html', { webhook: (route) => route.abort() });
    await fillForm(page);
    await page.check('#cbConsent');
    await page.click('#callbackForm button[type="submit"]');
    await page.waitForFunction(() => document.getElementById('callbackStatus').textContent.includes('miras@azolute.one'));
    assert.equal(await page.inputValue('#cbName'), 'Max Muster');
    assert.equal(await page.isEnabled('#callbackForm button[type="submit"]'), true);
    await page.close();
});

// ---- Final-review fixes ----

test('internal links work without clean URLs', async () => {
    // CloudFront serves S3 without index rewriting: "./" and "/de/" return 403.
    for (const path of PAGES) {
        const { page } = await open(path);
        const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')));
        const bare = hrefs.filter((h) => /^\.\/(#.*)?$/.test(h) || /^\/de\/?(#.*)?$/.test(h));
        assert.deepEqual(bare, [], path);
        await page.close();
    }
});

test('the form never puts details in the address', async () => {
    const { page } = await open('de/index.html');
    assert.equal((await page.getAttribute('#callbackForm', 'method') || '').toLowerCase(), 'post');
    await page.close();
});

test('promises no confirmation email and no inbox', async () => {
    const { page } = await open('de/index.html');
    const text = await page.textContent('body');
    assert.ok(!/E-Mail unterwegs|Bestätigung per E-Mail/.test(text), 'confirmation email promised');
    assert.ok(!/Posteingang/.test(text), 'inbox promised');
    await page.close();
});

test('makes no blanket claim that all data stays in the EU', async () => {
    const { page } = await open('de/index.html');
    const text = await page.textContent('body');
    assert.ok(!/Verarbeitung in der EU|in der EU verarbeitet/.test(text));
    await page.close();
    const ds = await open('de/datenschutz.html');
    assert.ok((await ds.page.textContent('body')).includes('Drittländer'));
    await ds.page.close();
});

test('headlines are not hyphenated', async () => {
    const { page } = await open('de/index.html', { viewport: { width: 360, height: 800 } });
    for (const sel of ['h1', 'h2']) {
        assert.equal(await page.$eval(sel, (el) => getComputedStyle(el).hyphens), 'manual', sel);
    }
    await page.close();
});
