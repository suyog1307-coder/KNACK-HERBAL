import { Metadata } from "next";
export const metadata: Metadata = { title: "Blog" };
export default function BlogPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <h1 className="font-display mb-4 text-4xl font-bold text-[var(--foreground)]">Skincare Blog</h1>
      <p className="text-[var(--foreground-muted)]">Expert tips, ingredient guides, and skincare routines. Coming soon.</p>
    </div>
  );
}
