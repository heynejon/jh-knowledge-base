'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Article } from '@/types';
import ArticleView from '@/components/ArticleView';
import ConfirmModal from '@/components/ConfirmModal';

export default function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    try {
      const res = await fetch(`/api/articles/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Article not found');
        }
        throw new Error('Failed to fetch article');
      }
      const data = await res.json();
      setArticle(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSummaryUpdate = async (newSummary: string) => {
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary: newSummary }),
      });

      if (!res.ok) throw new Error('Failed to update summary');

      const updated = await res.json();
      setArticle(updated);
    } catch (err) {
      console.error('Error updating summary:', err);
      throw err;
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete article');

      router.push('/');
    } catch (err) {
      console.error('Error deleting article:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-4 w-32 bg-slate-200 rounded" />
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

  if (error || !article) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">{error || 'Article not found'}</h3>
        <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
          ← Back to articles
        </Link>
      </div>
    );
  }

  const formattedDate = new Date(article.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors duration-150"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to articles
      </Link>

      {/* Header Card */}
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200">
        {/* Publication badge */}
        {article.publication_name && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 mb-3">
            {article.publication_name}
          </span>
        )}

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
          {article.title}
        </h1>

        {/* Metadata */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{formattedDate}</span>
          </div>
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

      {/* Content */}
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200">
        <ArticleView
          article={article}
          onSummaryUpdate={handleSummaryUpdate}
          isEditable={true}
        />
      </div>

      {/* Danger Zone */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-slate-900">Delete this article</h3>
            <p className="text-sm text-slate-500 mt-0.5">Once deleted, this cannot be undone.</p>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:text-white border border-red-200 hover:bg-red-600 hover:border-red-600 rounded-lg transition-all duration-150"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Article"
        message={`Are you sure you want to delete "${article.title}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteModal(false)}
        isLoading={isDeleting}
      />
    </div>
  );
}
