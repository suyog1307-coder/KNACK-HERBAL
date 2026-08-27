import { Metadata } from "next";
export const metadata: Metadata = { title: "Terms of Service" };
export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display mb-6 text-4xl font-bold text-[var(--foreground)]">Terms of Service</h1>
      <p className="leading-relaxed text-[var(--foreground-muted)]">
        By using Knack Herbal you agree to these terms. Products are subject to availability.
        Prices may change without notice. Full terms available on request.
      </p>
    </div>
  );
}
