import { isIP } from 'node:net';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function readSafeHttpsUrl(value: unknown): string | null {
  const raw = readString(value);
  if (!raw) return null;

  try {
    const url = new URL(raw);
    const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      !hostname ||
      isIP(hostname.replace(/^\[|\]$/g, '')) ||
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal')
    ) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function sourceDomain(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function readKeywords(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((tag: unknown) =>
      isRecord(tag) ? readString(tag.name) : readString(tag),
    )
    .filter((name): name is string => name !== null);
}
