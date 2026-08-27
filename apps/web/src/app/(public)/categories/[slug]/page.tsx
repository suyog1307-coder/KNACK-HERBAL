import { Metadata } from "next";
import { mockCategories, mockProducts } from "@/lib/mock-data";
import { ProductCard } from "@/components/product/product-card";
import { notFound } from "next/navigation";

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = mockCategories.find((c) => c.slug === slug);
  return { title: cat?.name ?? "Category" };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const cat = mockCategories.find((c) => c.slug === slug);
  if (!cat) notFound();

  const products = mockProducts.filter((p) => p.category.slug === slug);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
          {cat.name}
        </h1>
        {cat.description && (
          <p className="mt-1 text-[var(--foreground-muted)]">{cat.description}</p>
        )}
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      ) : (
        <div className="py-20 text-center text-[var(--foreground-muted)]">
          No products in this category yet.
        </div>
      )}
    </div>
  );
}
