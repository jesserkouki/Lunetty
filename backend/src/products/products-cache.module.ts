import { Module } from '@nestjs/common';
import Redis from 'ioredis';
import { ProductsCacheService } from './products-cache.service';
import { PRODUCTS_REDIS } from './products-cache.tokens';

@Module({
  providers: [
    {
      provide: PRODUCTS_REDIS,
      useFactory: () => {
        const timeoutMs = positiveInteger(
          process.env.PRODUCTS_CACHE_REDIS_TIMEOUT_MS,
          100,
        );
        return new Redis({
          host: process.env.PRODUCTS_REDIS_HOST || 'localhost',
          port: positiveInteger(process.env.PRODUCTS_REDIS_PORT, 6379),
          ...(process.env.PRODUCTS_REDIS_PASSWORD
            ? { password: process.env.PRODUCTS_REDIS_PASSWORD }
            : {}),
          ...(process.env.PRODUCTS_REDIS_TLS === 'true' ? { tls: {} } : {}),
          lazyConnect: true,
          enableOfflineQueue: false,
          maxRetriesPerRequest: 1,
          connectTimeout: timeoutMs,
          commandTimeout: timeoutMs,
          retryStrategy: (attempt) => Math.min(attempt * 100, 1000),
        });
      },
    },
    ProductsCacheService,
  ],
  exports: [ProductsCacheService],
})
export class ProductsCacheModule {}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}
