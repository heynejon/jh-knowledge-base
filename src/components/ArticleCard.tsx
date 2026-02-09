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
    <Link href={`/articles/${article.id}`} className="block group">
      <article className="bg-white p-5 border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 className="font-semibold text-slate-900 line-clamp-2 leading-snug">
              {article.title}
            </h3>

            {/* Summary preview */}
            {article.summary && (
              <p className="mt-2 text-sm text-slate-500 line-clamp-2">
                {article.summary}
              </p>
            )}

            {/* Publication and Date */}
            <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
              {article.publication_name && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                  {article.publication_name}
                </span>
              )}
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Delete button */}
          <button
            onClick={handleDeleteClick}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-150"
            title="Delete article"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </article>
    </Link>
  );
}
