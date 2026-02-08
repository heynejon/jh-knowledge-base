import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PATCH, DELETE } from './route';

// Mock supabase-server
const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();

vi.mock('@/lib/supabase-server', () => ({
  createClient: vi.fn().mockImplementation(async () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}));

const createMockParams = (id: string) => Promise.resolve({ id });

describe('GET /api/articles/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = new NextRequest('http://localhost/api/articles/123');
    const response = await GET(request, { params: createMockParams('123') });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns article for authenticated user', async () => {
    const mockUser = { id: 'user-123' };
    const mockArticle = { id: 'article-123', title: 'Test', user_id: 'user-123' };

    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ eq: mockEq });
    // Chain two .eq() calls
    mockEq.mockReturnValueOnce({ eq: mockEq });
    mockEq.mockReturnValueOnce({ single: mockSingle });
    mockSingle.mockResolvedValue({ data: mockArticle, error: null });

    const request = new NextRequest('http://localhost/api/articles/article-123');
    const response = await GET(request, { params: createMockParams('article-123') });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockArticle);
  });

  it('returns 404 when article not found', async () => {
    const mockUser = { id: 'user-123' };

    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValueOnce({ eq: mockEq });
    mockEq.mockReturnValueOnce({ single: mockSingle });
    mockSingle.mockResolvedValue({ data: null, error: null });

    const request = new NextRequest('http://localhost/api/articles/nonexistent');
    const response = await GET(request, { params: createMockParams('nonexistent') });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Article not found');
  });
});

describe('PATCH /api/articles/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = new NextRequest('http://localhost/api/articles/123', {
      method: 'PATCH',
      body: JSON.stringify({ summary: 'Updated' }),
    });
    const response = await PATCH(request, { params: createMockParams('123') });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('updates article summary', async () => {
    const mockUser = { id: 'user-123' };
    const updatedArticle = { id: 'article-123', summary: 'Updated summary', user_id: 'user-123' };

    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    mockFrom.mockReturnValue({ update: mockUpdate });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValueOnce({ eq: mockEq });
    mockEq.mockReturnValueOnce({ select: mockSelect });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockSingle.mockResolvedValue({ data: updatedArticle, error: null });

    const request = new NextRequest('http://localhost/api/articles/article-123', {
      method: 'PATCH',
      body: JSON.stringify({ summary: 'Updated summary' }),
    });
    const response = await PATCH(request, { params: createMockParams('article-123') });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.summary).toBe('Updated summary');
  });

  it('returns 500 on database error', async () => {
    const mockUser = { id: 'user-123' };

    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    mockFrom.mockReturnValue({ update: mockUpdate });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValueOnce({ eq: mockEq });
    mockEq.mockReturnValueOnce({ select: mockSelect });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockSingle.mockResolvedValue({ data: null, error: new Error('DB error') });

    const request = new NextRequest('http://localhost/api/articles/article-123', {
      method: 'PATCH',
      body: JSON.stringify({ summary: 'Updated' }),
    });
    const response = await PATCH(request, { params: createMockParams('article-123') });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to update article');
  });
});

describe('DELETE /api/articles/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = new NextRequest('http://localhost/api/articles/123', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: createMockParams('123') });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('deletes article successfully', async () => {
    const mockUser = { id: 'user-123' };

    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    mockFrom.mockReturnValue({ delete: mockDelete });
    mockDelete.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValueOnce({ eq: mockEq });
    mockEq.mockResolvedValueOnce({ error: null });

    const request = new NextRequest('http://localhost/api/articles/article-123', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: createMockParams('article-123') });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('returns 500 on database error', async () => {
    const mockUser = { id: 'user-123' };

    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    mockFrom.mockReturnValue({ delete: mockDelete });
    mockDelete.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValueOnce({ eq: mockEq });
    mockEq.mockResolvedValueOnce({ error: new Error('DB error') });

    const request = new NextRequest('http://localhost/api/articles/article-123', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: createMockParams('article-123') });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to delete article');
  });
});
