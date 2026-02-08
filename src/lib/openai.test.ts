import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted to create the mock before vi.mock runs
const { mockCreate } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
}));

// Mock OpenAI module
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(function() {
    return {
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    };
  }),
}));

import { generateSummary } from './openai';

describe('generateSummary', () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it('returns generated summary from OpenAI response', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'This is a test summary.' } }],
    });

    const result = await generateSummary('Article text here', 'Summarize this');

    expect(result).toBe('This is a test summary.');
    expect(mockCreate).toHaveBeenCalledWith({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Summarize this' },
        { role: 'user', content: 'Article text here' },
      ],
      max_tokens: 1000,
    });
  });

  it('returns fallback message when no content in response', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: null } }],
    });

    const result = await generateSummary('Article text', 'Summarize');

    expect(result).toBe('Failed to generate summary.');
  });

  it('returns fallback when choices array is empty', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [],
    });

    const result = await generateSummary('Article text', 'Summarize');

    expect(result).toBe('Failed to generate summary.');
  });
});
