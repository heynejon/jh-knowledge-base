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
    return <div className="text-center py-12 text-gray-500">Loading article...</div>;
  }

  if (error || !article) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || 'Article not found'}</p>
        <Link href="/" className="text-blue-600 hover:underline">
          Back to articles
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
      <Link href="/" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
        ← Back to articles
      </Link>

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
          <span>{formattedDate}</span>
          <span>•</span>
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
          article={article}
          onSummaryUpdate={handleSummaryUpdate}
          isEditable={true}
        />
      </div>

      {/* Delete */}
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={() => setShowDeleteModal(true)}
          className="text-sm text-red-600 hover:text-red-800"
        >
          Delete this article
        </button>
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
