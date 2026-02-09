'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Article } from '@/types';
import UrlInput from '@/components/UrlInput';
import SearchBar from '@/components/SearchBar';
import ArticleList from '@/components/ArticleList';
import ConfirmModal from '@/components/ConfirmModal';
import { normalizeUrl } from '@/lib/url-utils';
import { filterArticles } from '@/lib/search-utils';

export default function Home() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingArticles, setIsLoadingArticles] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [duplicateArticle, setDuplicateArticle] = useState<{ url: string; existingId: string; existingTitle: string } | null>(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const res = await fetch('/api/articles');
      if (!res.ok) throw new Error('Failed to fetch articles');
      const data = await res.json();
      setArticles(data);
    } catch (err) {
      console.error('Error fetching articles:', err);
    } finally {
      setIsLoadingArticles(false);
    }
  };

  const checkForDuplicate = (url: string): Article | undefined => {
    const normalizedInput = normalizeUrl(url);
    return articles.find(a => normalizeUrl(a.source_url) === normalizedInput);
  };

  const handleAddArticle = async (url: string) => {
    // Check for duplicate
    const existing = checkForDuplicate(url);
    if (existing) {
      setDuplicateArticle({ url, existingId: existing.id, existingTitle: existing.title });
      return;
    }

    await processArticle(url);
  };

  const handleGoToExisting = () => {
    if (!duplicateArticle) return;
    router.push(`/articles/${duplicateArticle.existingId}`);
    setDuplicateArticle(null);
  };

  const handleSummarizeAgain = async () => {
    if (!duplicateArticle) return;
    const url = duplicateArticle.url;
    setDuplicateArticle(null);
    await processArticle(url);
  };

  const processArticle = async (url: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Extract article
      const extractRes = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!extractRes.ok) {
        const data = await extractRes.json();
        throw new Error(data.error || 'Failed to extract article');
      }

      const extracted = await extractRes.json();

      // Generate summary
      const summarizeRes = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: extracted.full_text }),
      });

      if (!summarizeRes.ok) {
        const data = await summarizeRes.json();
        throw new Error(data.error || 'Failed to generate summary');
      }

      const { summary } = await summarizeRes.json();

      // Store in sessionStorage and navigate to new item page
      sessionStorage.setItem('newArticle', JSON.stringify({
        ...extracted,
        summary,
      }));

      router.push('/new');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    const article = articles.find(a => a.id === id);
    if (article) {
      setDeleteTarget({ id, title: article.title });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/articles/${deleteTarget.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete article');

      setArticles(articles.filter(a => a.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error('Error deleting article:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = async () => {
    window.location.href = '/api/export';
  };

  const filteredArticles = useMemo(() => {
    return filterArticles(articles, searchQuery);
  }, [articles, searchQuery]);

  return (
    <div className="space-y-8">
      {/* URL Input Section */}
      <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <UrlInput onSubmit={handleAddArticle} isLoading={isLoading} />
        {error && (
          <p className="mt-3 text-red-600 text-sm">{error}</p>
        )}
      </section>

      {/* Search and Export */}
      <section className="flex gap-4 items-center">
        <div className="flex-1">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
        <button
          onClick={handleExport}
          disabled={articles.length === 0}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Export JSON
        </button>
      </section>

      {/* Articles List */}
      <section>
        {isLoadingArticles ? (
          <div className="text-center py-12 text-gray-500">Loading articles...</div>
        ) : (
          <ArticleList articles={filteredArticles} onDelete={handleDeleteClick} />
        )}
      </section>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Delete Article"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isDeleting}
      />

      {/* Duplicate Article Modal */}
      {duplicateArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDuplicateArticle(null)}
          />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Article Already Exists</h3>
            <p className="text-gray-600 mb-6">
              "{duplicateArticle.existingTitle}" is already in your knowledge base.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleSummarizeAgain}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Summarize Again
              </button>
              <button
                onClick={handleGoToExisting}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Take Me To It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
