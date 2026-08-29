import { PrismaClient, Role, ProductStatus, AddressType } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:student@localhost:5433/knack_herbal?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  // ─── Admin User ─────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin@123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@knackherbal.com' },
    update: {},
    create: {
      email: 'admin@knackherbal.com',
      passwordHash: adminHash,
      firstName: 'Knack',
      lastName: 'Admin',
      role: Role.ADMIN,
    },
  });
  console.log(`✅ Admin: ${admin.email}`);

  // ─── Customer User ───────────────────────────────────────────────────────────
  const customerHash = await bcrypt.hash('Customer@123', 10);
  const customer = await prisma.user.upsert({
    where: { email: 'customer@knackherbal.com' },
    update: {},
    create: {
      email: 'customer@knackherbal.com',
      passwordHash: customerHash,
      firstName: 'Test',
      lastName: 'Customer',
      role: Role.CUSTOMER,
    },
  });
  console.log(`✅ Customer: ${customer.email}`);

  // ─── Delivery Partner ────────────────────────────────────────────────────────
  const partnerHash = await bcrypt.hash('Partner@123', 10);
  const partner = await prisma.user.upsert({
    where: { email: 'partner@knackherbal.com' },
    update: {},
    create: {
      email: 'partner@knackherbal.com',
      passwordHash: partnerHash,
      firstName: 'Ravi',
      lastName: 'Delivery',
      role: Role.DELIVERY_PARTNER,
      deliveryProfile: {
        create: {
          vehicleType: 'Bike',
          vehicleNumber: 'MH-09-AB-1234',
          status: 'AVAILABLE',
        },
      },
    },
  });
  console.log(`✅ Delivery partner: ${partner.email}`);

  // ─── Customer address ────────────────────────────────────────────────────────
  await prisma.address.upsert({
    where: { id: 'seed-address-001' },
    update: {},
    create: {
      id: 'seed-address-001',
      userId: customer.id,
      type: AddressType.HOME,
      street: '12, MG Road',
      city: 'Kolhapur',
      state: 'Maharashtra',
      pincode: '416001',
      isDefault: true,
    },
  });

  // ─── Categories ──────────────────────────────────────────────────────────────
  const categoryData = [
    { name: 'Face Care', slug: 'face-care', description: 'Nourish your skin' },
    { name: 'Body Care', slug: 'body-care', description: 'Head to toe care' },
    { name: 'Hair Care', slug: 'hair-care', description: 'Strengthen & shine' },
    { name: 'Lip Care', slug: 'lip-care', description: 'Soft & supple lips' },
    { name: 'Sun Care', slug: 'sun-care', description: 'UV protection' },
    { name: 'Gift Sets', slug: 'gift-sets', description: 'Curated collections' },
  ];

  const categories: Record<string, any> = {};
  for (const cat of categoryData) {
    categories[cat.slug] = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`✅ Categories: ${Object.keys(categories).length}`);

  // ─── Products ────────────────────────────────────────────────────────────────
  const productData = [
    {
      name: 'Goat Milk Moisturising Lotion',
      slug: 'goat-milk-lotion',
      description: 'Rich, creamy lotion with goat milk and shea butter for deep hydration.',
      price: 849, compareAtPrice: 999, sku: 'KH-BDY-001',
      categorySlug: 'body-care', status: ProductStatus.ACTIVE,
    },
    {
      name: 'Aloe Vera Gel Moisturiser',
      slug: 'aloe-vera-gel',
      description: 'Lightweight gel with pure aloe vera for oily & combination skin.',
      price: 649, compareAtPrice: 799, sku: 'KH-FC-001',
      categorySlug: 'face-care', status: ProductStatus.ACTIVE,
    },
    {
      name: 'Rosehip Brightening Serum',
      slug: 'rosehip-serum',
      description: 'Vitamin C rich rosehip serum for a luminous, even complexion.',
      price: 1299, compareAtPrice: 1599, sku: 'KH-FC-002',
      categorySlug: 'face-care', status: ProductStatus.ACTIVE,
    },
    {
      name: 'Coconut Hair Growth Oil',
      slug: 'coconut-hair-oil',
      description: 'Cold-pressed coconut oil blended with herbal extracts.',
      price: 599, compareAtPrice: 749, sku: 'KH-HR-001',
      categorySlug: 'hair-care', status: ProductStatus.ACTIVE,
    },
    {
      name: 'Turmeric Glow Face Mask',
      slug: 'turmeric-face-mask',
      description: 'Weekly clay mask with turmeric and sandalwood.',
      price: 499, compareAtPrice: null, sku: 'KH-FC-003',
      categorySlug: 'face-care', status: ProductStatus.ACTIVE,
    },
    {
      name: 'Shea Butter Lip Balm',
      slug: 'shea-lip-balm',
      description: 'Intensive lip repair with shea butter and vitamin E.',
      price: 199, compareAtPrice: 249, sku: 'KH-LP-001',
      categorySlug: 'lip-care', status: ProductStatus.ACTIVE,
    },
    {
      name: 'SPF 50 Sunscreen Gel',
      slug: 'sunscreen-gel-spf50',
      description: 'Broad spectrum UVA/UVB protection with matte finish.',
      price: 749, compareAtPrice: 899, sku: 'KH-SUN-001',
      categorySlug: 'sun-care', status: ProductStatus.ACTIVE,
    },
    {
      name: 'Argan Oil Hair Serum',
      slug: 'argan-hair-serum',
      description: 'Lightweight serum that tames frizz and adds shine.',
      price: 799, compareAtPrice: 999, sku: 'KH-HR-002',
      categorySlug: 'hair-care', status: ProductStatus.ACTIVE,
    },
  ];

  const products: any[] = [];
  for (const pd of productData) {
    const { categorySlug, ...data } = pd;
    const product = await prisma.product.upsert({
      where: { slug: pd.slug },
      update: {},
      create: {
        ...data,
        stock: 100,
        categoryId: categories[categorySlug].id,
        images: {
          create: [
            {
              url: `https://picsum.photos/seed/knack-${pd.slug}/400/400`,
              altText: pd.name,
              isPrimary: true,
            },
          ],
        },
      },
    });
    products.push(product);
  }
  console.log(`✅ Products: ${products.length}`);

  // ─── Inventory ───────────────────────────────────────────────────────────────
  const supplier = await prisma.supplier.upsert({
    where: { id: 'seed-supplier-001' },
    update: {},
    create: {
      id: 'seed-supplier-001',
      name: 'Himalaya Herbs Ltd.',
      email: 'supply@himalayaherbs.com',
      phone: '+91-9876543210',
    },
  });

  for (const product of products) {
    const inv = await prisma.inventory.create({
      data: { productId: product.id, supplierId: supplier.id, batchNumber: 'BATCH-2026-01' },
    });
    await prisma.inventoryTransaction.create({
      data: { inventoryId: inv.id, type: 'PURCHASE', quantity: 100, reason: 'Initial seed stock' },
    });
  }
  console.log(`✅ Inventory seeded for ${products.length} products`);

  // ─── Coupons ─────────────────────────────────────────────────────────────────
  await prisma.coupon.upsert({
    where: { code: 'WELCOME20' },
    update: {},
    create: {
      code: 'WELCOME20',
      type: 'PERCENTAGE',
      value: 20,
      minOrderValue: 500,
      maxDiscount: 200,
      usageLimit: 1000,
    },
  });
  await prisma.coupon.upsert({
    where: { code: 'FLAT100' },
    update: {},
    create: {
      code: 'FLAT100',
      type: 'FLAT',
      value: 100,
      minOrderValue: 700,
    },
  });
  console.log('✅ Coupons seeded');

  // ─── FAQs ────────────────────────────────────────────────────────────────────
  const faqs = [
    { question: 'Are Knack Herbal products 100% natural?', answer: 'Yes, all our products are made with natural herbal ingredients.', category: 'Products' },
    { question: 'How long does delivery take?', answer: 'We deliver within 5–7 business days across India.', category: 'Shipping' },
    { question: 'Can I return a product?', answer: 'Yes, we accept returns within 7 days of delivery. Product must be unused.', category: 'Returns' },
    { question: 'How do I track my order?', answer: 'You can track your order from the Orders section in your dashboard.', category: 'Orders' },
  ];
  for (const faq of faqs) {
    await prisma.fAQ.create({ data: faq }).catch(() => {});
  }
  console.log('✅ FAQs seeded');

  // ─── Banners ─────────────────────────────────────────────────────────────────
  await prisma.banner.createMany({
    data: [
      { title: 'Summer Sale — Up to 30% Off', imageUrl: 'https://picsum.photos/seed/banner1/1200/400', linkUrl: '/shop', sortOrder: 0 },
      { title: 'New: Rosehip Serum', imageUrl: 'https://picsum.photos/seed/banner2/1200/400', linkUrl: '/product/rosehip-serum', sortOrder: 1 },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Banners seeded');

  console.log('\n✨ Seed complete!');
  console.log('   Admin:    admin@knackherbal.com    / Admin@123');
  console.log('   Customer: customer@knackherbal.com / Customer@123');
  console.log('   Partner:  partner@knackherbal.com  / Partner@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
