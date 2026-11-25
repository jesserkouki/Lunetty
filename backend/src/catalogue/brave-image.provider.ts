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
  readKeywords,
  readSafeHttpsUrl,
  readString,
  sourceDomain,
} from './external-image-utils';

const BRAVE_API = 'https://api.search.brave.com/res/v1/images/search';
const RESULT_LIMIT = 8;

@Injectable()
export class BraveImageProvider implements ExternalImageProvider {
  readonly name = 'Brave';

  private readonly apiKey = process.env.BRAVE_API_KEY?.trim() ?? '';

  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  async search(
    query: string,
    options: ExternalImageSearchOptions = {},
  ): Promise<ExternalImageRecord[]> {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'Brave image search is not configured.',
      );
    }

    const url = new URL(BRAVE_API);
    url.searchParams.set('q', query);
    url.searchParams.set('country', options.country ?? 'TN');
    url.searchParams.set('search_lang', options.language ?? 'en');
    url.searchParams.set('safesearch', 'strict');
    url.searchParams.set('count', String(RESULT_LIMIT));

    const payload = await fetchProviderJson(url, this.name, {
      'X-Subscription-Token': this.apiKey,
    });
    if (!isRecord(payload) || !Array.isArray(payload.results)) {
      throw new ServiceUnavailableException(
        'Brave image search returned an invalid response.',
      );
    }

    return payload.results
      .slice(0, RESULT_LIMIT)
      .map(parseResult)
      .filter((record): record is ExternalImageRecord => record !== null);
  }
}

function parseResult(value: unknown): ExternalImageRecord | null {
  if (!isRecord(value) || !isRecord(value.thumbnail)) return null;

  const sourcePageUrl = readSafeHttpsUrl(value.url);
  const imageUrl = readSafeHttpsUrl(value.thumbnail.src);
  const originalImageUrl =
    isRecord(value.properties) && readSafeHttpsUrl(value.properties.url);
  const title = readString(value.title);
  const domain = sourcePageUrl ? sourceDomain(sourcePageUrl) : null;
  if (!sourcePageUrl || !imageUrl || !title || !domain) return null;

  return {
    id: readString(value.id) ?? `${sourcePageUrl}|${originalImageUrl ?? imageUrl}`,
    provider: 'Brave',
    title,
    description: readString(value.description),
    imageUrl,
    originalImageUrl: originalImageUrl || imageUrl,
    sourcePageUrl,
    sourceDomain: domain,
    creator: null,
    creatorUrl: null,
    license: null,
    licenseVersion: null,
    licenseUrl: null,
    attribution: null,
    source: domain,
    keywords: readKeywords(value.tags),
  };
}
