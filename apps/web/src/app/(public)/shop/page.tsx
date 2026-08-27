import { Metadata } from "next";
import { ProductCard } from "@/components/product/product-card";
import { mockProducts } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Shop" };

export default function ShopPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
          All Products
        </h1>
        <p className="mt-1 text-[var(--foreground-muted)]">
          {mockProducts.length} products
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {mockProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
