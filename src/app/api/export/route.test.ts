import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

// Mock supabase-server
const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();

vi.mock('@/lib/supabase-server', () => ({
  createClient: vi.fn().mockImplementation(async () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}));

describe('GET /api/export', () => {
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

  it('exports articles as JSON with correct headers', async () => {
    const mockUser = { id: 'user-123' };
    const mockArticles = [
      { id: 'article-1', title: 'Test Article 1', user_id: 'user-123' },
      { id: 'article-2', title: 'Test Article 2', user_id: 'user-123' },
    ];

    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    mockOrder.mockResolvedValue({ data: mockArticles, error: null });

    const response = await GET();
    const text = await response.text();
    const data = JSON.parse(text);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/json');
    expect(response.headers.get('Content-Disposition')).toContain('attachment');
    expect(response.headers.get('Content-Disposition')).toContain('jh-knowledge-base-export');
    expect(data.exported_at).toBeDefined();
    expect(data.articles).toEqual(mockArticles);
  });

  it('returns empty articles array when user has no articles', async () => {
    const mockUser = { id: 'user-123' };

    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    mockOrder.mockResolvedValue({ data: [], error: null });

    const response = await GET();
    const text = await response.text();
    const data = JSON.parse(text);

    expect(response.status).toBe(200);
    expect(data.articles).toEqual([]);
  });

  it('returns 500 on database error', async () => {
    const mockUser = { id: 'user-123' };

    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    mockOrder.mockResolvedValue({ data: null, error: new Error('DB error') });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to export articles');
  });
});
