/**
 * URL normalization and duplicate detection utilities
 */

// Tracking parameters to strip from URLs
const TRACKING_PARAMS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'fbclid', 'gclid', 'ref', 'source', 'mc_cid', 'mc_eid'
];

/**
 * Normalizes a URL by removing tracking parameters and trailing slashes.
 * This allows comparison of URLs that point to the same content.
 */
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove tracking parameters
    TRACKING_PARAMS.forEach(param => parsed.searchParams.delete(param));
    // Remove trailing slash and normalize
    const search = parsed.searchParams.toString();
    return parsed.origin + parsed.pathname.replace(/\/$/, '') + (search ? '?' + search : '');
  } catch {
    return url;
  }
}

/**
 * Checks if two URLs point to the same article (ignoring tracking params)
 */
export function urlsMatch(url1: string, url2: string): boolean {
  return normalizeUrl(url1) === normalizeUrl(url2);
}
