import { Module, Logger } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * AppCacheModule — provides a Redis-backed cache via @nestjs/cache-manager.
 *
 * Falls back to in-memory cache when REDIS_URL is not set or Redis server is unreachable
 * (e.g. local dev on Windows without Docker/Redis).
 */
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const logger = new Logger('AppCacheModule');
        const redisUrl = config.get<string>('REDIS_URL');

        if (!redisUrl) {
          logger.log('No REDIS_URL provided — using in-memory cache.');
          return { ttl: 300_000, max: 1000 };
        }

        try {
          const { redisStore } = await import('cache-manager-redis-yet');
          const store = await redisStore({
            url: redisUrl,
            ttl: 300,
            socket: {
              reconnectStrategy: (retries: number) => {
                if (retries > 2) {
                  logger.warn('Redis unreachable — caching will operate in fallback mode.');
                  return false; // Stop reconnecting continuously
                }
                return 500;
              },
            },
          });

          // Handle socket errors to prevent unhandled ECONNREFUSED error output
          if (store.client) {
            store.client.on('error', (err: any) => {
              logger.warn(`Redis connection notice: ${err.message || 'ECONNREFUSED'}`);
            });
          }

          return { store };
        } catch {
          logger.warn('Failed to connect to Redis — falling back to in-memory cache.');
          return { ttl: 300_000, max: 1000 };
        }
      },
    }),
  ],
  exports: [CacheModule],
})
export class AppCacheModule {}
