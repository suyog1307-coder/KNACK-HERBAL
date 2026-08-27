"use client";

import Link from "next/link";
import Image from "next/image";
import { X, ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import { useCartStore } from "@/stores/cart.store";
import { buttonVariants } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useIsMounted } from "@/hooks/use-is-mounted";

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalPrice } =
    useCartStore();
  const isMounted = useIsMounted();
  const total = totalPrice();

  // Don't render on the server or before hydration — persisted cart is client-only
  if (!isMounted || !isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={closeCart}
        aria-hidden="true"
      />

      <aside
        role="dialog"
        aria-label="Shopping cart"
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-[var(--surface)] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-[var(--brand-primary)]" />
            <span className="font-semibold text-[var(--foreground)]">
              Cart ({items.length})
            </span>
          </div>
          <button
            onClick={closeCart}
            aria-label="Close cart"
            className="rounded-full p-1.5 text-[var(--foreground-muted)] transition-colors hover:bg-[var(--surface-muted)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <span className="text-5xl">🛒</span>
              <p className="text-sm text-[var(--foreground-muted)]">
                Your cart is empty
              </p>
              <Link
                href="/shop"
                onClick={closeCart}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {items.map((item) => {
                const image = item.product.images.find((i) => i.isPrimary);
                return (
                  <li
                    key={item.id}
                    className="flex gap-3 rounded-xl border border-[var(--border)] p-3"
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[var(--surface-muted)]">
                      {image ? (
                        <Image
                          src={image.url}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-2xl">
                          🌿
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-2 text-sm font-medium leading-snug text-[var(--foreground)]">
                          {item.product.name}
                        </p>
                        <button
                          onClick={() => removeItem(item.id)}
                          aria-label="Remove item"
                          className="shrink-0 text-[var(--foreground-subtle)] transition-colors hover:text-[var(--error)]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 rounded-full border border-[var(--border)] px-1">
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            aria-label="Decrease quantity"
                            className="flex h-6 w-6 items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="min-w-[1.5rem] text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            aria-label="Increase quantity"
                            className="flex h-6 w-6 items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="text-sm font-semibold text-[var(--foreground)]">
                          {formatPrice(item.product.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="space-y-3 border-t border-[var(--border)] px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--foreground-muted)]">
                Subtotal
              </span>
              <span className="font-semibold text-[var(--foreground)]">
                {formatPrice(total)}
              </span>
            </div>
            <p className="text-xs text-[var(--foreground-subtle)]">
              {total >= 999
                ? "✓ Free delivery applied"
                : `Add ${formatPrice(999 - total)} more for free delivery`}
            </p>
            <Link
              href="/checkout"
              onClick={closeCart}
              className={buttonVariants() + " w-full justify-center"}
            >
              Proceed to Checkout
            </Link>
            <Link
              href="/shop"
              onClick={closeCart}
              className={
                buttonVariants({ variant: "outline" }) + " w-full justify-center"
              }
            >
              Continue Shopping
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
