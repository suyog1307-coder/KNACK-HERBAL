"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <section className="bg-[var(--brand-primary)] py-16">
      <div className="mx-auto max-w-xl px-4 text-center sm:px-6">
        <h2 className="font-display mb-3 text-2xl font-bold text-white sm:text-3xl">
          Join the Knack Family
        </h2>
        <p className="mb-8 text-sm leading-relaxed text-white/80">
          Subscribe for skincare tips, early access to new launches, and
          exclusive discounts. No spam — ever.
        </p>

        {submitted ? (
          <div className="rounded-2xl bg-white/10 px-6 py-4 text-white">
            🎉 Welcome! Check your inbox for a 15% discount code.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              className="h-11 flex-1 rounded-full border-0 bg-white px-5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] outline-none focus:ring-2 focus:ring-white/50"
            />
            <Button
              type="submit"
              variant="accent"
              className="shrink-0"
            >
              Subscribe
            </Button>
          </form>
        )}

        <p className="mt-4 text-xs text-white/60">
          By subscribing you agree to our Privacy Policy. Unsubscribe anytime.
        </p>
      </div>
    </section>
  );
}
