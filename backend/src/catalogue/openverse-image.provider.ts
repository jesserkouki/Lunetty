import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type {
  ExternalImageProvider,
  ExternalImageRecord,
} from './external-image-provider';
import { fetchProviderJson } from './external-image-http';
import {
  isRecord,
  readKeywords,
  readSafeHttpsUrl,
  readString,
  sourceDomain,
} from './external-image-utils';

const OPENVERSE_API = 'https://api.openverse.org/v1/images/';
const RESULT_LIMIT = 8;
const COMMERCIAL_LICENSES = new Set(['cc0', 'pdm', 'by', 'by-sa', 'by-nd']);

@Injectable()
export class OpenverseImageProvider implements ExternalImageProvider {
  readonly name = 'Openverse';

  isConfigured(): boolean {
    return true;
  }

  async search(query: string): Promise<ExternalImageRecord[]> {
    const url = new URL(OPENVERSE_API);
    url.searchParams.set('q', query);
    url.searchParams.set('license_type', 'commercial');
    url.searchParams.set('filter_dead', 'true');
    url.searchParams.set('page_size', String(RESULT_LIMIT));

    const payload = await fetchProviderJson(url, this.name);
    if (!isRecord(payload) || !Array.isArray(payload.results)) {
      throw new ServiceUnavailableException(
        'Openverse image search returned an invalid response.',
      );
    }

    return payload.results
      .slice(0, RESULT_LIMIT)
      .map(parseResult)
      .filter((record): record is ExternalImageRecord => record !== null);
  }
}

function parseResult(value: unknown): ExternalImageRecord | null {
  if (!isRecord(value)) return null;

  const license = readString(value.license)?.toLowerCase();
  const imageUrl =
    readSafeHttpsUrl(value.thumbnail) ?? readSafeHttpsUrl(value.url);
  const originalImageUrl = readSafeHttpsUrl(value.url);
  const sourcePageUrl = readSafeHttpsUrl(value.foreign_landing_url);
  const licenseUrl = readSafeHttpsUrl(value.license_url);
  const title = readString(value.title);
  const domain = sourcePageUrl ? sourceDomain(sourcePageUrl) : null;
  if (
    !license ||
    !COMMERCIAL_LICENSES.has(license) ||
    !imageUrl ||
    !originalImageUrl ||
    !sourcePageUrl ||
    !licenseUrl ||
    !title ||
    !domain
  ) {
    return null;
  }

  return {
    id: readString(value.id) ?? sourcePageUrl,
    provider: 'Openverse',
    title,
    description: readString(value.description),
    imageUrl,
    originalImageUrl,
    sourcePageUrl,
    sourceDomain: domain,
    creator: readString(value.creator),
    creatorUrl: readSafeHttpsUrl(value.creator_url),
    license,
    licenseVersion: readString(value.license_version),
    licenseUrl,
    attribution: readString(value.attribution),
    source: readString(value.provider) ?? readString(value.source) ?? domain,
    keywords: readKeywords(value.tags),
  };
}
