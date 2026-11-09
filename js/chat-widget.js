/**
 * Azolute AI Technologies, floating demo cluster
 *
 * Renders the WhatsApp click-to-chat button and the AI chat widget
 * (launcher + panel). Everything is driven by window.AZOLUTE_CONFIG in
 * js/site-config.js; with both features disabled this file renders
 * nothing at all.
 *
 * The chat POSTs { sessionId, message, page } as JSON to the configured
 * n8n webhook (docs/n8n/azolute-site-chat.json) and expects { reply }.
 * Any error, timeout or unexpected shape degrades to a polite fallback
 * message; the site never depends on n8n being up.
 */

(function () {
    'use strict';

    var CFG = window.AZOLUTE_CONFIG || {};
    var WA = CFG.whatsapp || {};
    var CHAT = CFG.chat || {};

    var waEnabled = !!(WA.enabled && WA.number);
    var chatEnabled = !!(CHAT.enabled && CHAT.webhookUrl);
    if (!waEnabled && !chatEnabled) return;

    var FALLBACK = 'Chat is napping right now. Email miras@azolute.one and Miras will reply personally.';
    var GREETING = 'Hi, I’m Azolute’s AI assistant, the same kind we install for clients. Ask me what the ecosystem could automate in your business.';

    function track(name, params) {
        if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
    }

    /* ---------- icons ---------- */
    var ICON_WA = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2a9.9 9.9 0 0 0-8.57 14.86L2 22l5.3-1.39A9.9 9.9 0 1 0 12.04 2zm0 1.8a8.1 8.1 0 1 1-4.1 15.1l-.3-.17-3.05.8.81-2.97-.19-.31A8.1 8.1 0 0 1 12.04 3.8zm-3.3 3.95c-.18 0-.47.07-.72.34-.24.27-.94.92-.94 2.24s.97 2.6 1.1 2.78c.14.18 1.9 3.03 4.7 4.13 2.32.92 2.8.74 3.3.69.5-.04 1.62-.66 1.85-1.3.23-.64.23-1.19.16-1.3-.07-.12-.25-.19-.52-.32-.27-.14-1.62-.8-1.87-.9-.25-.08-.43-.13-.61.14-.18.27-.7.89-.86 1.07-.16.18-.32.2-.59.07-.27-.14-1.15-.42-2.2-1.36a8.2 8.2 0 0 1-1.51-1.88c-.16-.27-.02-.42.12-.56.12-.12.27-.32.4-.48.14-.16.19-.27.28-.45.09-.18.04-.34-.02-.48-.07-.14-.6-1.46-.83-2-.22-.52-.44-.45-.61-.46l-.53-.01z"/></svg>';
    var ICON_CHAT = '<svg class="ic ic-chat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-8 8H5l-2 2V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8z"/><path d="M9 11h.01M13 11h.01M17 11h.01"/></svg>';
    var ICON_CLOSE = '<svg class="ic ic-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    var ICON_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    var ICON_SPARK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/><circle cx="12" cy="12" r="3.2"/></svg>';
    var ICON_SEND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg>';

    /* ---------- floating cluster ---------- */
    var cluster = document.createElement('div');
    cluster.className = 'fab-cluster';

    if (waEnabled) {
        var wa = document.createElement('a');
        wa.className = 'fab fab-wa';
        wa.href = 'https://wa.me/' + String(WA.number).replace(/\D/g, '') +
            (WA.prefill ? '?text=' + encodeURIComponent(WA.prefill) : '');
        wa.target = '_blank';
        wa.rel = 'noopener';
        wa.setAttribute('aria-label', 'Chat with Azolute on WhatsApp');
        wa.title = 'Chat on WhatsApp';
        wa.innerHTML = ICON_WA;
        wa.addEventListener('click', function () { track('whatsapp_click', { page: location.pathname }); });
        cluster.appendChild(wa);
    }

    var launcher = null;
    if (chatEnabled) {
        launcher = document.createElement('button');
        launcher.type = 'button';
        launcher.className = 'fab fab-chat';
        launcher.setAttribute('aria-haspopup', 'dialog');
        launcher.setAttribute('aria-expanded', 'false');
        launcher.setAttribute('aria-controls', 'azChatPanel');
        launcher.setAttribute('aria-label', 'Open the Azolute AI assistant');
        launcher.innerHTML = ICON_CHAT + ICON_CLOSE;
        cluster.appendChild(launcher);

        var caption = document.createElement('p');
        caption.className = 'fab-caption';
        caption.innerHTML = '<strong>This assistant is the product.</strong> Yours would know your business.';
        cluster.appendChild(caption);
    }

    document.body.appendChild(cluster);
    if (!chatEnabled) return;

    /* ---------- chat panel ---------- */
    var panel = document.createElement('div');
    panel.className = 'az-chat';
    panel.id = 'azChatPanel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Azolute AI assistant');
    panel.innerHTML =
        '<div class="az-chat-head">' +
            '<span class="az-chat-ava" aria-hidden="true">' + ICON_SPARK + '</span>' +
            '<div>' +
                '<div class="az-chat-title">Azolute assistant</div>' +
                '<div class="az-chat-sub">AI, answering from approved information only</div>' +
            '</div>' +
            '<button type="button" class="az-chat-close" aria-label="Close chat">' + ICON_X + '</button>' +
        '</div>' +
        '<div class="az-chat-log" role="log" aria-live="polite"></div>' +
        '<form class="az-chat-form">' +
            '<input type="text" name="message" autocomplete="off" maxlength="600" placeholder="Ask about the ecosystem…" aria-label="Your message">' +
            '<button type="submit" class="az-chat-send" aria-label="Send message">' + ICON_SEND + '</button>' +
        '</form>' +
        '<p class="az-chat-foot">This assistant is the product. Yours would know your business.</p>';
    document.body.appendChild(panel);

    var log = panel.querySelector('.az-chat-log');
    var form = panel.querySelector('.az-chat-form');
    var input = form.querySelector('input');
    var sendBtn = form.querySelector('.az-chat-send');
    var closeBtn = panel.querySelector('.az-chat-close');

    var open = false;
    var greeted = false;
    var pending = false;
    var typingEl = null;

    function sessionId() {
        try {
            var id = sessionStorage.getItem('az-chat-session');
            if (!id) {
                id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
                    : 'az-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
                sessionStorage.setItem('az-chat-session', id);
            }
            return id;
        } catch (e) {
            return 'az-' + Date.now();
        }
    }

    function scrollLog() { log.scrollTop = log.scrollHeight; }

    function appendMsg(role, text, isErr) {
        var el = document.createElement('div');
        el.className = 'az-msg ' + role + (isErr ? ' err' : '');
        el.textContent = text; /* textContent: replies are rendered as plain text */
        log.appendChild(el);
        scrollLog();
        return el;
    }

    function showTyping() {
        if (typingEl) return;
        typingEl = document.createElement('div');
        typingEl.className = 'az-typing';
        typingEl.setAttribute('aria-label', 'Assistant is typing');
        typingEl.innerHTML = '<span></span><span></span><span></span>';
        log.appendChild(typingEl);
        scrollLog();
    }

    function hideTyping() {
        if (typingEl && typingEl.parentNode) typingEl.parentNode.removeChild(typingEl);
        typingEl = null;
    }

    function pickReply(data) {
        if (Array.isArray(data)) data = data[0] || {};
        if (!data || typeof data !== 'object') return null;
        var r = data.reply || data.output || data.text || data.answer;
        return (typeof r === 'string' && r.trim()) ? r.trim() : null;
    }

    function send(text) {
        pending = true;
        sendBtn.disabled = true;
        appendMsg('user', text);
        showTyping();
        track('chat_message_sent', { page: location.pathname });

        var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
        var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 25000) : null;

        fetch(CHAT.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: sessionId(), message: text, page: location.pathname }),
            signal: ctrl ? ctrl.signal : undefined
        }).then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        }).then(function (data) {
            hideTyping();
            var reply = pickReply(data);
            if (reply) appendMsg('bot', reply);
            else appendMsg('bot', FALLBACK, true);
        }).catch(function () {
            hideTyping();
            appendMsg('bot', FALLBACK, true);
        }).then(function () {
            if (timer) clearTimeout(timer);
            pending = false;
            sendBtn.disabled = false;
            if (open) input.focus();
        });
    }

    function setOpen(next) {
        if (next === open) return;
        open = next;
        panel.classList.toggle('open', open);
        launcher.setAttribute('aria-expanded', open ? 'true' : 'false');
        launcher.setAttribute('aria-label', open ? 'Close the Azolute AI assistant' : 'Open the Azolute AI assistant');
        if (open) {
            if (!greeted) { greeted = true; appendMsg('bot', GREETING); }
            input.focus();
            track('chat_open', { page: location.pathname });
        } else {
            launcher.focus();
        }
    }

    launcher.addEventListener('click', function () { setOpen(!open); });
    closeBtn.addEventListener('click', function () { setOpen(false); });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && open) setOpen(false);
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var text = input.value.trim();
        if (!text || pending) return;
        input.value = '';
        send(text);
    });
})();
