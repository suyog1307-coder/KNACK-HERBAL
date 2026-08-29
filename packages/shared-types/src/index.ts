// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;
  email: string | null;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// ─── Enums ────────────────────────────────────────────────────────────────────
export type UserRole = 'ADMIN' | 'CUSTOMER' | 'DELIVERY_PARTNER';
export type OrderStatus =
  | 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'PACKED'
  | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED'
  | 'CANCELLED' | 'RETURN_REQUESTED' | 'RETURNED'
  | 'REFUND_PENDING' | 'REFUNDED';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
export type ProductStatus = 'ACTIVE' | 'DRAFT' | 'ARCHIVED';

// ─── API Response wrapper ─────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

// ─── User ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string;
  lastName: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Address ──────────────────────────────────────────────────────────────────
export type AddressType = 'HOME' | 'WORK' | 'OTHER';
export interface Address {
  id: string;
  userId: string;
  type: AddressType;
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

// ─── Product ──────────────────────────────────────────────────────────────────
export interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  isPrimary: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  sku: string;
  stock: number;
  status: ProductStatus;
  categoryId: string;
  category?: Category;
  brandId: string | null;
  brand?: { id: string; name: string } | null;
  images: ProductImage[];
  rating?: number;
  reviewCount?: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────
export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  product: Product;
  quantity: number;
}

export interface Cart {
  id: string;
  userId: string | null;
  items: CartItem[];
}

// ─── Order ────────────────────────────────────────────────────────────────────
export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product: Product;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  items: OrderItem[];
  shippingAddress?: Address;
  createdAt: string;
  updatedAt: string;
}
