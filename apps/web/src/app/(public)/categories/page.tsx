import { Metadata } from "next";
import Link from "next/link";
import { mockCategories } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Categories" };

const EMOJIS: Record<string, string> = {
  "face-care": "✨", "body-care": "🌸", "hair-care": "💆",
  "lip-care": "💋", "sun-care": "☀️", "gift-sets": "🎁",
};

export default function CategoriesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display mb-8 text-3xl font-bold text-[var(--foreground)]">
        Categories
      </h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {mockCategories.map((cat) => (
          <Link
            key={cat.id}
            href={`/categories/${cat.slug}`}
            className="group flex flex-col items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center transition-all hover:border-[var(--brand-primary)]/40 hover:shadow-md"
          >
            <span className="text-4xl transition-transform group-hover:scale-110">
              {EMOJIS[cat.slug] ?? "🌿"}
            </span>
            <span className="font-medium text-[var(--foreground)]">{cat.name}</span>
            {cat.description && (
              <span className="text-xs text-[var(--foreground-muted)]">
                {cat.description}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
