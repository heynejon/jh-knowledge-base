'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ExtractedArticle } from '@/types';
import ArticleView from '@/components/ArticleView';

interface NewArticleData extends ExtractedArticle {
  summary: string;
}

export default function NewItemPage() {
  const router = useRouter();
  const [article, setArticle] = useState<NewArticleData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('newArticle');
    if (stored) {
      setArticle(JSON.parse(stored));
    } else {
      router.push('/');
    }
  }, [router]);

  const handleSave = async () => {
    if (!article) return;
    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(article),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save article');
      }

      sessionStorage.removeItem('newArticle');
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save article');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    sessionStorage.removeItem('newArticle');
    router.push('/');
  };

  const handleSummaryUpdate = (newSummary: string) => {
    if (article) {
      setArticle({ ...article, summary: newSummary });
    }
  };

  if (!article) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="space-y-3">
          <div className="h-8 w-3/4 bg-slate-200 rounded" />
          <div className="h-4 w-1/2 bg-slate-200 rounded" />
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <div className="h-4 w-full bg-slate-200 rounded mb-2" />
          <div className="h-4 w-full bg-slate-200 rounded mb-2" />
          <div className="h-4 w-2/3 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  // Create a mock Article object for ArticleView
  const articleForView = {
    id: '',
    user_id: '',
    title: article.title,
    publication_name: article.publication_name,
    source_url: article.source_url,
    full_text: article.full_text,
    summary: article.summary,
    created_at: new Date().toISOString(),
  };

  return (
    <div className="space-y-6">
      {/* Header with status badge */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
              Review & Save
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
            {article.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-500">
            {article.publication_name && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                {article.publication_name}
              </span>
            )}
            <a
              href={article.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-150"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View original
            </a>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200">
        <ArticleView
          article={articleForView}
          onSummaryUpdate={handleSummaryUpdate}
          isEditable={true}
        />
      </div>

      {/* Actions */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row gap-3">
        <button
          onClick={handleDiscard}
          disabled={isSaving}
          className="h-12 px-6 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
        >
          Discard
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="h-12 px-6 text-sm font-medium text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all duration-150 flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Save to Knowledge Base</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
