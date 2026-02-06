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
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{article.title}</h1>
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
          {article.publication_name && (
            <>
              <span>{article.publication_name}</span>
              <span>•</span>
            </>
          )}
          <a
            href={article.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            View original
          </a>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <ArticleView
          article={articleForView}
          onSummaryUpdate={handleSummaryUpdate}
          isEditable={true}
        />
      </div>

      {/* Actions */}
      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isSaving ? 'Saving...' : 'Save to Knowledge Base'}
        </button>
        <button
          onClick={handleDiscard}
          disabled={isSaving}
          className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200"
        >
          Discard
        </button>
      </div>
    </div>
  );
}
