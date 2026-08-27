import { Metadata } from "next";
import { notFound } from "next/navigation";
import { mockProducts } from "@/lib/mock-data";
import { ProductCard } from "@/components/product/product-card";
import { formatPrice, formatDiscount } from "@/lib/utils";
import { ShoppingCart, Star, Shield, Truck, RefreshCw } from "lucide-react";

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = mockProducts.find((p) => p.slug === slug);
  return { title: p?.name ?? "Product" };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = mockProducts.find((p) => p.slug === slug);
  if (!product) notFound();

  const related = mockProducts
    .filter((p) => p.categoryId === product.categoryId && p.id !== product.id)
    .slice(0, 4);

  const discount = product.compareAtPrice
    ? formatDiscount(product.compareAtPrice, product.price)
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Product detail */}
      <div className="grid gap-10 lg:grid-cols-2">
        {/* Image */}
        <div className="aspect-square rounded-2xl bg-[var(--surface-muted)] flex items-center justify-center text-8xl">
          🌿
        </div>

        {/* Info */}
        <div>
          <p className="mb-2 text-sm text-[var(--foreground-muted)]">
            {product.category.name}
          </p>
          <h1 className="font-display mb-4 text-3xl font-bold text-[var(--foreground)]">
            {product.name}
          </h1>

          {product.rating && (
            <div className="mb-4 flex items-center gap-2">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < Math.floor(product.rating!) ? "fill-[var(--brand-accent)] text-[var(--brand-accent)]" : "text-[var(--border)]"}`}
                  />
                ))}
              </div>
              <span className="text-sm text-[var(--foreground-muted)]">
                {product.rating} ({product.reviewCount} reviews)
              </span>
            </div>
          )}

          <div className="mb-6 flex items-center gap-3">
            <span className="text-3xl font-bold text-[var(--foreground)]">
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice && (
              <>
                <span className="text-lg text-[var(--foreground-subtle)] line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
                <span className="rounded-full bg-[var(--brand-accent)]/15 px-2 py-0.5 text-sm font-medium text-[var(--brand-accent)]">
                  {discount}% OFF
                </span>
              </>
            )}
          </div>

          <p className="mb-6 leading-relaxed text-[var(--foreground-muted)]">
            {product.description}
          </p>

          <button className="mb-6 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--brand-primary)] py-3 text-white font-medium transition-colors hover:bg-[var(--brand-primary-dark)]">
            <ShoppingCart className="h-5 w-5" />
            Add to Cart
          </button>

          <div className="grid grid-cols-3 gap-4 rounded-2xl bg-[var(--surface-muted)] p-4">
            {[
              { icon: Truck, label: "Free Delivery", sub: "Orders ₹999+" },
              { icon: RefreshCw, label: "Easy Returns", sub: "30-day policy" },
              { icon: Shield, label: "Authentic", sub: "100% genuine" },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex flex-col items-center gap-1 text-center">
                <Icon className="h-5 w-5 text-[var(--brand-primary)]" />
                <span className="text-xs font-medium text-[var(--foreground)]">{label}</span>
                <span className="text-[10px] text-[var(--foreground-muted)]">{sub}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="font-display mb-6 text-2xl font-bold text-[var(--foreground)]">
            You May Also Like
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
