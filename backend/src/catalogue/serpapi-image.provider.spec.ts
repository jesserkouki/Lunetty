import { ServiceUnavailableException } from '@nestjs/common';
import { SerpApiImageProvider } from './serpapi-image.provider';

describe('SerpApiImageProvider', () => {
  const originalApiKey = process.env.SERPAPI_API_KEY;
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    process.env.SERPAPI_API_KEY = 'test-serpapi-key';
    fetchMock = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchMock.mockRestore();
    if (originalApiKey === undefined) delete process.env.SERPAPI_API_KEY;
    else process.env.SERPAPI_API_KEY = originalApiKey;
  });

  it('calls Google Images search and returns unverified candidates', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          images_results: [
            {
              title: 'Ray-Ban RB5228 frame',
              thumbnail: 'https://images.example.test/thumb.jpg',
              original: 'https://images.example.test/frame.jpg',
              link: 'https://retailer.example.test/rb5228',
              source: 'Retailer',
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const provider = new SerpApiImageProvider();
    const results = await provider.search('Ray-Ban RB5228', {
      country: 'tn',
      language: 'en',
    });

    const url = new URL(fetchMock.mock.calls[0][0] as URL);
    expect(url.searchParams.get('engine')).toBe('google_images');
    expect(url.searchParams.get('q')).toBe('Ray-Ban RB5228');
    expect(url.searchParams.get('api_key')).toBe('test-serpapi-key');
    expect(url.searchParams.get('gl')).toBe('tn');
    expect(results[0]).toMatchObject({
      provider: 'SerpApi',
      sourcePageUrl: 'https://retailer.example.test/rb5228',
      originalImageUrl: 'https://images.example.test/frame.jpg',
      license: null,
    });
    expect(JSON.stringify(results)).not.toContain('test-serpapi-key');
  });

  it('rejects a provider error response rather than reporting empty results', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: 'invalid api key' }), {
        status: 200,
      }),
    );

    await expect(new SerpApiImageProvider().search('frame')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('does not make a provider request when its API key is missing', async () => {
    delete process.env.SERPAPI_API_KEY;
    const provider = new SerpApiImageProvider();

    expect(provider.isConfigured()).toBe(false);
    await expect(provider.search('frame')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
