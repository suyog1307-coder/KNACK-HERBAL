import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import type { Product } from "@/types";

interface FeaturedProductsProps {
  title: string;
  subtitle?: string;
  products: Product[];
  viewAllHref?: string;
}

export function FeaturedProducts({
  title,
  subtitle,
  products,
  viewAllHref = "/shop",
}: FeaturedProductsProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <h2 className="font-display mb-1 text-2xl font-bold text-[var(--foreground)] sm:text-3xl">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[var(--foreground-muted)]">{subtitle}</p>
          )}
        </div>
        <Link
          href={viewAllHref}
          className="flex items-center gap-1 text-sm font-medium text-[var(--brand-primary)] transition-colors hover:text-[var(--brand-primary-dark)]"
        >
          View All
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
