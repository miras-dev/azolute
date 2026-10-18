/**
 * Azolute AI Technologies — Component Loader
 *
 * Loads components/header.html and components/footer.html and injects
 * them into every page. Edit those HTML files to update all pages at once.
 *
 * Active nav state is detected automatically from the current URL.
 */

(function () {

    /* ------------------------------------------------------------------
       SYNCHRONOUS HTML FILE LOADER
       Runs before main.js so all DOM elements exist when GSAP/Swup init.
    ------------------------------------------------------------------ */
    function loadHTML(url) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, false); // false = synchronous
        xhr.send(null);
        return xhr.status === 200 ? xhr.responseText : '';
    }

    /* ------------------------------------------------------------------
       ACTIVE PAGE DETECTION
    ------------------------------------------------------------------ */
    function getActivePage() {
        var file = window.location.pathname.split('/').pop() || 'index.html';
        if (!file || file === 'index.html') return 'home';
        if (file === 'about.html')                               return 'about';
        if (file === 'services.html' || file === 'service.html') return 'services';
        // Match case-studies index and all individual case study slugs
        var caseStudySlugs = [
            'case-studies.html',
            'ai-chatbot-retail.html',
            'workflow-automation-real-estate.html',
            'website-chatbot-healthcare.html',
            'crm-automation-ecommerce.html',
            'lead-capture-bot-consulting.html',
            'ai-support-agent-saas.html'
        ];
        if (caseStudySlugs.indexOf(file) !== -1) return 'case-studies';
        if (file === 'blog.html' || file === 'blog-inner.html') return 'blog';
        if (file === 'contact.html')                             return 'contact';
        if (file === 'publication.html')                         return 'publication';
        return '';
    }

    /* ------------------------------------------------------------------
       MAIN NAVIGATION BUILDER
       Edit the links here to update the nav across all pages.
    ------------------------------------------------------------------ */
    function buildMainNav(activePage) {
        function li(page, label, href, extra) {
            var cls = (extra ? [extra] : []);
            if (activePage === page) cls.push('mil-active');
            var attr = cls.length ? ' class="' + cls.join(' ') + '"' : '';
            return '<li' + attr + '><a href="' + href + '">' + label + '</a>';
        }
        return (
            '<ul>' +
            li('home',         'Home',         'index.html')    + '</li>' +
            li('about',        'About',        'about.html')    + '</li>' +
            li('services',     'Services',     '#.',            'mil-has-children') +
                '<ul>' +
                '<li><a href="services.html">All Services</a></li>' +
                '<li><a href="service.html">Web Development</a></li>' +
                '</ul></li>' +
            li('case-studies', 'Case Studies', '#.',            'mil-has-children') +
                '<ul>' +
                '<li><a href="case-studies.html">All Projects</a></li>' +
                '<li><a href="ai-chatbot-retail.html">AI Chatbot</a></li>' +
                '<li><a href="workflow-automation-real-estate.html">Workflow Automation</a></li>' +
                '</ul></li>' +
            li('blog',         'Blog',         'blog.html')     + '</li>' +
            li('contact',      'Contact',      'contact.html')  + '</li>' +
            '</ul>'
        );
    }

    /* ------------------------------------------------------------------
       FOOTER NAVIGATION BUILDER
    ------------------------------------------------------------------ */
    function buildFooterNav(activePage) {
        function li(page, label, href) {
            var cls = 'mil-up' + (activePage === page ? ' mil-active' : '');
            return '<li class="' + cls + '"><a href="' + href + '">' + label + '</a></li>';
        }
        return (
            '<ul>' +
            li('home',         'Home',         'index.html')       +
            li('about',        'About',        'about.html')       +
            li('services',     'Services',     'services.html')    +
            li('case-studies', 'Case Studies', 'case-studies.html') +
            li('blog',         'Blog',         'blog.html')        +
            li('contact',      'Contact',      'contact.html')     +
            '</ul>'
        );
    }

    /* ------------------------------------------------------------------
       INJECT HEADER
    ------------------------------------------------------------------ */
    function injectHeader() {
        var el = document.getElementById('site-header');
        if (!el) return;
        var html = loadHTML('components/header.html');
        html = html.replace('{{NAV}}', buildMainNav(getActivePage()));
        el.outerHTML = html;
    }

    /* ------------------------------------------------------------------
       INJECT FOOTER
    ------------------------------------------------------------------ */
    function injectFooter() {
        var el = document.getElementById('site-footer');
        if (!el) return;
        var html = loadHTML('components/footer.html');
        html = html.replace('{{FOOTER_NAV}}', buildFooterNav(getActivePage()));
        el.outerHTML = html;
    }

    /* ------------------------------------------------------------------
       UPDATE NAV ACTIVE STATE (used after Swup page transitions)
    ------------------------------------------------------------------ */
    function updateNavActive() {
        var nav = document.getElementById('swupMenu');
        if (nav) nav.innerHTML = buildMainNav(getActivePage());
    }

    /* ------------------------------------------------------------------
       INITIAL INJECTION
       Runs synchronously — header and footer are in the DOM before
       main.js starts so GSAP and Swup find all their elements.
    ------------------------------------------------------------------ */
    injectHeader();
    injectFooter();

    /* ------------------------------------------------------------------
       SWUP RE-INJECTION
       After Swup replaces #swupMain, the footer placeholder from the
       new page's raw HTML is restored — re-inject the footer and
       refresh the nav active state.
    ------------------------------------------------------------------ */
    document.addEventListener('swup:contentReplaced', function () {
        injectFooter();
        updateNavActive();
    });

}());
