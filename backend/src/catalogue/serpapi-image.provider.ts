import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import type {
  ExternalImageProvider,
  ExternalImageRecord,
  ExternalImageSearchOptions,
} from './external-image-provider';
import { fetchProviderJson } from './external-image-http';
import {
  isRecord,
  readSafeHttpsUrl,
  readString,
  sourceDomain,
} from './external-image-utils';

const SERPAPI_ENDPOINT = 'https://serpapi.com/search';
const RESULT_LIMIT = 8;

@Injectable()
export class SerpApiImageProvider implements ExternalImageProvider {
  readonly name = 'SerpApi';

  private readonly apiKey = process.env.SERPAPI_API_KEY?.trim() ?? '';

  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  async search(
    query: string,
    options: ExternalImageSearchOptions = {},
  ): Promise<ExternalImageRecord[]> {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'SerpApi image search is not configured.',
      );
    }

    const url = new URL(SERPAPI_ENDPOINT);
    url.searchParams.set('engine', 'google_images');
    url.searchParams.set('q', query);
    url.searchParams.set('api_key', this.apiKey);
    url.searchParams.set('gl', options.country ?? 'tn');
    url.searchParams.set('hl', options.language ?? 'en');

    const payload = await fetchProviderJson(url, this.name);
    if (
      !isRecord(payload) ||
      typeof payload.error === 'string' ||
      !Array.isArray(payload.images_results)
    ) {
      throw new ServiceUnavailableException(
        'SerpApi image search returned an invalid response.',
      );
    }

    return payload.images_results
      .slice(0, RESULT_LIMIT)
      .map(parseResult)
      .filter((record): record is ExternalImageRecord => record !== null);
  }
}

function parseResult(value: unknown): ExternalImageRecord | null {
  if (!isRecord(value)) return null;

  const sourcePageUrl = readSafeHttpsUrl(value.link);
  const imageUrl =
    readSafeHttpsUrl(value.thumbnail) ?? readSafeHttpsUrl(value.original);
  const originalImageUrl = readSafeHttpsUrl(value.original);
  const title = readString(value.title);
  const domain = sourcePageUrl ? sourceDomain(sourcePageUrl) : null;
  if (!sourcePageUrl || !imageUrl || !title || !domain) return null;

  return {
    id: `${sourcePageUrl}|${originalImageUrl ?? imageUrl}`,
    provider: 'SerpApi',
    title,
    description: null,
    imageUrl,
    originalImageUrl,
    sourcePageUrl,
    sourceDomain: domain,
    creator: null,
    creatorUrl: null,
    license: null,
    licenseVersion: null,
    licenseUrl: null,
    attribution: null,
    source: readString(value.source) ?? domain,
    keywords: [],
  };
}
