import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { StoreAuthorizationService } from '../common/guards/store-authorization.service';
import { normalizeCatalogueValue } from './catalogue-normalization';
import { BraveImageProvider } from './brave-image.provider';
import type {
  ExternalImageProvider,
  ExternalImageRecord,
} from './external-image-provider';
import { OpenverseImageProvider } from './openverse-image.provider';
import { SerpApiImageProvider } from './serpapi-image.provider';
import { ProductImageSuggestionsDto } from './dto/product-image-suggestions.dto';

const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_LIMIT = 200;
const RESULT_LIMIT = 8;

export type ExternalImageMatchSignal =
  | 'EAN_TEXT_MATCH'
  | 'BRAND_REFERENCE_TEXT_MATCH'
  | 'BRAND_MODEL_TEXT_MATCH'
  | 'REFERENCE_TEXT_MATCH'
  | 'SEARCH_CANDIDATE';

export type ExternalImageSuggestion = Omit<ExternalImageRecord, 'keywords'> & {
  matchSignal: ExternalImageMatchSignal;
  isVerified: false;
  licenseStatus: 'LICENSE_METADATA_AVAILABLE' | 'NOT_PROVIDED';
};

export interface SearchResponse {
  providers: string[];
  warnings: string[];
  data: ExternalImageSuggestion[];
}

interface CacheEntry {
  expiresAt: number;
  response: SearchResponse;
}

@Injectable()
export class ExternalImageSearchService {
  private readonly cache = new Map<string, CacheEntry>();

  constructor(
    private readonly braveProvider: BraveImageProvider,
    private readonly openverseProvider: OpenverseImageProvider,
    private readonly serpApiProvider: SerpApiImageProvider,
    private readonly storeAuthorization: StoreAuthorizationService,
  ) {}

  async freeSuggestions(userId: string, query: ProductImageSuggestionsDto) {
    await this.authorize(userId, query.storeId);
    const searchText = buildSearchQuery(query);
    const cacheKey = `free|${this.cacheKey(query)}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const providers: ExternalImageProvider[] = [
      this.openverseProvider,
      ...(this.braveProvider.isConfigured() ? [this.braveProvider] : []),
    ];
    const warnings: string[] = [];
    if (!this.braveProvider.isConfigured()) {
      warnings.push('BRAVE_API_KEY is not configured; searching Openverse only.');
    }

    const providerResults = await Promise.allSettled(
      providers.map((provider) =>
        provider.search(searchText, { country: 'TN', language: 'en' }),
      ),
    );
    const successful: Array<{
      provider: ExternalImageProvider;
      records: ExternalImageRecord[];
    }> = [];
    providerResults.forEach((result, index) => {
      const provider = providers[index];
      if (result.status === 'fulfilled') {
        successful.push({ provider, records: result.value });
      } else {
        warnings.push(`${provider.name} image search is currently unavailable.`);
      }
    });

    if (!successful.length) {
      throw new ServiceUnavailableException(
        'Free external image search is currently unavailable.',
      );
    }

    const response: SearchResponse = {
      providers: successful.map(({ provider }) => provider.name),
      warnings,
      data: rankAndDedupe(
        successful.flatMap(({ records }) => records),
        query,
      ),
    };
    this.storeCache(cacheKey, response);
    return response;
  }

  async paidSuggestions(userId: string, query: ProductImageSuggestionsDto) {
    await this.authorize(userId, query.storeId);
    const searchText = buildSearchQuery(query);
    const cacheKey = `paid|${this.cacheKey(query)}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;
    if (!this.serpApiProvider.isConfigured()) {
      throw new ServiceUnavailableException(
        'SerpApi paid image search is not configured on the server.',
      );
    }

    const records = await this.serpApiProvider.search(searchText, {
      country: 'tn',
      language: 'en',
    });
    const response: SearchResponse = {
      providers: [this.serpApiProvider.name],
      warnings: [],
      data: rankAndDedupe(records, query),
    };
    this.storeCache(cacheKey, response);
    return response;
  }

  private async authorize(userId: string, storeId: string): Promise<void> {
    await this.storeAuthorization.requirePermission(
      userId,
      storeId,
      'inventory.create',
    );
  }

  private cacheKey(query: ProductImageSuggestionsDto): string {
    return [
      query.storeId,
      query.brand,
      query.reference,
      query.model,
      query.color,
      query.ean,
    ]
      .map((value) => normalizeCatalogueValue(value ?? ''))
      .join('|');
  }

  private getCached(key: string): SearchResponse | undefined {
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.response;
    if (cached) this.cache.delete(key);
    return undefined;
  }

  private storeCache(key: string, response: SearchResponse): void {
    if (this.cache.size >= CACHE_LIMIT) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(key, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      response,
    });
  }
}

function buildSearchQuery(query: ProductImageSuggestionsDto): string {
  const identity = [
    query.brand,
    query.reference,
    query.model,
    query.color,
    query.ean,
  ]
    .map((value) => sanitizeSearchTerm(value ?? ''))
    .filter(Boolean);
  if (!identity.length) {
    throw new BadRequestException(
      'Provide a brand, reference, model, colour, or EAN to search.',
    );
  }
  return [...identity, 'eyeglasses frame']
    .join(' ')
    .replace(/\s+/g, ' ')
    .slice(0, 240);
}

function sanitizeSearchTerm(value: string): string {
  return Array.from(value, (character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127 ? ' ' : character;
  })
    .join('')
    .trim();
}

function rankAndDedupe(
  records: ExternalImageRecord[],
  query: ProductImageSuggestionsDto,
): ExternalImageSuggestion[] {
  const unique = new Map<string, ExternalImageRecord>();
  for (const record of records) {
    const key = (record.originalImageUrl ?? record.imageUrl).toLowerCase();
    const existing = unique.get(key);
    if (!existing || (!existing.license && record.license)) {
      unique.set(key, record);
    }
  }

  return [...unique.values()]
    .map((record) => classify(record, query))
    .sort(
      (left, right) =>
        matchPriority(left.matchSignal) - matchPriority(right.matchSignal),
    )
    .slice(0, RESULT_LIMIT);
}

function classify(
  record: ExternalImageRecord,
  query: ProductImageSuggestionsDto,
): ExternalImageSuggestion {
  const searchableText = normalizeCatalogueValue(
    `${record.title} ${record.description ?? ''} ${record.keywords.join(' ')}`,
  );
  const includes = (value: string | undefined) =>
    Boolean(value && searchableText.includes(normalizeCatalogueValue(value)));
  const brand = query.brand?.trim() ?? '';
  const reference = query.reference?.trim() ?? '';
  const model = query.model?.trim() ?? '';
  const matchSignal: ExternalImageMatchSignal = query.ean && includes(query.ean)
    ? 'EAN_TEXT_MATCH'
    : brand &&
        reference &&
        includes(brand) &&
        includes(reference)
      ? 'BRAND_REFERENCE_TEXT_MATCH'
      : brand && model && includes(brand) && includes(model)
        ? 'BRAND_MODEL_TEXT_MATCH'
        : reference && includes(reference)
          ? 'REFERENCE_TEXT_MATCH'
          : 'SEARCH_CANDIDATE';

  const { keywords: _keywords, ...publicRecord } = record;
  return {
    ...publicRecord,
    matchSignal,
    isVerified: false,
    licenseStatus: record.license
      ? 'LICENSE_METADATA_AVAILABLE'
      : 'NOT_PROVIDED',
  };
}

function matchPriority(matchSignal: ExternalImageMatchSignal): number {
  switch (matchSignal) {
    case 'EAN_TEXT_MATCH':
      return 0;
    case 'BRAND_REFERENCE_TEXT_MATCH':
      return 1;
    case 'BRAND_MODEL_TEXT_MATCH':
      return 2;
    case 'REFERENCE_TEXT_MATCH':
      return 3;
    case 'SEARCH_CANDIDATE':
      return 4;
  }
}
