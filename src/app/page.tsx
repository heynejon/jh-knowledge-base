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
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedPublication, setSelectedPublication] = useState('');

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

  // Get unique publications for filter dropdown
  const publications = useMemo(() => {
    const pubs = articles
      .map(a => a.publication_name)
      .filter((p): p is string => !!p);
    return [...new Set(pubs)].sort();
  }, [articles]);

  const hasActiveFilters = dateFrom || dateTo || selectedPublication;

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSelectedPublication('');
  };

  const filteredArticles = useMemo(() => {
    let result = filterArticles(articles, searchQuery);

    // Apply date filters
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      result = result.filter(a => new Date(a.created_at) >= fromDate);
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999); // Include the entire end date
      result = result.filter(a => new Date(a.created_at) <= toDate);
    }

    // Apply publication filter
    if (selectedPublication) {
      result = result.filter(a => a.publication_name === selectedPublication);
    }

    return result;
  }, [articles, searchQuery, dateFrom, dateTo, selectedPublication]);

  return (
    <div className="space-y-8">
      {/* URL Input Section */}
      <section className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Add New Article</h2>
        </div>
        <UrlInput onSubmit={handleAddArticle} isLoading={isLoading} />
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </section>

      {/* Search and Filter */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <div className="flex-1">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`h-11 px-5 text-sm font-medium border rounded-lg transition-all duration-150 flex items-center justify-center gap-2 ${
              hasActiveFilters
                ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filter
            {hasActiveFilters && (
              <span className="w-2 h-2 bg-blue-600 rounded-full" />
            )}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white p-4 rounded-lg border border-slate-200 animate-scale-in">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Date Range */}
              <div className="flex-1 space-y-2">
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Date Range
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="flex-1 h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-150"
                  />
                  <span className="text-slate-400 text-sm">to</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="flex-1 h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-150"
                  />
                </div>
              </div>

              {/* Publication */}
              <div className="flex-1 space-y-2">
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Publication
                </label>
                <select
                  value={selectedPublication}
                  onChange={(e) => setSelectedPublication(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-150"
                >
                  <option value="">All publications</option>
                  {publications.map((pub) => (
                    <option key={pub} value={pub}>{pub}</option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="h-10 px-4 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors duration-150"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Articles List */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Your Articles
            {!isLoadingArticles && articles.length > 0 && (
              <span className="ml-2 text-sm font-normal text-slate-500">
                ({filteredArticles.length}{(searchQuery || hasActiveFilters) && ` of ${articles.length}`})
              </span>
            )}
          </h2>
        </div>
        <ArticleList
          articles={filteredArticles}
          onDelete={handleDeleteClick}
          isLoading={isLoadingArticles}
        />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setDuplicateArticle(null)}
          />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-scale-in">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 text-center mb-2">Article Already Exists</h3>
            <p className="text-slate-600 text-center mb-6">
              &ldquo;{duplicateArticle.existingTitle}&rdquo; is already in your knowledge base.
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                onClick={handleSummarizeAgain}
                className="flex-1 h-11 px-4 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors duration-150"
              >
                Summarize Again
              </button>
              <button
                onClick={handleGoToExisting}
                className="flex-1 h-11 px-4 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-150"
              >
                View Existing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
