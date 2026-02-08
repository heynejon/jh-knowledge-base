import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

// Mock dependencies
const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockSelect = vi.fn();
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

vi.mock('@/lib/openai', () => ({
  generateSummary: vi.fn(),
}));

import { generateSummary } from '@/lib/openai';

describe('POST /api/summarize', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default chain for settings lookup
    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ single: mockSingle });
  });

  it('returns 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = new NextRequest('http://localhost/api/summarize', {
      method: 'POST',
      body: JSON.stringify({ text: 'Some article text' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 400 when text is missing', async () => {
    const mockUser = { id: 'user-123' };
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });

    const request = new NextRequest('http://localhost/api/summarize', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Article text is required');
  });

  it('generates summary with user custom prompt', async () => {
    const mockUser = { id: 'user-123' };
    const customPrompt = 'Custom summarization instructions';

    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    mockSingle.mockResolvedValue({
      data: { summary_prompt: customPrompt },
      error: null
    });
    (generateSummary as ReturnType<typeof vi.fn>).mockResolvedValue('Generated summary');

    const request = new NextRequest('http://localhost/api/summarize', {
      method: 'POST',
      body: JSON.stringify({ text: 'Article text to summarize' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.summary).toBe('Generated summary');
    expect(generateSummary).toHaveBeenCalledWith('Article text to summarize', customPrompt);
  });

  it('uses default prompt when user has no custom settings', async () => {
    const mockUser = { id: 'user-123' };

    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    mockSingle.mockResolvedValue({ data: null, error: null });
    (generateSummary as ReturnType<typeof vi.fn>).mockResolvedValue('Generated summary');

    const request = new NextRequest('http://localhost/api/summarize', {
      method: 'POST',
      body: JSON.stringify({ text: 'Article text' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    // Should use DEFAULT_SUMMARY_PROMPT from constants
    expect(generateSummary).toHaveBeenCalled();
  });

  it('returns 500 on summarization error', async () => {
    const mockUser = { id: 'user-123' };

    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    mockSingle.mockResolvedValue({ data: null, error: null });
    (generateSummary as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('OpenAI API error')
    );

    const request = new NextRequest('http://localhost/api/summarize', {
      method: 'POST',
      body: JSON.stringify({ text: 'Article text' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('OpenAI API error');
  });
});
