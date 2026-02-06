import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import { ExtractedArticle } from '@/types';

export async function extractArticle(url: string): Promise<ExtractedArticle> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; JHKnowledgeBase/1.0)',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (!article || !article.textContent) {
    throw new Error('Could not extract article content. The page may require login or have no readable content.');
  }

  // Try to get publication name from meta tags or domain
  const metaPublisher = dom.window.document.querySelector('meta[property="og:site_name"]');
  const publicationName = metaPublisher?.getAttribute('content') || new URL(url).hostname.replace('www.', '');

  return {
    title: article.title || 'Untitled',
    publication_name: publicationName,
    full_text: article.textContent.trim(),
    source_url: url,
  };
}
