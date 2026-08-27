"use client";

import { MapPin, Package, CheckCircle, Clock } from "lucide-react";

const STATS = [
  { label: "Today's Deliveries", value: "8", icon: Package },
  { label: "Completed", value: "5", icon: CheckCircle },
  { label: "Pending", value: "3", icon: Clock },
  { label: "Current Location", value: "Kolhapur", icon: MapPin },
];

export default function DeliveryDashboard() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
          Delivery Dashboard
        </h1>
        <p className="mt-1 text-[var(--foreground-muted)]">Today&apos;s assignments</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {STATS.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <Icon className="mb-2 h-5 w-5 text-[var(--brand-primary)]" />
            <p className="text-2xl font-bold text-[var(--foreground)]">{value}</p>
            <p className="text-sm text-[var(--foreground-muted)]">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="mb-4 font-semibold text-[var(--foreground)]">Pending Deliveries</h2>
        <p className="text-sm text-[var(--foreground-muted)]">
          Delivery assignments will appear here when orders are assigned to you.
        </p>
      </div>
    </div>
  );
}
