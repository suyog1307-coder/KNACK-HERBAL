import type { ApiResponse, PaginatedResponse } from '@knack/shared-types';

// ─── Base client ─────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

let _accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  _accessToken = token;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (_accessToken) {
    headers['Authorization'] = `Bearer ${_accessToken}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, error.message ?? 'Request failed', error);
  }

  return res.json();
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const auth = {
  register: (data: { email: string; password: string; firstName: string; lastName?: string }) =>
    request<{ user: { id: string; email: string; role: string } }>('/auth/register', {
      method: 'POST', body: JSON.stringify(data),
    }),
  login: (data: { email: string; password: string }) =>
    request<{ accessToken: string; refreshToken: string }>('/auth/login', {
      method: 'POST', body: JSON.stringify(data),
    }),
  refresh: (refreshToken: string) =>
    request<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
      method: 'POST', body: JSON.stringify({ refreshToken }),
    }),
  logout: () =>
    request<{ message: string }>('/auth/logout', { method: 'POST' }),
  me: () =>
    request<{ id: string; email: string; firstName: string; role: string }>('/auth/me'),
  sendOtp: (identifier: string, type: 'email' | 'phone') =>
    request<{ message: string }>('/auth/send-otp', {
      method: 'POST', body: JSON.stringify({ identifier, type }),
    }),
  verifyOtp: (data: { email?: string; phone?: string; code: string }) =>
    request<{ verified: boolean }>('/auth/verify-otp', {
      method: 'POST', body: JSON.stringify(data),
    }),
  forgotPassword: (email: string) =>
    request<{ message: string }>('/auth/forgot-password', {
      method: 'POST', body: JSON.stringify({ email }),
    }),
  resetPassword: (data: { token: string; newPassword: string }) =>
    request<{ message: string }>('/auth/reset-password', {
      method: 'POST', body: JSON.stringify(data),
    }),
};

// ─── Products ─────────────────────────────────────────────────────────────────
export const products = {
  list: (params?: Record<string, unknown>) => {
    const qs = params
      ? '?' + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()
      : '';
    return request<unknown[]>(`/products${qs}`);
  },
  search: (params: Record<string, unknown>) => {
    const qs = '?' + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();
    return request<{ items: unknown[]; meta: unknown }>(`/products/search${qs}`);
  },
  get: (id: string) => request<unknown>(`/products/${id}`),
  getBySlug: (slug: string) => request<unknown>(`/products/slug/${slug}`),
};

// ─── Categories ───────────────────────────────────────────────────────────────
export const categories = {
  list: () => request<unknown[]>('/categories'),
  get: (id: string) => request<unknown>(`/categories/${id}`),
};

// ─── Cart ─────────────────────────────────────────────────────────────────────
export const cart = {
  get: () => request<unknown>('/cart'),
  add: (productId: string, quantity = 1) =>
    request<unknown>('/cart/items', {
      method: 'POST', body: JSON.stringify({ productId, quantity }),
    }),
  update: (itemId: string, quantity: number) =>
    request<unknown>(`/cart/items/${itemId}`, {
      method: 'PATCH', body: JSON.stringify({ quantity }),
    }),
  remove: (itemId: string) =>
    request<unknown>(`/cart/items/${itemId}`, { method: 'DELETE' }),
  clear: () => request<unknown>('/cart', { method: 'DELETE' }),
};

// ─── Wishlist ─────────────────────────────────────────────────────────────────
export const wishlist = {
  get: () => request<unknown>('/wishlist'),
  add: (productId: string) =>
    request<unknown>('/wishlist', { method: 'POST', body: JSON.stringify({ productId }) }),
  remove: (productId: string) =>
    request<unknown>(`/wishlist/${productId}`, { method: 'DELETE' }),
  clear: () => request<unknown>('/wishlist', { method: 'DELETE' }),
};

// ─── Orders ───────────────────────────────────────────────────────────────────
export const orders = {
  checkout: (addressId: string) =>
    request<unknown>('/orders/checkout', {
      method: 'POST', body: JSON.stringify({ addressId }),
    }),
  list: () => request<unknown[]>('/orders'),
  get: (id: string) => request<unknown>(`/orders/${id}`),
  cancel: (id: string) =>
    request<unknown>(`/orders/${id}/cancel`, { method: 'POST' }),
  return: (id: string, reason: string) =>
    request<unknown>(`/orders/${id}/return`, {
      method: 'POST', body: JSON.stringify({ reason }),
    }),
};

// ─── Payments ─────────────────────────────────────────────────────────────────
export const payments = {
  createOrder: (orderId: string) =>
    request<unknown>('/payments/create-order', {
      method: 'POST', body: JSON.stringify({ orderId }),
    }),
  verify: (data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) =>
    request<unknown>('/payments/verify', {
      method: 'POST', body: JSON.stringify(data),
    }),
};

// ─── Addresses ────────────────────────────────────────────────────────────────
export const addresses = {
  list: () => request<unknown[]>('/customers/addresses'),
  add: (data: unknown) =>
    request<unknown>('/customers/addresses', {
      method: 'POST', body: JSON.stringify(data),
    }),
  update: (id: string, data: unknown) =>
    request<unknown>(`/customers/addresses/${id}`, {
      method: 'PATCH', body: JSON.stringify(data),
    }),
  remove: (id: string) =>
    request<unknown>(`/customers/addresses/${id}`, { method: 'DELETE' }),
};

// ─── Marketing ────────────────────────────────────────────────────────────────
export const marketing = {
  coupons: {
    apply: (code: string, orderId: string) =>
      request<unknown>('/marketing/coupons/apply', {
        method: 'POST', body: JSON.stringify({ code, orderId }),
      }),
  },
  loyalty: {
    balance: () => request<unknown>('/marketing/loyalty/balance'),
    redeem: (points: number, orderId: string) =>
      request<unknown>('/marketing/loyalty/redeem', {
        method: 'POST', body: JSON.stringify({ points, orderId }),
      }),
  },
  bundles: {
    list: () => request<unknown[]>('/marketing/bundles'),
    get: (slug: string) => request<unknown>(`/marketing/bundles/${slug}`),
  },
  subscriptions: {
    list: () => request<unknown[]>('/marketing/subscriptions'),
    create: (data: unknown) =>
      request<unknown>('/marketing/subscriptions', {
        method: 'POST', body: JSON.stringify(data),
      }),
    cancel: (id: string) =>
      request<unknown>(`/marketing/subscriptions/${id}/cancel`, { method: 'POST' }),
  },
};

// ─── CMS / Support ────────────────────────────────────────────────────────────
export const cms = {
  blogs: {
    list: () => request<unknown[]>('/support/blogs'),
    get: (slug: string) => request<unknown>(`/support/blogs/${slug}`),
  },
  faqs: () => request<unknown[]>('/support/faqs'),
  banners: () => request<unknown[]>('/support/banners'),
  reviews: {
    list: (productId: string) => request<unknown[]>(`/support/reviews/${productId}`),
    create: (data: unknown) =>
      request<unknown>('/support/reviews', {
        method: 'POST', body: JSON.stringify(data),
      }),
  },
  tickets: {
    list: () => request<unknown[]>('/support/tickets'),
    create: (data: unknown) =>
      request<unknown>('/support/tickets', {
        method: 'POST', body: JSON.stringify(data),
      }),
  },
};

export type { ApiResponse, PaginatedResponse };
