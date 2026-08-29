export type UserRole = 'ADMIN' | 'CUSTOMER' | 'DELIVERY_PARTNER';

export const PERMISSIONS = {
  ADMIN: [
    'products:write', 'products:delete',
    'categories:write', 'categories:delete',
    'orders:read:all', 'orders:write:status',
    'users:read:all', 'users:write',
    'inventory:write',
    'delivery:assign',
    'coupons:write',
    'reports:read',
    'audit:read',
    'tickets:write:status',
    'reviews:approve',
    'blog:write',
    'banners:write',
    'faqs:write',
  ],
  CUSTOMER: [
    'cart:write',
    'orders:read:own', 'orders:create', 'orders:cancel:own',
    'addresses:write',
    'reviews:write:own',
    'tickets:create',
    'subscriptions:write',
  ],
  DELIVERY_PARTNER: [
    'deliveries:read:assigned',
    'deliveries:status:update',
    'deliveries:location:push',
  ],
} as const;

export type Permission =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS][number];

export const hasPermission = (role: UserRole, permission: Permission): boolean =>
  (PERMISSIONS[role] as readonly string[]).includes(permission);

export const isAdmin = (role: UserRole) => role === 'ADMIN';
export const isCustomer = (role: UserRole) => role === 'CUSTOMER';
export const isDeliveryPartner = (role: UserRole) => role === 'DELIVERY_PARTNER';
