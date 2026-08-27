import Link from "next/link";
import { mockCategories } from "@/lib/mock-data";

const CATEGORY_EMOJIS: Record<string, string> = {
  "face-care": "✨",
  "body-care": "🌸",
  "hair-care": "💆",
  "lip-care": "💋",
  "sun-care": "☀️",
  "gift-sets": "🎁",
};

export function ShopByCategory() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="mb-10 text-center">
        <h2 className="font-display mb-2 text-2xl font-bold text-[var(--foreground)] sm:text-3xl">
          Shop by Category
        </h2>
        <p className="text-[var(--foreground-muted)]">
          Find the perfect routine for your skin
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {mockCategories.map((cat) => (
          <Link
            key={cat.id}
            href={`/categories/${cat.slug}`}
            className="group flex flex-col items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center transition-all duration-200 hover:border-[var(--brand-primary)]/30 hover:shadow-md"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface-muted)] text-2xl transition-transform duration-200 group-hover:scale-110">
              {CATEGORY_EMOJIS[cat.slug] ?? "🌿"}
            </div>
            <span className="text-xs font-medium leading-snug text-[var(--foreground)]">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
