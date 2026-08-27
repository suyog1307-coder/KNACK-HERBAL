import Link from "next/link";
import { ArrowRight, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[var(--surface-muted)] via-[var(--surface)] to-[var(--surface)]">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:py-36">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--brand-primary)]/20 bg-[var(--brand-primary)]/5 px-4 py-1.5 text-xs font-medium text-[var(--brand-primary)]">
            <Leaf className="h-3.5 w-3.5" />
            100% Natural · Cruelty Free · Dermatologist Tested
          </div>

          {/* Heading */}
          <h1 className="font-display mb-6 text-4xl font-bold leading-tight tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl">
            Natural Care.{" "}
            <span className="text-[var(--brand-primary)]">Beautiful Skin.</span>
            <br />
            Every Day.
          </h1>

          {/* Subheading */}
          <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-[var(--foreground-muted)]">
            Handcrafted herbal skincare made with clean ingredients sourced straight
            from nature. No parabens. No sulphates. Just results.
          </p>

          {/* CTAs — use Link styled with buttonVariants, no asChild needed */}
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/shop"
              className={cn(buttonVariants({ size: "lg" }), "inline-flex items-center gap-2")}
            >
              Shop Now
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/about"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              Our Story
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-[var(--foreground-subtle)]">
            {[
              "50,000+ Happy Customers",
              "200+ Natural Ingredients",
              "Free Delivery ₹999+",
              "30-Day Returns",
            ].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <span className="text-[var(--brand-primary)]">✓</span>
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Decorative blobs */}
      <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[var(--brand-primary)]/5 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[var(--brand-accent)]/10 blur-3xl" />
    </section>
  );
}
