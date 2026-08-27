import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Navbar } from "@/components/navigation/navbar";
import { Footer } from "@/components/layout/footer";
import { CartDrawer } from "@/components/cart/cart-drawer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Knack Herbal — Natural Skincare",
    template: "%s | Knack Herbal",
  },
  description:
    "Handcrafted herbal skincare made with clean, natural ingredients. Cruelty-free, dermatologist tested, made in India.",
  keywords: ["herbal skincare", "natural beauty", "ayurvedic", "cruelty-free"],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Knack Herbal",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-[var(--background)] text-[var(--foreground)]">
        <QueryProvider>
          <AnnouncementBar />
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
        </QueryProvider>
      </body>
    </html>
  );
}
