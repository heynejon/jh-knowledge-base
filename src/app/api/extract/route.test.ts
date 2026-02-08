import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

// Mock extractor
vi.mock('@/lib/extractor', () => ({
  extractArticle: vi.fn(),
}));

import { extractArticle } from '@/lib/extractor';

describe('POST /api/extract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when URL is missing', async () => {
    const request = new NextRequest('http://localhost/api/extract', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('URL is required');
  });

  it('returns 400 for invalid URL format', async () => {
    const request = new NextRequest('http://localhost/api/extract', {
      method: 'POST',
      body: JSON.stringify({ url: 'not-a-valid-url' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid URL format');
  });

  it('extracts article from valid URL', async () => {
    const mockArticle = {
      title: 'Test Article',
      publication_name: 'Test Publication',
      full_text: 'Article content',
      source_url: 'https://example.com/article',
    };

    (extractArticle as ReturnType<typeof vi.fn>).mockResolvedValue(mockArticle);

    const request = new NextRequest('http://localhost/api/extract', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com/article' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockArticle);
    expect(extractArticle).toHaveBeenCalledWith('https://example.com/article');
  });

  it('returns 500 with error message on extraction failure', async () => {
    (extractArticle as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Failed to fetch URL')
    );

    const request = new NextRequest('http://localhost/api/extract', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com/broken' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch URL');
  });

  it('returns generic error for non-Error exceptions', async () => {
    (extractArticle as ReturnType<typeof vi.fn>).mockRejectedValue('Unknown error');

    const request = new NextRequest('http://localhost/api/extract', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com/broken' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to extract article');
  });
});
