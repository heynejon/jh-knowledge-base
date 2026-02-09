import { describe, it, expect } from 'vitest';
import { filterArticles } from './search-utils';
import { Article } from '@/types';

// Helper to create mock articles
const createArticle = (overrides: Partial<Article> = {}): Article => ({
  id: '1',
  user_id: 'user-1',
  title: 'Default Title',
  publication_name: 'Default Publication',
  source_url: 'https://example.com/article',
  full_text: 'Default full text content',
  summary: 'Default summary content',
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

describe('search-utils', () => {
  describe('filterArticles', () => {
    const sampleArticles: Article[] = [
      createArticle({
        id: '1',
        title: 'Understanding JavaScript Closures',
        publication_name: 'Medium',
        summary: 'A deep dive into closures and scope',
        full_text: 'JavaScript closures are a fundamental concept...',
      }),
      createArticle({
        id: '2',
        title: 'TypeScript Best Practices',
        publication_name: 'Dev.to',
        summary: 'Tips for writing better TypeScript code',
        full_text: 'TypeScript helps catch errors at compile time...',
      }),
      createArticle({
        id: '3',
        title: 'React Hooks Guide',
        publication_name: 'React Blog',
        summary: 'Everything you need to know about hooks',
        full_text: 'Hooks let you use state in functional components...',
      }),
    ];

    it('returns all articles when search query is empty', () => {
      const result = filterArticles(sampleArticles, '');
      expect(result).toHaveLength(3);
      expect(result).toEqual(sampleArticles);
    });

    it('returns all articles when search query is only whitespace', () => {
      const result = filterArticles(sampleArticles, '   ');
      expect(result).toHaveLength(3);
    });

    it('filters by title match', () => {
      const result = filterArticles(sampleArticles, 'JavaScript');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Understanding JavaScript Closures');
    });

    it('filters by publication_name match', () => {
      const result = filterArticles(sampleArticles, 'Medium');
      expect(result).toHaveLength(1);
      expect(result[0].publication_name).toBe('Medium');
    });

    it('filters by summary match', () => {
      const result = filterArticles(sampleArticles, 'deep dive');
      expect(result).toHaveLength(1);
      expect(result[0].summary).toContain('deep dive');
    });

    it('filters by full_text match', () => {
      const result = filterArticles(sampleArticles, 'compile time');
      expect(result).toHaveLength(1);
      expect(result[0].full_text).toContain('compile time');
    });

    it('performs case-insensitive search', () => {
      const result = filterArticles(sampleArticles, 'TYPESCRIPT');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('TypeScript Best Practices');
    });

    it('performs case-insensitive search with mixed case query', () => {
      const result = filterArticles(sampleArticles, 'JaVaScRiPt');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Understanding JavaScript Closures');
    });

    it('returns multiple matches when query matches multiple articles', () => {
      // Both JavaScript and TypeScript articles mention code/programming
      const articlesWithCommonTerm = [
        createArticle({
          id: '1',
          title: 'JavaScript Basics',
          full_text: 'Learn programming with JavaScript',
        }),
        createArticle({
          id: '2',
          title: 'Python Basics',
          full_text: 'Learn programming with Python',
        }),
      ];
      const result = filterArticles(articlesWithCommonTerm, 'programming');
      expect(result).toHaveLength(2);
    });

    it('returns empty array when no matches found', () => {
      const result = filterArticles(sampleArticles, 'nonexistent term xyz123');
      expect(result).toHaveLength(0);
    });

    it('handles empty articles array', () => {
      const result = filterArticles([], 'test');
      expect(result).toHaveLength(0);
    });

    it('handles articles with null publication_name', () => {
      const articlesWithNull = [
        createArticle({
          id: '1',
          title: 'Test Article',
          publication_name: null as unknown as string,
        }),
      ];
      // Should not throw when publication_name is null
      const result = filterArticles(articlesWithNull, 'nonexistent');
      expect(result).toHaveLength(0);
    });

    it('handles articles with undefined publication_name', () => {
      const articlesWithUndefined = [
        createArticle({
          id: '1',
          title: 'Article without publication',
          publication_name: undefined as unknown as string,
        }),
      ];
      // Should not throw when publication_name is undefined
      const result = filterArticles(articlesWithUndefined, 'test');
      expect(result).toHaveLength(0);
    });

    it('matches partial words', () => {
      const result = filterArticles(sampleArticles, 'Script');
      // Should match both JavaScript and TypeScript
      expect(result).toHaveLength(2);
    });

    it('matches across multiple fields for the same article', () => {
      const articles = [
        createArticle({
          id: '1',
          title: 'React Tutorial',
          publication_name: 'React Blog',
          summary: 'React hooks explained',
          full_text: 'React is a JavaScript library...',
        }),
      ];
      // Searching for "React" should find it (appears in all fields)
      const result = filterArticles(articles, 'React');
      expect(result).toHaveLength(1);
    });

    it('preserves article order', () => {
      const result = filterArticles(sampleArticles, 'e'); // matches all articles
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
      expect(result[2].id).toBe('3');
    });

    it('handles special regex characters in search query', () => {
      const articlesWithSpecialChars = [
        createArticle({
          id: '1',
          title: 'C++ Programming',
          full_text: 'Learn C++ basics',
        }),
      ];
      // The + character is special in regex, should still work
      const result = filterArticles(articlesWithSpecialChars, 'C++');
      expect(result).toHaveLength(1);
    });

    it('handles search with leading/trailing spaces in query (after trim)', () => {
      // Note: filterArticles does trim internally
      const result = filterArticles(sampleArticles, '  TypeScript  ');
      expect(result).toHaveLength(1);
    });
  });
});
