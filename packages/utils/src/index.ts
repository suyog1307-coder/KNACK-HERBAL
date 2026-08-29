// ─── Currency ─────────────────────────────────────────────────────────────────
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

// ─── Date ─────────────────────────────────────────────────────────────────────
export function formatDate(date: string | Date, locale = 'en-IN'): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date, locale = 'en-IN'): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function isExpired(date: string | Date): boolean {
  return new Date(date) < new Date();
}

// ─── String ───────────────────────────────────────────────────────────────────
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function truncate(text: string, maxLength: number, ellipsis = '...'): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - ellipsis.length) + ellipsis;
}

export function initials(firstName: string, lastName?: string | null): string {
  const f = firstName.charAt(0).toUpperCase();
  const l = lastName ? lastName.charAt(0).toUpperCase() : '';
  return f + l;
}

// ─── Number ───────────────────────────────────────────────────────────────────
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// ─── Array ────────────────────────────────────────────────────────────────────
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce<Record<string, T[]>>((acc, item) => {
    const group = String(item[key]);
    acc[group] = acc[group] ?? [];
    acc[group].push(item);
    return acc;
  }, {});
}

export function uniqueBy<T>(array: T[], key: keyof T): T[] {
  const seen = new Set<unknown>();
  return array.filter((item) => {
    const val = item[key];
    if (seen.has(val)) return false;
    seen.add(val);
    return true;
  });
}

// ─── URL ──────────────────────────────────────────────────────────────────────
export function buildQueryString(params: Record<string, unknown>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      qs.set(key, String(value));
    }
  }
  const str = qs.toString();
  return str ? `?${str}` : '';
}
