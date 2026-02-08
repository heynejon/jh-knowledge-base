import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from './route';

// Mock supabase-server
const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockSingle = vi.fn();

vi.mock('@/lib/supabase-server', () => ({
  createClient: vi.fn().mockImplementation(async () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}));

describe('GET /api/articles', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup chain
    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ order: mockOrder });
  });

  it('returns 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns articles for authenticated user', async () => {
    const mockUser = { id: 'user-123' };
    const mockArticles = [
      { id: 'article-1', title: 'Test Article', user_id: 'user-123' },
    ];

    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    mockOrder.mockResolvedValue({ data: mockArticles, error: null });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockArticles);
    expect(mockFrom).toHaveBeenCalledWith('articles');
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123');
  });

  it('returns 500 on database error', async () => {
    const mockUser = { id: 'user-123' };
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    mockOrder.mockResolvedValue({ data: null, error: new Error('DB error') });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch articles');
  });
});

describe('POST /api/articles', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup chain for insert
    mockFrom.mockReturnValue({ insert: mockInsert });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ single: mockSingle });
  });

  it('returns 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = new NextRequest('http://localhost/api/articles', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 400 when required fields are missing', async () => {
    const mockUser = { id: 'user-123' };
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });

    const request = new NextRequest('http://localhost/api/articles', {
      method: 'POST',
      body: JSON.stringify({ title: 'Only title' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing required fields');
  });

  it('creates article with all required fields', async () => {
    const mockUser = { id: 'user-123' };
    const articleData = {
      title: 'Test Article',
      publication_name: 'Test Pub',
      source_url: 'https://example.com',
      full_text: 'Full text content',
      summary: 'Summary content',
    };
    const createdArticle = { id: 'new-article-id', ...articleData, user_id: 'user-123' };

    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    mockSingle.mockResolvedValue({ data: createdArticle, error: null });

    const request = new NextRequest('http://localhost/api/articles', {
      method: 'POST',
      body: JSON.stringify(articleData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toEqual(createdArticle);
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: 'user-123',
      ...articleData,
    });
  });

  it('returns 500 on database error', async () => {
    const mockUser = { id: 'user-123' };
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    mockSingle.mockResolvedValue({ data: null, error: new Error('DB error') });

    const request = new NextRequest('http://localhost/api/articles', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test',
        source_url: 'https://example.com',
        full_text: 'Text',
        summary: 'Summary',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to save article');
  });
});
