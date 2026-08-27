import { Metadata } from "next";
export const metadata: Metadata = { title: "Contact Us" };
export default function ContactPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <h1 className="font-display mb-6 text-4xl font-bold text-[var(--foreground)]">Contact Us</h1>
      <p className="mb-8 text-[var(--foreground-muted)]">We&apos;d love to hear from you. Reach out via email or the form below.</p>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-[var(--foreground)]">Name</label>
          <input className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--brand-primary)]" placeholder="Your name" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-[var(--foreground)]">Email</label>
          <input type="email" className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--brand-primary)]" placeholder="your@email.com" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-[var(--foreground)]">Message</label>
          <textarea rows={4} className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--brand-primary)]" placeholder="How can we help?" />
        </div>
        <button className="w-full rounded-full bg-[var(--brand-primary)] py-2.5 text-sm font-medium text-white hover:bg-[var(--brand-primary-dark)]">Send Message</button>
      </div>
    </div>
  );
}
