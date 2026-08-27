import { Metadata } from "next";
export const metadata: Metadata = { title: "FAQ" };
const FAQS = [
  { q: "Are your products safe for sensitive skin?", a: "Yes — all formulations are dermatologist tested and free from harsh chemicals." },
  { q: "Do you offer free delivery?", a: "Free delivery on all orders above ₹999 across India." },
  { q: "What is your return policy?", a: "We offer a 30-day hassle-free return policy for unused products." },
  { q: "Are your products cruelty-free?", a: "Absolutely. We are PETA-certified and never test on animals." },
];
export default function FaqPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="font-display mb-8 text-4xl font-bold text-[var(--foreground)]">FAQ</h1>
      <div className="space-y-4">
        {FAQS.map((faq) => (
          <div key={faq.q} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h3 className="mb-2 font-semibold text-[var(--foreground)]">{faq.q}</h3>
            <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
