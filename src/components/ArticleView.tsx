'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Article } from '@/types';

interface ArticleViewProps {
  article: Article;
  onSummaryUpdate?: (summary: string) => void;
  isEditable?: boolean;
}

export default function ArticleView({ article, onSummaryUpdate, isEditable = true }: ArticleViewProps) {
  const [view, setView] = useState<'summary' | 'full'>('summary');
  const [isEditing, setIsEditing] = useState(false);
  const [editedSummary, setEditedSummary] = useState(article.summary);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!onSummaryUpdate) return;
    setIsSaving(true);
    try {
      await onSummaryUpdate(editedSummary);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedSummary(article.summary);
    setIsEditing(false);
  };

  return (
    <div>
      {/* Toggle Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit mb-6">
        <button
          onClick={() => setView('summary')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
            view === 'summary'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Summary
          </span>
        </button>
        <button
          onClick={() => setView('full')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
            view === 'full'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            Full Text
          </span>
        </button>
      </div>

      {/* Content */}
      {view === 'summary' ? (
        <div>
          {isEditing ? (
            <div className="space-y-4">
              <textarea
                value={editedSummary}
                onChange={(e) => setEditedSummary(e.target.value)}
                className="w-full h-64 p-4 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-y font-mono text-sm transition-colors duration-150"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="h-10 px-4 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all duration-150 flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Save</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="h-10 px-4 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="prose prose-slate max-w-none">
                <ReactMarkdown>{article.summary}</ReactMarkdown>
              </div>
              {isEditable && onSummaryUpdate && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-6 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-150"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Summary
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="prose prose-slate max-w-none">
          <ReactMarkdown>{article.full_text}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
