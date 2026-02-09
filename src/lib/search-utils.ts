import { Article } from '@/types';

/**
 * Filters articles based on a search query.
 * Searches across title, publication_name, summary, and full_text.
 * Case-insensitive.
 */
export function filterArticles(articles: Article[], searchQuery: string): Article[] {
  const trimmed = searchQuery.trim();
  if (!trimmed) return articles;

  const query = trimmed.toLowerCase();
  return articles.filter(
    (article) =>
      article.title.toLowerCase().includes(query) ||
      article.publication_name?.toLowerCase().includes(query) ||
      article.summary.toLowerCase().includes(query) ||
      article.full_text.toLowerCase().includes(query)
  );
}
