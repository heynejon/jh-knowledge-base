'use client';

import Link from 'next/link';
import { Article } from '@/types';

interface ArticleCardProps {
  article: Article;
  onDelete: (id: string) => void;
}

export default function ArticleCard({ article, onDelete }: ArticleCardProps) {
  const formattedDate = new Date(article.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(article.id);
  };

  return (
    <Link href={`/articles/${article.id}`} className="block">
      <div className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all group">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-medium text-gray-900 line-clamp-2 flex-1">{article.title}</h3>
          <button
            onClick={handleDeleteClick}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            title="Delete article"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
        </div>
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
          {article.publication_name && (
            <>
              <span>{article.publication_name}</span>
              <span>•</span>
            </>
          )}
          <span>{formattedDate}</span>
        </div>
      </div>
    </Link>
  );
}
