import {
  GatewayTimeoutException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { OpenverseImageProvider } from './openverse-image.provider';

describe('OpenverseImageProvider', () => {
  let provider: OpenverseImageProvider;
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    provider = new OpenverseImageProvider();
    fetchMock = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchMock.mockRestore();
  });

  it('requests commercial-use results and retains license attribution', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [
            {
              id: 'image-1',
              title: 'Ray-Ban RB2140 Wayfarer Black',
              url: 'https://images.example.test/frame.jpg',
              thumbnail: 'https://images.example.test/thumb.jpg',
              foreign_landing_url: 'https://source.example.test/frame',
              creator: 'Photographer',
              creator_url: 'https://source.example.test/creator',
              license: 'by',
              license_version: '4.0',
              license_url: 'https://creativecommons.org/licenses/by/4.0/',
              provider: 'Flickr',
              attribution: 'Photographer, CC BY 4.0',
              tags: [{ name: 'eyewear' }],
            },
            {
              id: 'noncommercial',
              title: 'Non-commercial image',
              url: 'https://images.example.test/noncommercial.jpg',
              foreign_landing_url: 'https://source.example.test/noncommercial',
              license: 'by-nc',
              license_url: 'https://creativecommons.org/licenses/by-nc/4.0/',
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const results = await provider.search('Ray-Ban RB2140');

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      id: 'image-1',
      imageUrl: 'https://images.example.test/thumb.jpg',
      sourcePageUrl: 'https://source.example.test/frame',
      license: 'by',
      licenseVersion: '4.0',
      attribution: 'Photographer, CC BY 4.0',
      keywords: ['eyewear'],
    });
    const requestUrl = new URL(fetchMock.mock.calls[0][0] as URL);
    expect(requestUrl.searchParams.get('license_type')).toBe('commercial');
    expect(requestUrl.searchParams.get('page_size')).toBe('8');
  });

  it('returns an empty result set when the provider finds no images', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ results: [] }), { status: 200 }),
    );

    await expect(provider.search('not found')).resolves.toEqual([]);
  });

  it('maps provider timeouts to a gateway timeout', async () => {
    fetchMock.mockRejectedValue(
      Object.assign(new Error('Timed out'), { name: 'TimeoutError' }),
    );

    await expect(provider.search('eyewear')).rejects.toBeInstanceOf(
      GatewayTimeoutException,
    );
  });

  it('reports provider throttling as unavailable', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 429 }));

    await expect(provider.search('eyewear')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('reports upstream failures instead of returning a success-shaped empty result', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 502 }));

    await expect(provider.search('eyewear')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
