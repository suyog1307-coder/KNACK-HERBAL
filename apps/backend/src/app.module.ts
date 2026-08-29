import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import * as Joi from 'joi';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { PrismaModule } from './prisma/prisma.module';

// Catalog
import { ProductsModule } from './catalog/products/products.module';
import { CategoriesModule } from './catalog/categories/categories.module';
import { BrandsModule } from './catalog/brands/brands.module';

// Core commerce
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CustomersModule } from './customers/customers.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { WishlistModule } from './wishlist/wishlist.module';

// Operations
import { InventoryModule } from './inventory/inventory.module';
import { DeliveryModule } from './delivery/delivery.module';

// Marketing & CMS
import { MarketingModule } from './marketing/marketing.module';
import { SupportModule } from './support/support.module';

// Platform
import { NotificationsModule } from './notifications/notifications.module';
import { EnterpriseModule } from './enterprise/enterprise.module';
import { UploadsModule } from './uploads/uploads.module';
import { JobsModule } from './jobs/jobs.module';
import { AppCacheModule } from './cache/cache.module';

@Module({
  imports: [
    // ── Global config + validation ─────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().required(),
        // Optional — warn at runtime if missing
        RAZORPAY_KEY_ID: Joi.string().optional(),
        RAZORPAY_KEY_SECRET: Joi.string().optional(),
        SMTP_HOST: Joi.string().optional(),
        TWILIO_ACCOUNT_SID: Joi.string().optional(),
        FRONTEND_URL: Joi.string().optional(),
      }),
    }),

    // ── Rate limiting ──────────────────────────────────────────────────────
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    // ── Structured logging ─────────────────────────────────────────────────
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProd = config.get('NODE_ENV') === 'production';
        return {
          pinoHttp: {
            customProps: () => ({ context: 'HTTP' }),
            transport: isProd ? undefined : { target: 'pino-pretty', options: { singleLine: true } },
            level: isProd ? 'info' : 'debug',
          },
        };
      },
    }),

    // ── Infrastructure ─────────────────────────────────────────────────────
    HealthModule,
    PrismaModule,

    // ── Catalog ────────────────────────────────────────────────────────────
    ProductsModule,
    CategoriesModule,
    BrandsModule,

    // ── Core commerce ──────────────────────────────────────────────────────
    AuthModule,
    UsersModule,
    CustomersModule,
    CartModule,
    WishlistModule,
    OrdersModule,
    PaymentsModule,

    // ── Operations ─────────────────────────────────────────────────────────
    InventoryModule,
    DeliveryModule,

    // ── Marketing & CMS ────────────────────────────────────────────────────
    MarketingModule,
    SupportModule,

    // ── Platform ───────────────────────────────────────────────────────────
    NotificationsModule,
    EnterpriseModule,
    UploadsModule,
    JobsModule,
    AppCacheModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
