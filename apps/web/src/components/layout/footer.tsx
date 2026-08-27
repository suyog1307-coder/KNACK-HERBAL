import Link from "next/link";
import { Leaf, Globe, Share2, Rss, Mail } from "lucide-react";

const FOOTER_LINKS = {
  Shop: [
    { label: "All Products", href: "/shop" },
    { label: "Face Care", href: "/categories/face-care" },
    { label: "Body Care", href: "/categories/body-care" },
    { label: "Hair Care", href: "/categories/hair-care" },
    { label: "Gift Sets", href: "/categories/gift-sets" },
    { label: "Offers", href: "/offers" },
  ],
  Company: [
    { label: "About Us", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Careers", href: "/careers" },
    { label: "Press", href: "/press" },
  ],
  Support: [
    { label: "FAQ", href: "/faq" },
    { label: "Contact Us", href: "/contact" },
    { label: "Shipping Policy", href: "/shipping" },
    { label: "Returns", href: "/returns" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
  ],
};

const SOCIAL = [
  { icon: Globe, label: "Website", href: "https://knackherbal.com" },
  { icon: Share2, label: "Social", href: "https://instagram.com" },
  { icon: Rss, label: "Blog RSS", href: "/blog/rss" },
  { icon: Mail, label: "Newsletter", href: "/newsletter" },
];

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-primary)]">
                <Leaf className="h-4 w-4 text-white" />
              </div>
              <span className="font-display text-base font-bold text-[var(--foreground)]">
                Knack Herbal
              </span>
            </Link>
            <p className="mb-6 text-sm leading-relaxed text-[var(--foreground-muted)]">
              Natural skincare rooted in herbal wisdom. Clean ingredients, honest
              formulations, beautiful results.
            </p>
            <div className="flex gap-3">
              {SOCIAL.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-[var(--foreground-muted)] transition-colors hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
                >
                  <Icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[var(--foreground)]">
                {title}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[var(--border)] pt-6 sm:flex-row">
          <p className="text-xs text-[var(--foreground-subtle)]">
            © {new Date().getFullYear()} Knack Herbal. All rights reserved.
          </p>
          <p className="text-xs text-[var(--foreground-subtle)]">
            Made with 🌿 in India
          </p>
        </div>
      </div>
    </footer>
  );
}
