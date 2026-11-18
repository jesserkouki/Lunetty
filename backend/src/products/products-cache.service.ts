import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { createHash } from 'node:crypto';
import { PRODUCTS_REDIS } from './products-cache.tokens';

const LIST_VERSION_KEY = 'products:list:version';
const DEFAULT_REDIS_TIMEOUT_MS = 100;
const DEFAULT_LIST_TTL_SECONDS = 30;
const DEFAULT_ITEM_TTL_SECONDS = 300;

@Injectable()
export class ProductsCacheService implements OnModuleDestroy {
  private readonly logger = new Logger(ProductsCacheService.name);

  constructor(@Inject(PRODUCTS_REDIS) private readonly redis: Redis) {
    this.redis.on('error', (error: Error) => {
      this.logger.warn(`Redis connection error: ${error.message}`);
    });
  }

  async getList<T>(
    query: Record<string, unknown>,
    load: () => Promise<T>,
  ): Promise<T> {
    if (!this.enabled) return load();

    const version = await this.redisCall(
      'read list version',
      LIST_VERSION_KEY,
      () => this.redis.get(LIST_VERSION_KEY),
    );
    if (version === undefined) {
      this.logger.warn(
        'Products list cache bypassed because its version is unavailable',
      );
      return load();
    }

    const effectiveVersion = version ?? (await this.initializeListVersion());
    if (effectiveVersion === undefined) {
      this.logger.warn(
        'Products list cache bypassed because its version could not be initialized',
      );
      return load();
    }

    const key = `products:list:${hash({ version: effectiveVersion, query })}`;
    return this.getOrLoad(key, this.listTtlSeconds, load);
  }

  async getItem<T>(id: string, load: () => Promise<T>): Promise<T> {
    if (!this.enabled) return load();
    return this.getOrLoad(`products:item:${id}`, this.itemTtlSeconds, load);
  }

  async invalidateProduct(id: string): Promise<void> {
    if (!this.enabled) return;
    await Promise.all([
      this.redisCall('invalidate product', `products:item:${id}`, () =>
        this.redis.del(`products:item:${id}`),
      ),
      this.invalidateLists(),
    ]);
  }

  async invalidateLists(): Promise<void> {
    if (!this.enabled) return;
    await this.redisCall('invalidate product lists', LIST_VERSION_KEY, () =>
      this.redis.incr(LIST_VERSION_KEY),
    );
  }

  onModuleDestroy(): void {
    this.redis.disconnect();
  }

  private async getOrLoad<T>(
    key: string,
    ttlSeconds: number,
    load: () => Promise<T>,
  ): Promise<T> {
    const lookupStartedAt = Date.now();
    const cached = await this.redisCall('read', key, () => this.redis.get(key));
    if (cached !== undefined && cached !== null) {
      try {
        const result = JSON.parse(cached) as T;
        this.logger.log(
          `Products cache hit ${key} lookup_ms=${Date.now() - lookupStartedAt}`,
        );
        return result;
      } catch (error) {
        this.logger.warn(
          `Invalid cached product value for ${key}: ${errorMessage(error)}`,
        );
        await this.redisCall('remove invalid value', key, () =>
          this.redis.del(key),
        );
      }
    }

    const startedAt = Date.now();
    const result = await load();
    if (cached !== undefined) {
      this.logger.log(
        `Products cache miss ${key} lookup_ms=${startedAt - lookupStartedAt} load_ms=${Date.now() - startedAt}`,
      );
      try {
        const serialized = JSON.stringify(result);
        await this.redisCall('write', key, () =>
          this.redis.set(key, serialized, 'EX', ttlSeconds),
        );
      } catch (error) {
        this.logger.warn(
          `Could not serialize product cache value for ${key}: ${errorMessage(error)}`,
        );
      }
    } else {
      this.logger.log(
        `Products cache bypass ${key} load_ms=${Date.now() - startedAt}`,
      );
    }
    return result;
  }

  private async initializeListVersion(): Promise<string | undefined> {
    const initialized = await this.redisCall(
      'initialize list version',
      LIST_VERSION_KEY,
      () => this.redis.set(LIST_VERSION_KEY, '0', 'NX'),
    );
    if (initialized === undefined) return undefined;
    if (initialized === 'OK') return '0';
    const version = await this.redisCall(
      'read list version',
      LIST_VERSION_KEY,
      () => this.redis.get(LIST_VERSION_KEY),
    );
    return version ?? undefined;
  }

  private async redisCall<T>(
    operation: string,
    key: string,
    call: () => Promise<T>,
  ): Promise<T | undefined> {
    try {
      if (this.redis.status === 'wait') {
        await withTimeout(this.redis.connect(), this.redisTimeoutMs);
      }
      return await withTimeout(call(), this.redisTimeoutMs);
    } catch (error) {
      this.logger.warn(
        `Products cache ${operation} failed for ${key}: ${errorMessage(error)}`,
      );
      return undefined;
    }
  }

  private get enabled(): boolean {
    return process.env.PRODUCTS_CACHE_ENABLED === 'true';
  }

  private get redisTimeoutMs(): number {
    return positiveInteger(
      process.env.PRODUCTS_CACHE_REDIS_TIMEOUT_MS,
      DEFAULT_REDIS_TIMEOUT_MS,
    );
  }

  private get listTtlSeconds(): number {
    return positiveInteger(
      process.env.PRODUCTS_CACHE_LIST_TTL_SECONDS,
      DEFAULT_LIST_TTL_SECONDS,
    );
  }

  private get itemTtlSeconds(): number {
    return positiveInteger(
      process.env.PRODUCTS_CACHE_ITEM_TTL_SECONDS,
      DEFAULT_ITEM_TTL_SECONDS,
    );
  }
}

function hash(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(sortObject(value)))
    .digest('hex');
}

function sortObject(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortObject);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, sortObject(entry)]),
  );
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`Redis operation timed out after ${timeoutMs}ms`)),
      timeoutMs,
    );
    promise.then(resolve, reject).finally(() => clearTimeout(timeout));
  });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
