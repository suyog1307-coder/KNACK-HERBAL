// ─── App ──────────────────────────────────────────────────────────────────────
export const APP_NAME = 'Knack Herbal';
export const APP_TAGLINE = 'Pure. Natural. Effective.';
export const APP_URL = 'https://knackherbal.com';
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

// ─── Pricing ──────────────────────────────────────────────────────────────────
export const GST_RATE = 0.18;
export const FREE_DELIVERY_THRESHOLD = 999;
export const STANDARD_DELIVERY_CHARGE = 50;
export const LOYALTY_POINT_VALUE = 0.25; // 1 point = ₹0.25

// ─── Pagination ───────────────────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY_DAYS = 7;
export const OTP_EXPIRY_MINUTES = 10;
export const BCRYPT_ROUNDS = 10;

// ─── Order ────────────────────────────────────────────────────────────────────
export const CANCELLABLE_STATUSES = ['PENDING', 'CONFIRMED'] as const;
export const ORDER_NUMBER_PREFIX = 'KH-ORD';

// ─── Upload ───────────────────────────────────────────────────────────────────
export const MAX_FILE_SIZE_MB = 5;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// ─── Razorpay ─────────────────────────────────────────────────────────────────
export const RAZORPAY_CURRENCY = 'INR';
