import { HeroSection } from "@/components/layout/hero-section";
import { ShopByCategory } from "@/components/layout/shop-by-category";
import { FeaturedProducts } from "@/components/layout/featured-products";
import { WhyKnack } from "@/components/layout/why-knack";
import { Newsletter } from "@/components/layout/newsletter";
import { featuredProducts, bestSellers } from "@/lib/mock-data";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ShopByCategory />
      <FeaturedProducts
        title="Featured Products"
        subtitle="Handpicked favourites loved by our community"
        products={featuredProducts}
      />
      <WhyKnack />
      <FeaturedProducts
        title="Best Sellers"
        subtitle="Our most loved products of all time"
        products={bestSellers}
        viewAllHref="/shop?sort=popular"
      />
      <Newsletter />
    </>
  );
}
