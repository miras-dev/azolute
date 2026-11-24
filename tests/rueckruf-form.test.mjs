// Unit tests for the German call-back form logic (js/rueckruf-form.js).
// Run: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { validateCallback, buildCallbackPayload } = require('../js/rueckruf-form.js');

const complete = {
    name: 'Max Muster',
    venue: 'Café Beispiel',
    phone: '030 1234567',
    email: 'max@cafe-beispiel.de',
    bestTime: 'vormittags',
    message: '',
    consent: true
};

test('accepts a complete request', () => {
    assert.deepEqual(validateCallback(complete), { ok: true, errors: [] });
});

test('requires name, venue, phone, email and consent', () => {
    const empty = { name: '', venue: '', phone: '', email: '', bestTime: '', message: '', consent: false };
    assert.deepEqual(validateCallback(empty).errors, ['name', 'venue', 'phone', 'email', 'consent']);
});

test('accepts German phone formats', () => {
    for (const phone of ['030 1234567', '+49 (0)30 123 45 67', '0171/1234567', '+4930123456']) {
        assert.equal(validateCallback({ ...complete, phone }).ok, true, phone);
    }
});

test('rejects non-phones', () => {
    for (const phone of ['12', 'abc', '+49']) {
        assert.ok(validateCallback({ ...complete, phone }).errors.includes('phone'), phone);
    }
});

test('rejects a bad email', () => {
    assert.ok(validateCallback({ ...complete, email: 'max@cafe' }).errors.includes('email'));
});

test('bestTime and message are optional', () => {
    assert.equal(validateCallback({ ...complete, bestTime: '', message: '' }).ok, true);
});

test('builds the payload', () => {
    const now = '2026-11-24T10:00:00.000Z';
    const p = buildCallbackPayload({ ...complete, name: '  Max  ' }, 'Ich bin einverstanden …', now, '/de/');
    assert.deepEqual(Object.keys(p).sort(), [
        'best_time', 'consent', 'consent_at', 'consent_text', 'email', 'lang', 'message',
        'name', 'page', 'phone', 'source', 'submittedAt', 'venue'
    ]);
    assert.equal(p.name, 'Max');
    assert.equal(p.consent, true);
    assert.equal(p.consent_text, 'Ich bin einverstanden …');
    assert.equal(p.consent_at, now);
    assert.equal(p.submittedAt, now);
    assert.equal(p.lang, 'de');
    assert.equal(p.source, 'de-booking-desk');
    assert.equal(p.page, '/de/');
});
