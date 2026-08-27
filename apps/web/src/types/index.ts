// ── Auth ──────────────────────────────────────────────────────────────────

export type Role = "CUSTOMER" | "ADMIN" | "DELIVERY_PARTNER";

export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string;
  lastName: string | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ── Product ───────────────────────────────────────────────────────────────

export type ProductStatus = "ACTIVE" | "DRAFT" | "ARCHIVED";

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

export interface Brand {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
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
  category: Category;
  brandId: string | null;
  brand: Brand | null;
  images: ProductImage[];
  rating?: number;
  reviewCount?: number;
  createdAt: string;
  updatedAt: string;
}

// ── Cart ──────────────────────────────────────────────────────────────────

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

// ── Order ─────────────────────────────────────────────────────────────────

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "PACKED"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURN_REQUESTED"
  | "RETURNED"
  | "REFUND_PENDING"
  | "REFUNDED";

export interface OrderItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

// ── API Response ──────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
