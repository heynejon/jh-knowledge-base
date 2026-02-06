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
      {/* Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setView('summary')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            view === 'summary'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Summary
        </button>
        <button
          onClick={() => setView('full')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            view === 'full'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Full Text
        </button>
      </div>

      {/* Content */}
      {view === 'summary' ? (
        <div>
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={editedSummary}
                onChange={(e) => setEditedSummary(e.target.value)}
                className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="prose prose-gray max-w-none">
                <ReactMarkdown>{article.summary}</ReactMarkdown>
              </div>
              {isEditable && onSummaryUpdate && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-4 px-4 py-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  Edit Summary
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="prose prose-gray max-w-none">
          <ReactMarkdown>{article.full_text}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
