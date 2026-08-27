import type { Product, Category } from "@/types";

// Fixed ISO dates — avoids server/client hydration mismatch from new Date()
const CREATED = "2026-01-01T00:00:00.000Z";

// Placeholder images via picsum (no local files needed during development)
const img = (seed: number) =>
  `https://picsum.photos/seed/knack${seed}/400/400`;

export const mockCategories: Category[] = [
  { id: "1", name: "Face Care",  slug: "face-care",  description: "Nourish your skin",        parentId: null },
  { id: "2", name: "Body Care",  slug: "body-care",  description: "Head to toe care",          parentId: null },
  { id: "3", name: "Hair Care",  slug: "hair-care",  description: "Strengthen & shine",        parentId: null },
  { id: "4", name: "Lip Care",   slug: "lip-care",   description: "Soft & supple lips",        parentId: null },
  { id: "5", name: "Sun Care",   slug: "sun-care",   description: "UV protection",             parentId: null },
  { id: "6", name: "Gift Sets",  slug: "gift-sets",  description: "Curated collections",       parentId: null },
];

export const mockProducts: Product[] = [
  {
    id: "1", name: "Goat Milk Moisturising Lotion", slug: "goat-milk-lotion",
    description: "Rich, creamy lotion with goat milk and shea butter for deep hydration.",
    price: 849, compareAtPrice: 999, sku: "KH-BDY-001", stock: 50, status: "ACTIVE",
    categoryId: "2", category: mockCategories[1], brandId: null, brand: null,
    images: [{ id: "i1", url: img(1), altText: "Goat Milk Lotion", isPrimary: true }],
    rating: 4.8, reviewCount: 124,
    createdAt: CREATED, updatedAt: CREATED,
  },
  {
    id: "2", name: "Aloe Vera Gel Moisturiser", slug: "aloe-vera-gel",
    description: "Lightweight gel with pure aloe vera for oily & combination skin.",
    price: 649, compareAtPrice: 799, sku: "KH-FC-001", stock: 80, status: "ACTIVE",
    categoryId: "1", category: mockCategories[0], brandId: null, brand: null,
    images: [{ id: "i2", url: img(2), altText: "Aloe Vera Gel", isPrimary: true }],
    rating: 4.6, reviewCount: 89,
    createdAt: CREATED, updatedAt: CREATED,
  },
  {
    id: "3", name: "Rosehip Brightening Serum", slug: "rosehip-serum",
    description: "Vitamin C rich rosehip serum for a luminous, even complexion.",
    price: 1299, compareAtPrice: 1599, sku: "KH-FC-002", stock: 35, status: "ACTIVE",
    categoryId: "1", category: mockCategories[0], brandId: null, brand: null,
    images: [{ id: "i3", url: img(3), altText: "Rosehip Serum", isPrimary: true }],
    rating: 4.9, reviewCount: 203,
    createdAt: CREATED, updatedAt: CREATED,
  },
  {
    id: "4", name: "Coconut Hair Growth Oil", slug: "coconut-hair-oil",
    description: "Cold-pressed coconut oil blended with herbal extracts for thick, lustrous hair.",
    price: 599, compareAtPrice: 749, sku: "KH-HR-001", stock: 120, status: "ACTIVE",
    categoryId: "3", category: mockCategories[2], brandId: null, brand: null,
    images: [{ id: "i4", url: img(4), altText: "Coconut Hair Oil", isPrimary: true }],
    rating: 4.7, reviewCount: 167,
    createdAt: CREATED, updatedAt: CREATED,
  },
  {
    id: "5", name: "Turmeric Glow Face Mask", slug: "turmeric-face-mask",
    description: "Weekly clay mask with turmeric and sandalwood to unclog pores and brighten.",
    price: 499, compareAtPrice: null, sku: "KH-FC-003", stock: 60, status: "ACTIVE",
    categoryId: "1", category: mockCategories[0], brandId: null, brand: null,
    images: [{ id: "i5", url: img(5), altText: "Turmeric Face Mask", isPrimary: true }],
    rating: 4.5, reviewCount: 76,
    createdAt: CREATED, updatedAt: CREATED,
  },
  {
    id: "6", name: "Shea Butter Lip Balm", slug: "shea-lip-balm",
    description: "Intensive lip repair with shea butter and vitamin E.",
    price: 199, compareAtPrice: 249, sku: "KH-LP-001", stock: 200, status: "ACTIVE",
    categoryId: "4", category: mockCategories[3], brandId: null, brand: null,
    images: [{ id: "i6", url: img(6), altText: "Lip Balm", isPrimary: true }],
    rating: 4.8, reviewCount: 312,
    createdAt: CREATED, updatedAt: CREATED,
  },
  {
    id: "7", name: "SPF 50 Sunscreen Gel", slug: "sunscreen-gel-spf50",
    description: "Broad spectrum UVA/UVB protection with a non-greasy matte finish.",
    price: 749, compareAtPrice: 899, sku: "KH-SUN-001", stock: 90, status: "ACTIVE",
    categoryId: "5", category: mockCategories[4], brandId: null, brand: null,
    images: [{ id: "i7", url: img(7), altText: "Sunscreen", isPrimary: true }],
    rating: 4.6, reviewCount: 145,
    createdAt: CREATED, updatedAt: CREATED,
  },
  {
    id: "8", name: "Argan Oil Hair Serum", slug: "argan-hair-serum",
    description: "Lightweight serum that tames frizz and adds brilliant shine.",
    price: 799, compareAtPrice: 999, sku: "KH-HR-002", stock: 45, status: "ACTIVE",
    categoryId: "3", category: mockCategories[2], brandId: null, brand: null,
    images: [{ id: "i8", url: img(8), altText: "Argan Hair Serum", isPrimary: true }],
    rating: 4.7, reviewCount: 98,
    createdAt: CREATED, updatedAt: CREATED,
  },
];

export const featuredProducts = mockProducts.slice(0, 4);
export const bestSellers   = mockProducts.slice(2, 6);
