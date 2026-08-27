"use client";

import Link from "next/link";
import { useState } from "react";
import { ShoppingCart, User, Search, Menu, X, ChevronDown, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart.store";
import { useAuthStore } from "@/stores/auth.store";
import { useIsMounted } from "@/hooks/use-is-mounted";

const NAV_LINKS = [
  { label: "Shop", href: "/shop" },
  {
    label: "Categories", href: "/categories",
    children: [
      { label: "Face Care", href: "/categories/face-care" },
      { label: "Body Care", href: "/categories/body-care" },
      { label: "Hair Care", href: "/categories/hair-care" },
      { label: "Lip Care", href: "/categories/lip-care" },
      { label: "Sun Care", href: "/categories/sun-care" },
      { label: "Gift Sets", href: "/categories/gift-sets" },
    ],
  },
  { label: "Offers", href: "/offers" },
  { label: "Blog", href: "/blog" },
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const isMounted = useIsMounted();
  const { totalItems, openCart } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const cartCount = totalItems();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-sm">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-primary)]">
            <Leaf className="h-4 w-4 text-white" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-[var(--foreground)]">
            Knack Herbal
          </span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) =>
            link.children ? (
              <li key={link.label} className="relative"
                onMouseEnter={() => setDropdownOpen(link.label)}
                onMouseLeave={() => setDropdownOpen(null)}
              >
                <button className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]">
                  {link.label}
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                {dropdownOpen === link.label && (
                  <div className="absolute left-0 top-full min-w-[180px] rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-lg">
                    {link.children.map((child) => (
                      <Link key={child.href} href={child.href}
                        className="block rounded-lg px-3 py-2 text-sm text-[var(--foreground-muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]">
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            ) : (
              <li key={link.label}>
                <Link href={link.href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]">
                  {link.label}
                </Link>
              </li>
            )
          )}
        </ul>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Link href="/shop" aria-label="Search"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--foreground-muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]">
            <Search className="h-4 w-4" />
          </Link>

          <button onClick={openCart} aria-label={`Cart (${isMounted ? cartCount : 0} items)`}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-[var(--foreground-muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]">
            <ShoppingCart className="h-4 w-4" />
            {isMounted && cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--brand-primary)] text-[10px] font-bold text-white">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </button>

          {isMounted && isAuthenticated ? (
            <Link href={user?.role === "ADMIN" ? "/admin" : "/dashboard"} aria-label="Account"
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--foreground-muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]">
              <User className="h-4 w-4" />
            </Link>
          ) : (
            <Link href="/login" className={cn(buttonVariants({ size: "sm" }), "hidden md:inline-flex")}>
              Sign In
            </Link>
          )}

          <button
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--foreground-muted)] transition-colors hover:bg-[var(--surface-muted)] md:hidden"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}>
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-[var(--border)] bg-[var(--surface)] px-4 py-4 md:hidden">
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <Link href={link.href}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-muted)]"
                  onClick={() => setMenuOpen(false)}>
                  {link.label}
                </Link>
              </li>
            ))}
            {isMounted && !isAuthenticated && (
              <li className="mt-2">
                <Link href="/login" onClick={() => setMenuOpen(false)}
                  className={cn(buttonVariants(), "w-full")}>
                  Sign In
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}
    </header>
  );
}
