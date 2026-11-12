import { cacheGet, cacheSet, isFresh } from './cache.js';

/** Zähler, die im UI als "API-Statistik" angezeigt werden. */
export const stats = { network: 0, cacheHits: 0, notModified: 0, staleFallbacks: 0 };

export class HttpError extends Error {
  constructor(status, message, { rateLimited = false, resetAt = null } = {}) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.rateLimited = rateLimited;
    this.resetAt = resetAt;
  }
}

function describeError(res) {
  const remaining = res.headers.get('x-ratelimit-remaining');
  const reset = res.headers.get('x-ratelimit-reset');
  const rateLimited = (res.status === 403 || res.status === 429) && remaining === '0';
  return new HttpError(res.status, rateLimited ? 'API-Limit erreicht' : `HTTP ${res.status}`, {
    rateLimited,
    resetAt: reset ? new Date(Number(reset) * 1000) : null,
  });
}

/**
 * Lädt JSON mit Cache.
 * @param {string} url
 * @param {{headers?: object, ttl?: number, key?: string}} options
 * @returns {Promise<{data: any, response: Response|null, fromCache: boolean}>}
 */
export async function cachedJson(url, { headers = {}, ttl = 10 * 60 * 1000, key = url } = {}) {
  const cached = cacheGet(key);

  if (isFresh(cached, ttl)) {
    stats.cacheHits++;
    return { data: cached.data, response: null, fromCache: true };
  }

  const requestHeaders = { ...headers };
  if (cached?.etag) requestHeaders['If-None-Match'] = cached.etag;

  let res;
  try {
    stats.network++;
    res = await fetch(url, { headers: requestHeaders });
  } catch (networkError) {
    if (cached) {
      stats.staleFallbacks++;
      return { data: cached.data, response: null, fromCache: true };
    }
    throw networkError;
  }

  if (res.status === 304 && cached) {
    stats.notModified++;
    cacheSet(key, { data: cached.data, etag: cached.etag }); // Zeitstempel erneuern
    return { data: cached.data, response: res, fromCache: true };
  }

  if (!res.ok) {
    if (cached) {
      stats.staleFallbacks++;
      return { data: cached.data, response: res, fromCache: true };
    }
    throw describeError(res);
  }

  const data = await res.json();
  cacheSet(key, { data, etag: res.headers.get('ETag') });
  return { data, response: res, fromCache: false };
}
