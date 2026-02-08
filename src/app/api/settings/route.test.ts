import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PATCH } from './route';

// Mock supabase-server
const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockInsert = vi.fn();
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

describe('GET /api/settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns settings with default prompt when user has no settings', async () => {
    const mockUser = { id: 'user-123' };
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });

    // First call for settings table
    mockFrom.mockReturnValueOnce({ select: mockSelect });
    mockSelect.mockReturnValueOnce({ eq: mockEq });
    mockEq.mockReturnValueOnce({ single: mockSingle });
    mockSingle.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

    // Second call for settings_defaults table
    mockFrom.mockReturnValueOnce({ select: mockSelect });
    mockSelect.mockReturnValueOnce({ eq: mockEq });
    mockEq.mockReturnValueOnce({ single: mockSingle });
    mockSingle.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user_id).toBe('user-123');
    expect(data.summary_prompt).toBeDefined();
  });
});

describe('PATCH /api/settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = new NextRequest('http://localhost/api/settings', {
      method: 'PATCH',
      body: JSON.stringify({ summary_prompt: 'New prompt' }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 400 when summary_prompt is missing for default action', async () => {
    const mockUser = { id: 'user-123' };
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });

    const request = new NextRequest('http://localhost/api/settings', {
      method: 'PATCH',
      body: JSON.stringify({}),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Summary prompt is required');
  });

  it('updates settings with new prompt', async () => {
    const mockUser = { id: 'user-123' };
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });

    // Check for existing settings
    mockFrom.mockReturnValueOnce({ select: mockSelect });
    mockSelect.mockReturnValueOnce({ eq: mockEq });
    mockEq.mockReturnValueOnce({ single: mockSingle });
    mockSingle.mockResolvedValueOnce({ data: { id: 'settings-id' }, error: null });

    // Update settings
    mockFrom.mockReturnValueOnce({ update: mockUpdate });
    mockUpdate.mockReturnValueOnce({ eq: mockEq });
    mockEq.mockResolvedValueOnce({ error: null });

    const request = new NextRequest('http://localhost/api/settings', {
      method: 'PATCH',
      body: JSON.stringify({ summary_prompt: 'Updated prompt' }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.summary_prompt).toBe('Updated prompt');
  });

  it('handles reset_to_default action', async () => {
    const mockUser = { id: 'user-123' };
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });

    // Get defaults
    mockFrom.mockReturnValueOnce({ select: mockSelect });
    mockSelect.mockReturnValueOnce({ eq: mockEq });
    mockEq.mockReturnValueOnce({ single: mockSingle });
    mockSingle.mockResolvedValueOnce({ data: { default_prompt: 'Default prompt' }, error: null });

    // Check for existing settings
    mockFrom.mockReturnValueOnce({ select: mockSelect });
    mockSelect.mockReturnValueOnce({ eq: mockEq });
    mockEq.mockReturnValueOnce({ single: mockSingle });
    mockSingle.mockResolvedValueOnce({ data: { id: 'settings-id' }, error: null });

    // Update settings
    mockFrom.mockReturnValueOnce({ update: mockUpdate });
    mockUpdate.mockReturnValueOnce({ eq: mockEq });
    mockEq.mockResolvedValueOnce({ error: null });

    const request = new NextRequest('http://localhost/api/settings', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'reset_to_default' }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.summary_prompt).toBe('Default prompt');
  });
});
