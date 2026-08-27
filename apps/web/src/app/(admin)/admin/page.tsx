"use client";

import { BarChart3, Package, Users, ShoppingCart, TrendingUp } from "lucide-react";

const STATS = [
  { label: "Total Revenue", value: "₹2,45,800", change: "+12%", icon: TrendingUp },
  { label: "Orders Today", value: "48", change: "+8%", icon: ShoppingCart },
  { label: "Products", value: "124", change: "+3", icon: Package },
  { label: "Customers", value: "3,241", change: "+24", icon: Users },
];

export default function AdminDashboard() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
            Admin Dashboard
          </h1>
          <p className="mt-1 text-[var(--foreground-muted)]">Knack Herbal Operations</p>
        </div>
        <span className="rounded-full bg-[var(--brand-primary)]/10 px-3 py-1 text-sm font-medium text-[var(--brand-primary)]">
          Admin
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map(({ label, value, change, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-[var(--foreground-muted)]">{label}</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-primary)]/10">
                <Icon className="h-4 w-4 text-[var(--brand-primary)]" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[var(--foreground)]">{value}</p>
            <p className="mt-1 text-xs text-[var(--success)]">{change} this week</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="mb-4 font-semibold text-[var(--foreground)]">Recent Orders</h2>
          <div className="flex items-center justify-center py-8 text-[var(--foreground-subtle)]">
            <BarChart3 className="mr-2 h-5 w-5" />
            <span className="text-sm">Order data will appear here</span>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="mb-4 font-semibold text-[var(--foreground)]">Top Products</h2>
          <div className="flex items-center justify-center py-8 text-[var(--foreground-subtle)]">
            <Package className="mr-2 h-5 w-5" />
            <span className="text-sm">Product data will appear here</span>
          </div>
        </div>
      </div>
    </div>
  );
}
