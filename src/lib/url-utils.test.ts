import { describe, it, expect } from 'vitest';
import { normalizeUrl, urlsMatch } from './url-utils';

describe('url-utils', () => {
  describe('normalizeUrl', () => {
    it('returns URL without changes when no tracking params present', () => {
      const url = 'https://example.com/article/my-post';
      expect(normalizeUrl(url)).toBe('https://example.com/article/my-post');
    });

    it('removes trailing slash', () => {
      const url = 'https://example.com/article/';
      expect(normalizeUrl(url)).toBe('https://example.com/article');
    });

    it('removes utm_source parameter', () => {
      const url = 'https://example.com/article?utm_source=twitter';
      expect(normalizeUrl(url)).toBe('https://example.com/article');
    });

    it('removes utm_medium parameter', () => {
      const url = 'https://example.com/article?utm_medium=social';
      expect(normalizeUrl(url)).toBe('https://example.com/article');
    });

    it('removes utm_campaign parameter', () => {
      const url = 'https://example.com/article?utm_campaign=spring2024';
      expect(normalizeUrl(url)).toBe('https://example.com/article');
    });

    it('removes utm_term parameter', () => {
      const url = 'https://example.com/article?utm_term=keyword';
      expect(normalizeUrl(url)).toBe('https://example.com/article');
    });

    it('removes utm_content parameter', () => {
      const url = 'https://example.com/article?utm_content=header';
      expect(normalizeUrl(url)).toBe('https://example.com/article');
    });

    it('removes fbclid (Facebook) parameter', () => {
      const url = 'https://example.com/article?fbclid=abc123xyz';
      expect(normalizeUrl(url)).toBe('https://example.com/article');
    });

    it('removes gclid (Google Ads) parameter', () => {
      const url = 'https://example.com/article?gclid=abc123xyz';
      expect(normalizeUrl(url)).toBe('https://example.com/article');
    });

    it('removes ref parameter', () => {
      const url = 'https://example.com/article?ref=homepage';
      expect(normalizeUrl(url)).toBe('https://example.com/article');
    });

    it('removes source parameter', () => {
      const url = 'https://example.com/article?source=newsletter';
      expect(normalizeUrl(url)).toBe('https://example.com/article');
    });

    it('removes mc_cid (Mailchimp) parameter', () => {
      const url = 'https://example.com/article?mc_cid=abc123';
      expect(normalizeUrl(url)).toBe('https://example.com/article');
    });

    it('removes mc_eid (Mailchimp) parameter', () => {
      const url = 'https://example.com/article?mc_eid=xyz789';
      expect(normalizeUrl(url)).toBe('https://example.com/article');
    });

    it('removes multiple tracking params at once', () => {
      const url = 'https://example.com/article?utm_source=twitter&utm_medium=social&utm_campaign=launch&fbclid=abc123';
      expect(normalizeUrl(url)).toBe('https://example.com/article');
    });

    it('preserves non-tracking query params', () => {
      const url = 'https://example.com/search?q=javascript&page=2';
      expect(normalizeUrl(url)).toBe('https://example.com/search?q=javascript&page=2');
    });

    it('preserves non-tracking params while removing tracking params', () => {
      const url = 'https://example.com/search?q=javascript&utm_source=google&page=2';
      expect(normalizeUrl(url)).toBe('https://example.com/search?q=javascript&page=2');
    });

    it('handles URLs with fragments (hash)', () => {
      // Note: URL class strips fragments, this tests current behavior
      const url = 'https://example.com/article#section1';
      const result = normalizeUrl(url);
      expect(result).toContain('https://example.com/article');
    });

    it('handles invalid URLs by returning them unchanged', () => {
      const invalidUrl = 'not-a-valid-url';
      expect(normalizeUrl(invalidUrl)).toBe('not-a-valid-url');
    });

    it('handles empty string', () => {
      expect(normalizeUrl('')).toBe('');
    });

    it('normalizes protocol to lowercase', () => {
      const url = 'HTTPS://EXAMPLE.COM/article';
      const result = normalizeUrl(url);
      expect(result).toBe('https://example.com/article');
    });

    it('handles URLs with ports', () => {
      const url = 'https://example.com:8080/article?utm_source=test';
      expect(normalizeUrl(url)).toBe('https://example.com:8080/article');
    });

    it('handles URLs with authentication (auth is stripped by URL.origin)', () => {
      // Note: URL.origin strips auth info for security reasons
      const url = 'https://user:pass@example.com/article?utm_source=test';
      expect(normalizeUrl(url)).toBe('https://example.com/article');
    });
  });

  describe('urlsMatch', () => {
    it('returns true for identical URLs', () => {
      const url = 'https://example.com/article';
      expect(urlsMatch(url, url)).toBe(true);
    });

    it('returns true when only tracking params differ', () => {
      const url1 = 'https://example.com/article';
      const url2 = 'https://example.com/article?utm_source=twitter';
      expect(urlsMatch(url1, url2)).toBe(true);
    });

    it('returns true when both have different tracking params', () => {
      const url1 = 'https://example.com/article?utm_source=twitter';
      const url2 = 'https://example.com/article?fbclid=abc123';
      expect(urlsMatch(url1, url2)).toBe(true);
    });

    it('returns true when trailing slashes differ', () => {
      const url1 = 'https://example.com/article';
      const url2 = 'https://example.com/article/';
      expect(urlsMatch(url1, url2)).toBe(true);
    });

    it('returns false for different paths', () => {
      const url1 = 'https://example.com/article1';
      const url2 = 'https://example.com/article2';
      expect(urlsMatch(url1, url2)).toBe(false);
    });

    it('returns false for different domains', () => {
      const url1 = 'https://example.com/article';
      const url2 = 'https://other.com/article';
      expect(urlsMatch(url1, url2)).toBe(false);
    });

    it('returns false when non-tracking query params differ', () => {
      const url1 = 'https://example.com/search?q=javascript';
      const url2 = 'https://example.com/search?q=typescript';
      expect(urlsMatch(url1, url2)).toBe(false);
    });

    it('returns true with complex real-world UTM URLs', () => {
      const cleanUrl = 'https://medium.com/@author/my-great-article-123abc';
      const trackedUrl = 'https://medium.com/@author/my-great-article-123abc?utm_source=twitter&utm_medium=social&utm_campaign=share&utm_content=post';
      expect(urlsMatch(cleanUrl, trackedUrl)).toBe(true);
    });
  });
});
