import Redis from 'ioredis';
import { ProductsCacheService } from './products-cache.service';

describe('ProductsCacheService', () => {
  let cache: ProductsCacheService;
  let redis: {
    on: jest.Mock;
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
    incr: jest.Mock;
    disconnect: jest.Mock;
  };

  beforeEach(() => {
    process.env.PRODUCTS_CACHE_ENABLED = 'true';
    redis = {
      on: jest.fn(),
      get: jest.fn(),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
      incr: jest.fn().mockResolvedValue(1),
      disconnect: jest.fn(),
    };
    cache = new ProductsCacheService(redis as unknown as Redis);
  });

  afterEach(() => {
    delete process.env.PRODUCTS_CACHE_ENABLED;
    delete process.env.PRODUCTS_CACHE_LIST_TTL_SECONDS;
    delete process.env.PRODUCTS_CACHE_ITEM_TTL_SECONDS;
  });

  it('returns a cached list without querying the loader', async () => {
    const result = { data: [{ id: 'product-1' }] };
    redis.get.mockImplementation((key: string) =>
      Promise.resolve(
        key === 'products:list:version' ? '4' : JSON.stringify(result),
      ),
    );
    const load = jest.fn().mockResolvedValue({ data: [] });

    await expect(cache.getList({ page: 1 }, load)).resolves.toEqual(result);

    expect(load).not.toHaveBeenCalled();
  });

  it('loads and stores a list on a cache miss', async () => {
    const result = { data: [{ id: 'product-1' }] };
    redis.get.mockImplementation((key: string) =>
      Promise.resolve(key === 'products:list:version' ? '0' : null),
    );
    const load = jest.fn().mockResolvedValue(result);

    await expect(cache.getList({ page: 1 }, load)).resolves.toEqual(result);

    expect(load).toHaveBeenCalledTimes(1);
    expect(redis.set).toHaveBeenCalledWith(
      expect.stringMatching(/^products:list:[a-f0-9]{64}$/),
      JSON.stringify(result),
      'EX',
      30,
    );
  });

  it('deletes the item and advances the list generation on invalidation', async () => {
    await cache.invalidateProduct('product-1');

    expect(redis.del).toHaveBeenCalledWith('products:item:product-1');
    expect(redis.incr).toHaveBeenCalledWith('products:list:version');
  });

  it('falls back to the loader when Redis fails', async () => {
    redis.get.mockRejectedValue(new Error('Redis unavailable'));
    const result = { data: [] };
    const load = jest.fn().mockResolvedValue(result);

    await expect(cache.getList({ page: 1 }, load)).resolves.toEqual(result);

    expect(load).toHaveBeenCalledTimes(1);
    expect(redis.set).not.toHaveBeenCalled();
  });
});
