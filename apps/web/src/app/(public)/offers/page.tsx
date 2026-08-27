import { Metadata } from "next";
import { ProductCard } from "@/components/product/product-card";
import { mockProducts } from "@/lib/mock-data";
export const metadata: Metadata = { title: "Offers" };
export default function OffersPage() {
  const onSale = mockProducts.filter((p) => p.compareAtPrice);
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display mb-2 text-3xl font-bold text-[var(--foreground)]">Current Offers</h1>
      <p className="mb-8 text-[var(--foreground-muted)]">{onSale.length} products on sale</p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {onSale.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}
