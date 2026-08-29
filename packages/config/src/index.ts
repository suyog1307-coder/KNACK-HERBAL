// ─── Environment helpers ──────────────────────────────────────────────────────
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction  = process.env.NODE_ENV === 'production';
export const isTest        = process.env.NODE_ENV === 'test';

// ─── API ──────────────────────────────────────────────────────────────────────
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

// ─── App ──────────────────────────────────────────────────────────────────────
export const APP_NAME    = 'Knack Herbal';
export const APP_TAGLINE = 'Pure. Natural. Effective.';
export const APP_URL     = process.env.NEXT_PUBLIC_APP_URL ?? 'https://knackherbal.com';

// ─── Feature flags ────────────────────────────────────────────────────────────
export const features = {
  /** Enable Razorpay payments (requires keys to be set) */
  payments:      isProduction || !!process.env.RAZORPAY_KEY_ID,
  /** Enable WhatsApp/SMS OTP via Twilio */
  smsOtp:        !!process.env.TWILIO_ACCOUNT_SID,
  /** Enable email delivery via SMTP */
  email:         !!process.env.SMTP_HOST,
  /** Enable Redis caching layer */
  redis:         !!process.env.REDIS_URL,
} as const;

// ─── Pagination defaults ──────────────────────────────────────────────────────
export const pagination = {
  defaultPageSize: 20,
  maxPageSize:     100,
} as const;

// ─── Image ───────────────────────────────────────────────────────────────────
export const uploads = {
  maxFileSizeMB:   5,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'] as string[],
} as const;
