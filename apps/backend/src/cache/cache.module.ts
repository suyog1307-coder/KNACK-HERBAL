import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * AppCacheModule — provides a Redis-backed cache via @nestjs/cache-manager.
 *
 * Falls back to in-memory cache when REDIS_URL is not set
 * (e.g. local dev without Docker).
 *
 * Inject in any service:
 *   constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}
 *
 * Usage:
 *   await this.cache.set('key', value, 300_000); // TTL in ms
 *   const val = await this.cache.get<T>('key');
 *   await this.cache.del('key');
 */
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');

        if (!redisUrl) {
          // In-memory fallback — works with zero config in development
          return { ttl: 300_000, max: 1000 };
        }

        try {
          const { redisStore } = await import('cache-manager-redis-yet');
          const store = await redisStore({ url: redisUrl, ttl: 300 });
          return { store };
        } catch {
          // Redis unavailable — fall back to in-memory silently
          return { ttl: 300_000, max: 1000 };
        }
      },
    }),
  ],
  exports: [CacheModule],
})
export class AppCacheModule {}
