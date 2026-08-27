import { Metadata } from "next";
export const metadata: Metadata = { title: "About Us" };
export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display mb-6 text-4xl font-bold text-[var(--foreground)]">Our Story</h1>
      <p className="mb-4 leading-relaxed text-[var(--foreground-muted)]">
        Knack Herbal was born from a simple belief — that your skin deserves honesty. We started
        as a small family business crafting handmade herbal formulations rooted in Ayurvedic
        wisdom, and have grown into a brand trusted by thousands across India.
      </p>
      <p className="leading-relaxed text-[var(--foreground-muted)]">
        Every product is made with full ingredient transparency, ethically sourced botanicals, and
        a deep respect for your skin and the planet.
      </p>
    </div>
  );
}
