import {
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { StoreAuthorizationService } from '../common/guards/store-authorization.service';
import { BraveImageProvider } from './brave-image.provider';
import { ExternalImageProvider, ExternalImageRecord } from './external-image-provider';
import { ExternalImageSearchService } from './external-image-search.service';
import { OpenverseImageProvider } from './openverse-image.provider';
import { SerpApiImageProvider } from './serpapi-image.provider';

describe('ExternalImageSearchService', () => {
  const storeAuthorization = {
    requirePermission: jest.fn(),
  };
  const braveSearch = jest.fn<ExternalImageProvider['search']>();
  const openverseSearch = jest.fn<ExternalImageProvider['search']>();
  const serpApiSearch = jest.fn<ExternalImageProvider['search']>();
  const brave: ExternalImageProvider = {
    name: 'Brave',
    isConfigured: jest.fn(() => true),
    search: braveSearch,
  };
  const openverse: ExternalImageProvider = {
    name: 'Openverse',
    isConfigured: jest.fn(() => true),
    search: openverseSearch,
  };
  const serpApi: ExternalImageProvider = {
    name: 'SerpApi',
    isConfigured: jest.fn(() => true),
    search: serpApiSearch,
  };
  let service: ExternalImageSearchService;

  const makeRecord = (
    id: string,
    provider: string,
    title: string,
    options: Partial<ExternalImageRecord> = {},
  ): ExternalImageRecord => ({
    id,
    provider,
    title,
    description: null,
    imageUrl: `https://images.example.test/${id}.jpg`,
    originalImageUrl: `https://images.example.test/${id}.jpg`,
    sourcePageUrl: `https://source.example.test/${id}`,
    sourceDomain: 'source.example.test',
    creator: null,
    creatorUrl: null,
    license: null,
    licenseVersion: null,
    licenseUrl: null,
    attribution: null,
    source: 'source.example.test',
    keywords: [],
    ...options,
  });

  const query = {
    storeId: 'store-1',
    brand: 'Ray-Ban',
    reference: 'RB2140',
    model: 'Wayfarer',
    color: 'Black',
    page: 1,
    limit: 8,
    skip: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    storeAuthorization.requirePermission.mockResolvedValue({});
    (brave.isConfigured as jest.Mock).mockReturnValue(true);
    (openverse.isConfigured as jest.Mock).mockReturnValue(true);
    (serpApi.isConfigured as jest.Mock).mockReturnValue(true);
    braveSearch.mockResolvedValue([]);
    openverseSearch.mockResolvedValue([]);
    serpApiSearch.mockResolvedValue([]);
    service = new ExternalImageSearchService(
      brave as BraveImageProvider,
      openverse as OpenverseImageProvider,
      serpApi as SerpApiImageProvider,
      storeAuthorization as unknown as StoreAuthorizationService,
    );
  });

  it('searches Brave and Openverse automatically and never calls SerpApi', async () => {
    await service.freeSuggestions('staff-1', query);

    expect(braveSearch).toHaveBeenCalledWith(
      'Ray-Ban RB2140 Wayfarer Black eyeglasses frame',
      { country: 'TN', language: 'en' },
    );
    expect(openverseSearch).toHaveBeenCalledTimes(1);
    expect(serpApiSearch).not.toHaveBeenCalled();
  });

  it('keeps licensing metadata and deduplicates results from free providers', async () => {
    const sharedUrl = 'https://images.example.test/shared.jpg';
    openverseSearch.mockResolvedValueOnce([
      makeRecord('openverse-1', 'Openverse', 'Ray-Ban RB2140 Wayfarer Black', {
        imageUrl: sharedUrl,
        originalImageUrl: sharedUrl,
        license: 'by',
        licenseVersion: '4.0',
        licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
        attribution: 'Photographer, CC BY 4.0',
      }),
    ]);
    braveSearch.mockResolvedValueOnce([
      makeRecord('brave-1', 'Brave', 'Ray-Ban RB2140 Wayfarer Black', {
        imageUrl: sharedUrl,
        originalImageUrl: sharedUrl,
      }),
      makeRecord('brave-2', 'Brave', 'Eyeglasses'),
    ]);

    const response = await service.freeSuggestions('staff-1', query);

    expect(response.data).toHaveLength(2);
    expect(response.data[0]).toMatchObject({
      provider: 'Openverse',
      matchSignal: 'BRAND_REFERENCE_TEXT_MATCH',
      license: 'by',
      attribution: 'Photographer, CC BY 4.0',
      licenseStatus: 'LICENSE_METADATA_AVAILABLE',
      isVerified: false,
    });
    expect(response.data[1]).toMatchObject({
      matchSignal: 'SEARCH_CANDIDATE',
      licenseStatus: 'NOT_PROVIDED',
      isVerified: false,
    });
    expect(response.data[0]).not.toHaveProperty('keywords');
    expect(response.data[0]).not.toHaveProperty('catalogueImageId');
  });

  it('uses the Openverse-only fallback when Brave has no key', async () => {
    (brave.isConfigured as jest.Mock).mockReturnValue(false);

    const response = await service.freeSuggestions('staff-1', query);

    expect(braveSearch).not.toHaveBeenCalled();
    expect(openverseSearch).toHaveBeenCalledTimes(1);
    expect(response.warnings).toContain(
      'BRAVE_API_KEY is not configured; searching Openverse only.',
    );
  });

  it('returns a warning when a provider fails but the other provider succeeds', async () => {
    braveSearch.mockRejectedValueOnce(new Error('upstream failed'));

    const response = await service.freeSuggestions('staff-1', query);

    expect(response.warnings).toContain(
      'Brave image search is currently unavailable.',
    );
    expect(response.providers).toEqual(['Openverse']);
  });

  it('reports an error when all available free providers fail', async () => {
    braveSearch.mockRejectedValueOnce(new Error('Brave failed'));
    openverseSearch.mockRejectedValueOnce(new Error('Openverse failed'));

    await expect(
      service.freeSuggestions('staff-1', query),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('calls SerpApi only when the paid search method is explicitly invoked', async () => {
    await service.freeSuggestions('staff-1', query);
    expect(serpApiSearch).not.toHaveBeenCalled();

    const response = await service.paidSuggestions('staff-1', query);

    expect(serpApiSearch).toHaveBeenCalledWith(
      'Ray-Ban RB2140 Wayfarer Black eyeglasses frame',
      { country: 'tn', language: 'en' },
    );
    expect(response.providers).toEqual(['SerpApi']);
    expect(response.data).toEqual([]);
  });

  it('does not call SerpApi when its backend key is missing', async () => {
    (serpApi.isConfigured as jest.Mock).mockReturnValue(false);

    await expect(
      service.paidSuggestions('staff-1', query),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(serpApiSearch).not.toHaveBeenCalled();
  });

  it('labels EAN text matches but never claims an exact SKU match', async () => {
    openverseSearch.mockResolvedValueOnce([
      makeRecord('ean', 'Openverse', 'Product barcode 1234567890123'),
    ]);

    const response = await service.freeSuggestions('staff-1', {
      storeId: 'store-1',
      ean: '1234567890123',
      page: 1,
      limit: 8,
      skip: 0,
    });

    expect(response.data[0].matchSignal).toBe('EAN_TEXT_MATCH');
    expect(response.data[0].isVerified).toBe(false);
  });

  it('returns no results when providers find no candidates', async () => {
    await expect(
      service.freeSuggestions('staff-1', query),
    ).resolves.toMatchObject({ data: [], warnings: [] });
  });

  it('caches identical provider searches but still authorizes each request', async () => {
    openverseSearch.mockResolvedValueOnce([
      makeRecord('candidate', 'Openverse', 'Ray-Ban RB2140'),
    ]);

    await service.freeSuggestions('staff-1', query);
    await service.freeSuggestions('staff-2', query);

    expect(braveSearch).toHaveBeenCalledTimes(1);
    expect(openverseSearch).toHaveBeenCalledTimes(1);
    expect(storeAuthorization.requirePermission).toHaveBeenCalledTimes(2);
  });

  it('checks shop inventory permission before accessing providers', async () => {
    storeAuthorization.requirePermission.mockRejectedValue(
      new ForbiddenException('Store permission is required'),
    );

    await expect(
      service.freeSuggestions('employee-1', {
        ...query,
        storeId: 'another-store',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(braveSearch).not.toHaveBeenCalled();
    expect(openverseSearch).not.toHaveBeenCalled();
  });
});
