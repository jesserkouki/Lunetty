import {
  GatewayTimeoutException,
  ServiceUnavailableException,
} from '@nestjs/common';

const REQUEST_TIMEOUT_MS = 6000;
const RESPONSE_LIMIT_BYTES = 2 * 1024 * 1024;

export async function fetchProviderJson(
  url: URL,
  providerName: string,
  headers: Record<string, string> = {},
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: 'application/json', ...headers },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    if (isTimeoutError(error)) {
      throw new GatewayTimeoutException(`${providerName} image search timed out.`);
    }
    throw new ServiceUnavailableException(
      `${providerName} image search is unavailable.`,
    );
  }

  if (response.status === 429) {
    throw new ServiceUnavailableException(
      `${providerName} image search is rate limited.`,
    );
  }
  if (!response.ok) {
    throw new ServiceUnavailableException(
      `${providerName} image search returned an error.`,
    );
  }

  let body: string;
  try {
    body = await response.text();
  } catch (error) {
    if (isTimeoutError(error)) {
      throw new GatewayTimeoutException(`${providerName} image search timed out.`);
    }
    throw new ServiceUnavailableException(
      `${providerName} image search returned an invalid response.`,
    );
  }
  if (Buffer.byteLength(body, 'utf8') > RESPONSE_LIMIT_BYTES) {
    throw new ServiceUnavailableException(
      `${providerName} image search response exceeded the size limit.`,
    );
  }

  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new ServiceUnavailableException(
      `${providerName} image search returned invalid JSON.`,
    );
  }
}

function isTimeoutError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === 'TimeoutError' || error.name === 'AbortError')
  );
}
