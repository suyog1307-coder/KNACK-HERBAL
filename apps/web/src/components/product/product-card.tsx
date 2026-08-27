"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ShoppingCart, Star, Eye } from "lucide-react";
import { useState } from "react";
import { cn, formatPrice, formatDiscount } from "@/lib/utils";
import { useCartStore } from "@/stores/cart.store";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const [wishlisted, setWishlisted] = useState(false);
  const { addItem, openCart } = useCartStore();
  const router = useRouter();

  const primaryImage = product.images.find((i) => i.isPrimary) ?? product.images[0];
  const discount = product.compareAtPrice
    ? formatDiscount(product.compareAtPrice, product.price)
    : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    openCart();
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlisted((w) => !w);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/product/${product.slug}`);
  };

  return (
    <Link
      href={`/product/${product.slug}`}
      className={cn("group block", className)}
    >
      <div className="overflow-hidden rounded-2xl bg-[var(--surface)] border border-[var(--border)] transition-shadow duration-300 hover:shadow-md">

        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-[var(--surface-muted)]">
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={primaryImage.altText ?? product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-4xl">🌿</span>
            </div>
          )}

          {/* Discount badge */}
          {discount && (
            <div className="absolute left-3 top-3">
              <span className="inline-flex items-center rounded-full bg-[var(--brand-accent)]/15 px-2.5 py-0.5 text-xs font-medium text-[var(--brand-accent)]">
                {discount}% OFF
              </span>
            </div>
          )}

          {/* Out of stock overlay */}
          {product.stock === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-800">
                Out of Stock
              </span>
            </div>
          )}

          {/* Action buttons — buttons only, no nested <a> */}
          <div className="absolute right-3 top-3 flex flex-col gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <button
              onClick={handleWishlist}
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm transition-colors hover:bg-[var(--surface-muted)]"
            >
              <Heart
                className={cn(
                  "h-4 w-4 transition-colors",
                  wishlisted
                    ? "fill-red-500 text-red-500"
                    : "text-[var(--foreground-muted)]"
                )}
              />
            </button>

            {/* Quick view — button navigates programmatically, no nested <a> */}
            <button
              onClick={handleQuickView}
              aria-label="Quick view"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm transition-colors hover:bg-[var(--surface-muted)]"
            >
              <Eye className="h-4 w-4 text-[var(--foreground-muted)]" />
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <p className="mb-1 text-xs text-[var(--foreground-muted)]">
            {product.category.name}
          </p>
          <h3 className="mb-2 line-clamp-2 text-sm font-medium leading-snug text-[var(--foreground)]">
            {product.name}
          </h3>

          {/* Rating */}
          {product.rating && (
            <div className="mb-3 flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-3 w-3",
                      i < Math.floor(product.rating!)
                        ? "fill-[var(--brand-accent)] text-[var(--brand-accent)]"
                        : "text-[var(--border)]"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-[var(--foreground-muted)]">
                ({product.reviewCount})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="mb-3 flex items-center gap-2">
            <span className="text-base font-semibold text-[var(--foreground)]">
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice && (
              <span className="text-sm text-[var(--foreground-subtle)] line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>

          {/* Add to cart */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            aria-label={`Add ${product.name} to cart`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--brand-primary)] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[var(--brand-primary-dark)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
          </button>
        </div>
      </div>
    </Link>
  );
}
