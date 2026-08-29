// ─── Email ────────────────────────────────────────────────────────────────────
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── Phone ────────────────────────────────────────────────────────────────────
/** Validates Indian mobile numbers (10 digits, optionally prefixed with +91 or 0) */
export function isValidIndianPhone(phone: string): boolean {
  return /^(\+91|0)?[6-9]\d{9}$/.test(phone.replace(/\s/g, ''));
}

// ─── Password ─────────────────────────────────────────────────────────────────
export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
  suggestions: string[];
}

export function checkPasswordStrength(password: string): PasswordStrength {
  let score = 0;
  const suggestions: string[] = [];

  if (password.length >= 8) score++;
  else suggestions.push('Use at least 8 characters');

  if (/[A-Z]/.test(password)) score++;
  else suggestions.push('Add uppercase letters');

  if (/[0-9]/.test(password)) score++;
  else suggestions.push('Add numbers');

  if (/[^A-Za-z0-9]/.test(password)) score++;
  else suggestions.push('Add special characters (e.g. @, #, !)');

  const labels: PasswordStrength['label'][] = [
    'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong',
  ];

  return { score: score as PasswordStrength['score'], label: labels[score], suggestions };
}

// ─── Pincode ──────────────────────────────────────────────────────────────────
export function isValidPincode(pin: string): boolean {
  return /^[1-9][0-9]{5}$/.test(pin);
}

// ─── GST Number ───────────────────────────────────────────────────────────────
export function isValidGSTIN(gstin: string): boolean {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin);
}

// ─── Generic ──────────────────────────────────────────────────────────────────
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && isFinite(value) && value > 0;
}
