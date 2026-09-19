// ============================================
// Shared translation helper for calculator pages.
// Loads the current language dictionary and exposes t(key, fallback, vars)
// for use in dynamically-generated content (fee tables, PDF export, etc).
// Relies on loadLangFile() and getCurrentLang() from i18n.js / main.js.
// ============================================

let CALC_DICT = null;
let CALC_FALLBACK_DICT = null;
let CALC_LANG = 'en';

async function loadCalcDict() {
  CALC_LANG = (typeof getCurrentLang === 'function') ? getCurrentLang() : (window.DEFAULT_LANG || 'en');
  if (typeof loadLangFile === 'function') {
    CALC_DICT = await loadLangFile(CALC_LANG);
    CALC_FALLBACK_DICT = await loadLangFile(window.DEFAULT_LANG || 'en');
  }
}

function getByPathCalc(obj, path) {
  if (!obj) return undefined;
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

// t('mm2hCalc.labelAgencyFee', 'Agency Fee') -> looks up the key in the
// current language dict, falling back to English dict, then to the
// literal fallback string passed in. Supports {placeholder} substitution
// via the optional vars object: t('mm2hCalc.labelVisaFee', '...', {years: 5})
function t(key, fallback, vars) {
  let val = getByPathCalc(CALC_DICT, key);
  if (val === undefined) val = getByPathCalc(CALC_FALLBACK_DICT, key);
  if (val === undefined) val = fallback;
  if (vars) {
    Object.keys(vars).forEach(v => {
      val = val.replace(new RegExp(`\\{${v}\\}`, 'g'), vars[v]);
    });
  }
  return val;
}

// Re-run a callback whenever the language changes (dispatched from main.js).
function onCalcLangChange(callback) {
  document.addEventListener('dcms:langchange', async () => {
    await loadCalcDict();
    callback();
  });
}
