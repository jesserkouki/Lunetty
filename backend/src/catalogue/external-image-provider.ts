export interface ExternalImageRecord {
  id: string;
  provider: string;
  title: string;
  description: string | null;
  imageUrl: string;
  originalImageUrl: string | null;
  sourcePageUrl: string;
  sourceDomain: string;
  creator: string | null;
  creatorUrl: string | null;
  license: string | null;
  licenseVersion: string | null;
  licenseUrl: string | null;
  attribution: string | null;
  source: string;
  keywords: string[];
}

export interface ExternalImageSearchOptions {
  country?: string;
  language?: string;
}

export interface ExternalImageProvider {
  readonly name: string;
  isConfigured(): boolean;
  search(
    query: string,
    options?: ExternalImageSearchOptions,
  ): Promise<ExternalImageRecord[]>;
}
