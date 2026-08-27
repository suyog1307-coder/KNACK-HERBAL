import { Metadata } from "next";
export const metadata: Metadata = { title: "Privacy Policy" };
export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display mb-6 text-4xl font-bold text-[var(--foreground)]">Privacy Policy</h1>
      <p className="leading-relaxed text-[var(--foreground-muted)]">
        Your privacy matters to us. We collect only the information needed to process your orders and
        improve your experience. We never sell or share your data with third parties for marketing purposes.
      </p>
    </div>
  );
}
