import type { ReactNode } from "react";
import Link from "next/link";
import { Leaf } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--surface-muted)] px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand-primary)]">
          <Leaf className="h-5 w-5 text-white" />
        </div>
        <span className="font-display text-xl font-bold text-[var(--foreground)]">
          Knack Herbal
        </span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
