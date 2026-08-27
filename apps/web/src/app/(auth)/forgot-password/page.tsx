"use client";

import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
      <h1 className="font-display mb-1 text-2xl font-bold text-[var(--foreground)]">
        Reset password
      </h1>
      <p className="mb-6 text-sm text-[var(--foreground-muted)]">
        Enter your email and we&apos;ll send a reset link.
      </p>

      {submitted ? (
        <div className="rounded-xl bg-[var(--success)]/10 px-4 py-4 text-sm text-[var(--success)]">
          ✓ Check your inbox for a password reset link.
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="space-y-4">
          <Input label="Email" type="email" autoComplete="email" placeholder="you@example.com" required />
          <Button type="submit" className="w-full">Send Reset Link</Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-[var(--foreground-muted)]">
        <Link href="/login" className="font-medium text-[var(--brand-primary)] hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
