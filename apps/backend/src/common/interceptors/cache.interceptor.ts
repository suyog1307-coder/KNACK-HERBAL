import {
  Injectable, NestInterceptor, ExecutionContext,
  CallHandler, Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Simple in-memory cache interceptor.
 * Swap `store` for an ioredis/Redis client when Redis is available.
 *
 * To enable Redis caching:
 * 1. Install: pnpm add ioredis @nestjs/cache-manager cache-manager-redis-yet
 * 2. Set REDIS_URL in .env (e.g. redis://localhost:6379)
 * 3. Replace the Map store below with Redis client calls.
 */
const store = new Map<string, { data: unknown; expiresAt: number }>();

@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(HttpCacheInterceptor.name);

  constructor(private readonly ttlMs = 60_000) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest();

    // Only cache GET requests
    if (req.method !== 'GET') return next.handle();

    const key = req.url;
    const cached = store.get(key);

    if (cached && cached.expiresAt > Date.now()) {
      this.logger.debug(`[Cache] HIT: ${key}`);
      return of(cached.data);
    }

    return next.handle().pipe(
      tap((data) => {
        store.set(key, { data, expiresAt: Date.now() + this.ttlMs });
        this.logger.debug(`[Cache] SET: ${key} (TTL ${this.ttlMs}ms)`);
      }),
    );
  }

  static invalidate(pattern: string) {
    for (const key of store.keys()) {
      if (key.includes(pattern)) store.delete(key);
    }
  }
}
