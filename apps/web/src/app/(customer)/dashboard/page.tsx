"use client";

import Link from "next/link";
import { Package, Heart, MapPin, Settings, LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { useLogout } from "@/hooks/use-auth";

const MENU = [
  { icon: Package, label: "My Orders", href: "/orders", desc: "Track and manage your orders" },
  { icon: Heart, label: "Wishlist", href: "/wishlist", desc: "Products you love" },
  { icon: MapPin, label: "Addresses", href: "/dashboard/addresses", desc: "Manage delivery addresses" },
  { icon: Settings, label: "Account Settings", href: "/dashboard/settings", desc: "Update your profile" },
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const logout = useLogout();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
          Welcome back, {user?.firstName ?? "Customer"} 👋
        </h1>
        <p className="mt-1 text-[var(--foreground-muted)]">{user?.email}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {MENU.map(({ icon: Icon, label, href, desc }) => (
          <Link key={href} href={href}
            className="flex items-start gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition-shadow hover:shadow-md">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary)]/10">
              <Icon className="h-5 w-5 text-[var(--brand-primary)]" />
            </div>
            <div>
              <p className="font-semibold text-[var(--foreground)]">{label}</p>
              <p className="text-sm text-[var(--foreground-muted)]">{desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <button
        onClick={() => logout.mutate()}
        className="mt-8 flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--error)] transition-colors"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    </div>
  );
}
