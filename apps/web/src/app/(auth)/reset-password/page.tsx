"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
      <h1 className="font-display mb-1 text-2xl font-bold text-[var(--foreground)]">
        New password
      </h1>
      <p className="mb-6 text-sm text-[var(--foreground-muted)]">
        Choose a strong new password.
      </p>
      <form className="space-y-4">
        <Input label="New Password" type="password" placeholder="Min. 8 characters" required />
        <Input label="Confirm Password" type="password" placeholder="Repeat password" required />
        <Button type="submit" className="w-full">Update Password</Button>
      </form>
    </div>
  );
}
