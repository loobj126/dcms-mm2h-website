// ============================================
// DCMS (MM2H) — i18n engine
// Elements marked with data-i18n="key.path" get their text replaced.
// Elements marked with data-i18n-attr="placeholder:key.path|title:key2.path"
// get the given attribute replaced instead of textContent.
// Falls back to English for any missing key.
// ============================================

const I18N_CACHE = {};

async function loadLangFile(code) {
  if (I18N_CACHE[code]) return I18N_CACHE[code];
  // Prefer the embedded data (works under file:// and http://) over fetch,
  // since fetch() to local JSON files is blocked by browsers under file://.
  if (window.I18N_DATA && window.I18N_DATA[code]) {
    I18N_CACHE[code] = window.I18N_DATA[code];
    return window.I18N_DATA[code];
  }
  try {
    const base = window.I18N_BASE || 'assets/data/i18n/';
    const res = await fetch(`${base}${code}.json`);
    if (!res.ok) throw new Error('not found');
    const data = await res.json();
    I18N_CACHE[code] = data;
    return data;
  } catch (e) {
    return null;
  }
}

function getByPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

async function applyTranslations(code) {
  const fallback = await loadLangFile(DEFAULT_LANG);
  let dict = await loadLangFile(code);
  if (!dict) dict = fallback;

  document.documentElement.setAttribute('lang', code);

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    let val = getByPath(dict, key);
    if (val === undefined) val = getByPath(fallback, key);
    if (val !== undefined) el.textContent = val;
  });

  document.querySelectorAll('[data-i18n-attr]').forEach(el => {
    const spec = el.getAttribute('data-i18n-attr'); // e.g. "placeholder:form.namePlaceholder"
    spec.split('|').forEach(pair => {
      const [attr, key] = pair.split(':');
      let val = getByPath(dict, key);
      if (val === undefined) val = getByPath(fallback, key);
      if (val !== undefined) el.setAttribute(attr, val);
    });
  });

  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    let val = getByPath(dict, key);
    if (val === undefined) val = getByPath(fallback, key);
    if (val !== undefined) el.innerHTML = val;
  });
}

window.applyTranslations = applyTranslations;
