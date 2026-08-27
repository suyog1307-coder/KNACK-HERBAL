"use client";

import { Button } from "@/components/ui/button";

export default function VerifyOtpPage() {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm text-center">
      <h1 className="font-display mb-1 text-2xl font-bold text-[var(--foreground)]">
        Verify OTP
      </h1>
      <p className="mb-6 text-sm text-[var(--foreground-muted)]">
        Enter the 6-digit code sent to your phone.
      </p>
      <div className="mb-6 flex justify-center gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <input
            key={i}
            maxLength={1}
            className="h-12 w-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-center text-lg font-bold outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20"
          />
        ))}
      </div>
      <Button className="w-full">Verify</Button>
      <p className="mt-4 text-sm text-[var(--foreground-muted)]">
        Didn&apos;t receive a code?{" "}
        <button className="font-medium text-[var(--brand-primary)] hover:underline">
          Resend
        </button>
      </p>
    </div>
  );
}
