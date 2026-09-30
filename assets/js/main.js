// ============================================
// DCMS (MM2H) — main.js
// Handles: language switcher, mobile nav, FAQ accordion
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  initLanguageSwitcher();
  initMobileNav();
  initFaq();
  initImageReveal();
  initVisitorCounter();
});

/* ---------------- Language switcher ---------------- */
// A brand-new visitor (nothing stored yet) always sees English first.
// Once someone picks a language, it's remembered via sessionStorage so
// clicking between pages (Home, About Us, Services, etc.) keeps that
// choice — sessionStorage clears itself when the browser tab/window is
// closed, so the next fresh visit still starts in English.
function getCurrentLang() {
  return sessionStorage.getItem('dcms_lang') || DEFAULT_LANG;
}

function setCurrentLang(code) {
  sessionStorage.setItem('dcms_lang', code);
}

function initLanguageSwitcher() {
  const switches = document.querySelectorAll('.lang-switch');

  switches.forEach(sw => {
    const btn = sw.querySelector('.lang-current');
    const menu = sw.querySelector('.lang-menu');
    if (!btn || !menu) return;

    // Attach the open/close toggle exactly once per button — this listener
    // must NOT be re-added on every language switch, or clicks stop working
    // (each extra listener toggles the class again, cancelling itself out).
    if (!btn.dataset.bound) {
      btn.dataset.bound = 'true';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        sw.classList.toggle('open');
      });
    }
  });

  // Close any open dropdown when clicking elsewhere — also bound once.
  if (!document.body.dataset.langOutsideClickBound) {
    document.body.dataset.langOutsideClickBound = 'true';
    document.addEventListener('click', () => {
      switches.forEach(sw => sw.classList.remove('open'));
    });
  }

  refreshLanguageSwitcherUI();
}

// Rebuilds the current-language label/flag and the dropdown options.
// Safe to call repeatedly (e.g. after switching language) since it only
// touches menu.innerHTML, never re-binds the persistent button listeners.
function refreshLanguageSwitcherUI() {
  const switches = document.querySelectorAll('.lang-switch');
  const current = getCurrentLang();
  const currentLangObj = SITE_LANGUAGES.find(l => l.code === current) || SITE_LANGUAGES[0];

  switches.forEach(sw => {
    const btn = sw.querySelector('.lang-current');
    const menu = sw.querySelector('.lang-menu');
    if (!btn || !menu) return;

    const flagEl = btn.querySelector('.flag-circle');
    const labelEl = btn.querySelector('.lang-label');
    if (flagEl) flagEl.textContent = currentLangObj.flag;
    if (labelEl) labelEl.textContent = currentLangObj.code.toUpperCase();

    menu.innerHTML = '';
    SITE_LANGUAGES.forEach(lang => {
      const opt = document.createElement('button');
      opt.className = 'lang-option';
      opt.type = 'button';
      opt.setAttribute('aria-current', lang.code === current ? 'true' : 'false');
      opt.innerHTML = `<span class="flag-circle">${lang.flag}</span><span>${lang.label}</span>`;
      opt.addEventListener('click', () => {
        setCurrentLang(lang.code);
        if (window.applyTranslations) {
          window.applyTranslations(lang.code);
        }
        document.dispatchEvent(new CustomEvent('dcms:langchange', { detail: { code: lang.code } }));
        sw.classList.remove('open');
        refreshLanguageSwitcherUI();
      });
      menu.appendChild(opt);
    });
  });

  if (window.applyTranslations) {
    window.applyTranslations(current);
  }

  // Reveal the page now that translations (if any) have been applied —
  // pairs with the early inline script in <head> that hides it.
  document.documentElement.classList.remove('i18n-pending');
}

/* ---------------- Mobile nav ---------------- */
function initMobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  const closeBtn = document.querySelector('.mobile-nav-close');
  if (!toggle || !mobileNav) return;

  toggle.addEventListener('click', () => mobileNav.classList.add('open'));
  if (closeBtn) closeBtn.addEventListener('click', () => mobileNav.classList.remove('open'));
}

/* ---------------- FAQ accordion ---------------- */
function initFaq() {
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    if (!q) return;
    q.addEventListener('click', () => {
      const wasOpen = item.classList.contains('open');
      item.closest('.faq-list').querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });
}

/* ---------------- Scroll reveal animation for photos ---------------- */
function initImageReveal() {
  const images = document.querySelectorAll('.reveal-img');
  if (!images.length) return;

  if (!('IntersectionObserver' in window)) {
    // Fallback for very old browsers: just show the images immediately.
    images.forEach(img => img.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  images.forEach(img => {
    // If the image is already in view on page load (e.g. hero photo), reveal
    // it immediately rather than waiting for a scroll event that may never come.
    const rect = img.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      img.classList.add('is-visible');
    } else {
      observer.observe(img);
    }
  });
}

// ============================================
// Visitor counter (CounterAPI v2) — shows a site-wide "Total Visitors"
// figure in the footer. Increments once per browser session (not once
// per page view), then just displays the current total on further
// page loads within the same session.
// ============================================
function initVisitorCounter() {
  const el = document.getElementById('total-visitor-count');
  if (!el) return;

  const WORKSPACE = 'dcmsgroup';
  const COUNTER = 'totalvisitor';
  const API_KEY = 'ut_kekBlq88DVmi20ygxFpVRXJTPwvvT9G6ZGbhkCEz';
  const BASE = `https://api.counterapi.dev/v2/${WORKSPACE}/${COUNTER}`;
  const SESSION_KEY = 'dcms_visitor_counted';

  function extractCount(json) {
    if (!json) return null;
    const d = json.data || json;
    const candidates = [d.up_count, d.count, d.value, d.total];
    for (const c of candidates) {
      if (typeof c === 'number') return c;
    }
    return null;
  }

  function display(n) {
    if (typeof n === 'number' && !isNaN(n)) {
      el.textContent = n.toLocaleString();
    }
  }

  const alreadyCounted = sessionStorage.getItem(SESSION_KEY);
  const url = alreadyCounted ? BASE : `${BASE}/up`;

  fetch(url, {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  })
    .then(res => (res.ok ? res.json() : null))
    .then(json => {
      const n = extractCount(json);
      if (n !== null) {
        display(n);
        sessionStorage.setItem(SESSION_KEY, '1');
      }
    })
    .catch(() => { /* silently leave placeholder if the counter is unreachable */ });
}
