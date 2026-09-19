// ============================================
// Shared validation utilities
// - Email: must match a standard user@domain.tld pattern (requires '@')
// - Phone: only digits allowed (optional leading +), stripped live as the user types
// ============================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(value) {
  return EMAIL_REGEX.test((value || '').trim());
}

function isValidPhone(value) {
  const cleaned = (value || '').trim();
  // Allow an optional leading +, followed by 7-15 digits
  return /^\+?[0-9]{7,15}$/.test(cleaned);
}

/**
 * Restricts a phone input to digits and an optional leading '+', live as the user types.
 */
function attachPhoneNumericFilter(inputEl) {
  if (!inputEl) return;
  inputEl.addEventListener('input', () => {
    const hasPlus = inputEl.value.trim().startsWith('+');
    let digits = inputEl.value.replace(/[^0-9]/g, '');
    inputEl.value = hasPlus ? '+' + digits : digits;
  });
}

/**
 * Shows/hides an inline error message under a field.
 * errorEl: the small <p> or <span> element used to display the message.
 */
function setFieldError(inputEl, errorEl, message) {
  if (!inputEl || !errorEl) return;
  if (message) {
    inputEl.classList.add('field-invalid');
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  } else {
    inputEl.classList.remove('field-invalid');
    errorEl.textContent = '';
    errorEl.style.display = 'none';
  }
}

/**
 * Validates an email field on blur/input and shows an inline error if invalid.
 * Empty values are treated as valid unless `required` is true.
 */
function attachEmailValidation(inputEl, errorEl, required) {
  if (!inputEl || !errorEl) return;
  const check = () => {
    const val = inputEl.value.trim();
    if (!val) {
      setFieldError(inputEl, errorEl, required ? 'Email address is required.' : '');
      return !required;
    }
    if (!isValidEmail(val)) {
      setFieldError(inputEl, errorEl, 'Please enter a valid email address (must include "@").');
      return false;
    }
    setFieldError(inputEl, errorEl, '');
    return true;
  };
  inputEl.addEventListener('blur', check);
  inputEl.addEventListener('input', () => {
    if (inputEl.classList.contains('field-invalid')) check();
  });
  return check;
}

/**
 * Validates a phone field on blur/input and shows an inline error if invalid.
 * Empty values are treated as valid unless `required` is true.
 */
function attachPhoneValidation(inputEl, errorEl, required) {
  if (!inputEl || !errorEl) return;
  attachPhoneNumericFilter(inputEl);
  const check = () => {
    const val = inputEl.value.trim();
    if (!val) {
      setFieldError(inputEl, errorEl, required ? 'Phone number is required.' : '');
      return !required;
    }
    if (!isValidPhone(val)) {
      setFieldError(inputEl, errorEl, 'Please enter a valid phone number (numbers only).');
      return false;
    }
    setFieldError(inputEl, errorEl, '');
    return true;
  };
  inputEl.addEventListener('blur', check);
  inputEl.addEventListener('input', () => {
    if (inputEl.classList.contains('field-invalid')) check();
  });
  return check;
}
