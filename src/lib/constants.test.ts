import { describe, it, expect } from 'vitest';
import { DEFAULT_SUMMARY_PROMPT } from './constants';

describe('constants', () => {
  describe('DEFAULT_SUMMARY_PROMPT', () => {
    it('is a non-empty string', () => {
      expect(typeof DEFAULT_SUMMARY_PROMPT).toBe('string');
      expect(DEFAULT_SUMMARY_PROMPT.length).toBeGreaterThan(0);
    });

    it('is a reasonable length for an LLM prompt', () => {
      // Prompt should be substantial but not excessively long
      expect(DEFAULT_SUMMARY_PROMPT.length).toBeGreaterThan(50);
      expect(DEFAULT_SUMMARY_PROMPT.length).toBeLessThan(2000);
    });
  });
});
