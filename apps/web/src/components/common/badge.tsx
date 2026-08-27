import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]",
        accent: "bg-[var(--brand-accent)]/15 text-[var(--brand-accent)]",
        success: "bg-[var(--success)]/10 text-[var(--success)]",
        error: "bg-[var(--error)]/10 text-[var(--error)]",
        outline: "border border-[var(--border)] text-[var(--foreground-muted)]",
        muted: "bg-[var(--surface-muted)] text-[var(--foreground-muted)]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
