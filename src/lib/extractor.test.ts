import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractArticle } from './extractor';

describe('extractArticle', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    mockFetch.mockReset();
  });

  it('extracts article content from valid HTML', async () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test Article Title</title>
          <meta property="og:site_name" content="Test Publication">
        </head>
        <body>
          <article>
            <h1>Test Article Title</h1>
            <p>This is the main content of the article. It needs to be long enough for Readability to consider it valid content. Here is some more text to make it substantial. The article discusses various topics that are interesting and informative.</p>
            <p>Another paragraph with more content to ensure the article has enough text for extraction. This helps test the full functionality of the extractor module.</p>
          </article>
        </body>
      </html>
    `;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(mockHtml),
    });

    const result = await extractArticle('https://example.com/article');

    expect(result.title).toBe('Test Article Title');
    expect(result.publication_name).toBe('Test Publication');
    expect(result.source_url).toBe('https://example.com/article');
    expect(result.full_text).toContain('main content of the article');
  });

  it('uses domain as publication name when og:site_name is missing', async () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>Article</title></head>
        <body>
          <article>
            <h1>Article</h1>
            <p>This is substantial content for the article. It needs to be long enough for Readability to parse it correctly and extract the text content properly.</p>
            <p>More content here to ensure we have enough text for a valid extraction result.</p>
          </article>
        </body>
      </html>
    `;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(mockHtml),
    });

    const result = await extractArticle('https://www.example.com/article');

    expect(result.publication_name).toBe('example.com');
  });

  it('throws error on fetch failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(extractArticle('https://example.com/missing')).rejects.toThrow(
      'Failed to fetch URL: 404 Not Found'
    );
  });

  it('throws error when article cannot be parsed', async () => {
    const emptyHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>Empty</title></head>
        <body></body>
      </html>
    `;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(emptyHtml),
    });

    await expect(extractArticle('https://example.com/empty')).rejects.toThrow(
      'Could not extract article content'
    );
  });

  it('calls fetch with correct User-Agent header', async () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>Article</title></head>
        <body>
          <article>
            <h1>Article</h1>
            <p>Content that is long enough for Readability to parse. More text here to make it substantial enough for extraction.</p>
            <p>Additional paragraph for content length requirements.</p>
          </article>
        </body>
      </html>
    `;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(mockHtml),
    });

    await extractArticle('https://example.com/article');

    expect(mockFetch).toHaveBeenCalledWith('https://example.com/article', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JHKnowledgeBase/1.0)',
      },
    });
  });
});
