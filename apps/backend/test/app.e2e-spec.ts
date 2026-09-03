import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { GlobalExceptionFilter } from './../src/common/filters/http-exception.filter';
import { TransformInterceptor } from './../src/common/interceptors/transform.interceptor';

/**
 * Phase 17.3 — E2E Tests
 *
 * Covers: Phase 2 (Health), Phase 4 (Auth), Phase 5 (Roles/RBAC),
 *         Phase 6 (Products), Phase 11 (Admin access control)
 *
 * Requires real DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET set in
 * apps/backend/.env (already confirmed present & DB reachable at :5433).
 *
 * Run: pnpm --filter backend test:e2e
 */
describe('Knack Herbal API — E2E (Phase 17.3)', () => {
  let app: INestApplication<App>;

  // Shared tokens across describe blocks
  let customerToken: string;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // ── Mirror main.ts exactly ────────────────────────────────────────────
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());

    await app.init();
  }, 60000);

  afterAll(async () => {
    await app.close();
  });

  // ─── Phase 2: Health Check ────────────────────────────────────────────────

  describe('Phase 2 — Backend Foundation: Health', () => {
    it('GET /api/v1/health → 200', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);

      expect(res.body).toBeDefined();
      expect(res.body.success).toBe(true);
    });
  });

  // ─── Phase 4: Auth Register ───────────────────────────────────────────────

  describe('Phase 4 — Auth: Register', () => {
    const testEmail = `e2e_${Date.now()}@knackherbal.com`;
    const testPassword = 'Test@12345';

    it('POST /api/v1/auth/register → 201, user returned without passwordHash', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: testEmail, password: testPassword, firstName: 'E2E', lastName: 'Test' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testEmail);
      expect(res.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('POST /api/v1/auth/register → 409 duplicate email', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: testEmail, password: testPassword, firstName: 'Dup', lastName: 'User' })
        .expect(409);

      expect(res.body.success).toBe(false);
    });

    it('POST /api/v1/auth/register → 400 missing password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'nopw@test.com', firstName: 'X' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('POST /api/v1/auth/register → 400 invalid email format', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'not-an-email', password: 'Test@12345', firstName: 'X' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // ─── Phase 4: Auth Login ──────────────────────────────────────────────────

  describe('Phase 4 — Auth: Login & Token Flow', () => {
    const customerEmail = `e2e_customer_${Date.now()}@knackherbal.com`;
    const customerPassword = 'Test@12345';
    let refreshToken: string;

    beforeAll(async () => {
      // Create a fresh customer account for this block
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: customerEmail, password: customerPassword, firstName: 'Customer', lastName: 'E2E' });
    });

    it('POST /api/v1/auth/login → 200 with accessToken + refreshToken', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: customerEmail, password: customerPassword })
        .expect(200);

      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      customerToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
    });

    it('POST /api/v1/auth/login → 401 wrong password', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: customerEmail, password: 'WrongPass@99' })
        .expect(401);
    });

    it('POST /api/v1/auth/login → 401 non-existent user', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'ghost@knackherbal.com', password: 'Test@12345' })
        .expect(401);
    });

    it('POST /api/v1/auth/refresh → 200 new token pair', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      // Update token for subsequent tests
      customerToken = res.body.data.accessToken;
    });

    it('POST /api/v1/auth/refresh → 401 with already-used (revoked) token', async () => {
      // refreshToken was consumed above — reusing must fail
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });
  });

  // ─── Phase 4: Protected endpoints ────────────────────────────────────────

  describe('Phase 4 — Auth: Protected Endpoints', () => {
    it('GET /api/v1/auth/me → 200 with user profile when authenticated', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(res.body.data).toHaveProperty('role', 'CUSTOMER');
      expect(res.body.data).not.toHaveProperty('passwordHash');
    });

    it('GET /api/v1/auth/me → 401 without token (Phase 4 — Unauthorized)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .expect(401);
    });

    it('GET /api/v1/auth/me → 401 with malformed token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer this.is.not.valid')
        .expect(401);
    });
  });

  // ─── Phase 5 & 11: Role-Based Access Control ──────────────────────────────

  describe('Phase 5 & 11 — RBAC: Admin vs Customer', () => {
    it('GET /api/v1/enterprise/dashboard → 403 for CUSTOMER token', async () => {
      // Customer must NOT access admin dashboard
      await request(app.getHttpServer())
        .get('/api/v1/enterprise/dashboard')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('GET /api/v1/enterprise/dashboard → 401 without any token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/enterprise/dashboard')
        .expect(401);
    });
  });

  // ─── Phase 6: Products (Public catalog) ──────────────────────────────────

  describe('Phase 6 — Product Catalog (Public)', () => {
    it('GET /api/v1/products → 200 public product listing', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/products')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data) || res.body.data).toBeDefined();
    });

    it('GET /api/v1/categories → 200 public categories', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/categories')
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  // ─── Phase 7: Cart (requires auth) ───────────────────────────────────────

  describe('Phase 7 — Cart (Authenticated)', () => {
    it('GET /api/v1/cart → 200 for logged-in customer', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('GET /api/v1/cart → 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/cart')
        .expect(401);
    });
  });

  // ─── Phase 8: Orders ──────────────────────────────────────────────────────

  describe('Phase 8 — Orders (Authenticated)', () => {
    it('GET /api/v1/orders/my-orders → 200 for customer', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/orders/my-orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/v1/orders/my-orders → 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/orders/my-orders')
        .expect(401);
    });
  });

  // ─── Phase 9: Payments ────────────────────────────────────────────────────

  describe('Phase 9 — Payments: Invalid order', () => {
    it('POST /api/v1/payments/create/nonexistent → 404', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/payments/create/nonexistent-order-id')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(404);
    });
  });

  // ─── Phase 11: Admin endpoints ────────────────────────────────────────────

  describe('Phase 11 — Admin endpoints: access control', () => {
    it('GET /api/v1/enterprise/reports/sales → 403 for CUSTOMER', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/enterprise/reports/sales?from=2026-01-01&to=2026-12-31')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('GET /api/v1/enterprise/audit-logs → 403 for CUSTOMER', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/enterprise/audit-logs')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('GET /api/v1/enterprise/reports/gst → 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/enterprise/reports/gst?from=2026-01-01&to=2026-12-31')
        .expect(401);
    });
  });

  // ─── Phase 15: Support ────────────────────────────────────────────────────

  describe('Phase 15 — Support: FAQs and Banners (Auth required)', () => {
    it('GET /api/v1/support/faqs → 200 with customer token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/support/faqs')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('GET /api/v1/support/faqs → 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/support/faqs')
        .expect(401);
    });

    it('GET /api/v1/support/banners → 200 with customer token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/support/banners')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
