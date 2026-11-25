import { ServiceUnavailableException } from '@nestjs/common';
import { BraveImageProvider } from './brave-image.provider';

describe('BraveImageProvider', () => {
  const originalApiKey = process.env.BRAVE_API_KEY;
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    process.env.BRAVE_API_KEY = 'test-brave-key';
    fetchMock = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchMock.mockRestore();
    if (originalApiKey === undefined) delete process.env.BRAVE_API_KEY;
    else process.env.BRAVE_API_KEY = originalApiKey;
  });

  it('uses the Brave image API with strict safe search and bounded results', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [
            {
              title: 'Ray-Ban RB5228 2000 black eyeglasses frame',
              url: 'https://retailer.example.test/rb5228',
              thumbnail: { src: 'https://images.example.test/thumb.jpg' },
              properties: {
                url: 'https://images.example.test/frame.jpg',
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const provider = new BraveImageProvider();
    const results = await provider.search(
      'Ray-Ban RB5228 2000 black eyeglasses frame',
      { country: 'TN', language: 'en' },
    );

    const url = new URL(fetchMock.mock.calls[0][0] as URL);
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(url.searchParams.get('q')).toContain('RB5228');
    expect(url.searchParams.get('country')).toBe('TN');
    expect(url.searchParams.get('search_lang')).toBe('en');
    expect(url.searchParams.get('safesearch')).toBe('strict');
    expect(url.searchParams.get('count')).toBe('8');
    expect(new Headers(init.headers).get('X-Subscription-Token')).toBe(
      'test-brave-key',
    );
    expect(results[0]).toMatchObject({
      provider: 'Brave',
      sourcePageUrl: 'https://retailer.example.test/rb5228',
      originalImageUrl: 'https://images.example.test/frame.jpg',
      license: null,
    });
  });

  it('rejects private or non-HTTPS result URLs', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [
            {
              title: 'Unsafe image',
              url: 'http://127.0.0.1/admin',
              thumbnail: { src: 'http://127.0.0.1/image.jpg' },
            },
          ],
        }),
        { status: 200 },
      ),
    );

    await expect(new BraveImageProvider().search('frame')).resolves.toEqual([]);
  });

  it('rejects malformed provider responses', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ images: [] }), { status: 200 }),
    );

    await expect(new BraveImageProvider().search('frame')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('does not make a provider request when the API key is missing', async () => {
    delete process.env.BRAVE_API_KEY;
    const provider = new BraveImageProvider();

    expect(provider.isConfigured()).toBe(false);
    await expect(provider.search('frame')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
