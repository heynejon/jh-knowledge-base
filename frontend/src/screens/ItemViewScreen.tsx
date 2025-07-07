import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { articleApi, Article } from '../utils/api';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';

const ItemViewScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'summary' | 'full'>('summary');
  const [isEditing, setIsEditing] = useState(false);
  const [editedSummary, setEditedSummary] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Simple edit mode without any external dependencies

  useEffect(() => {
    if (id) {
      loadArticle(id);
    }
  }, [id]);


  const loadArticle = async (articleId: string) => {
    try {
      setLoading(true);
      const data = await articleApi.getArticle(articleId);
      setArticle(data);
      setEditedSummary(data.summary || '');
    } catch (error) {
      console.error('Error loading article:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSummary = async () => {
    if (!article || !id) return;

    try {
      setIsSaving(true);
      await articleApi.updateArticle(id, { summary: editedSummary });
      setArticle({ ...article, summary: editedSummary });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving summary:', error);
      alert('Failed to save summary. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedSummary(article?.summary || '');
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showBackButton={true} />
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showBackButton={true} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-500">Article not found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showBackButton={true} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Article Header */}
          <div className="p-6 border-b border-gray-200 text-left">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {article.title}
            </h1>
            <div className="flex items-center text-sm text-gray-500 space-x-4 mb-4">
              <span>Source: {article.publication_name}</span>
              <span>•</span>
              <span>Added: {formatDate(article.date_added)}</span>
              <span>•</span>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                View Original
              </a>
            </div>
            
            {/* View Toggle with Edit Button */}
            <div className="flex justify-between items-center">
              <div className="flex space-x-4">
                <button
                  onClick={() => setViewMode('summary')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'summary'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Summary
                </button>
                <button
                  onClick={() => setViewMode('full')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'full'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Full Article
                </button>
              </div>
              {viewMode === 'summary' && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 rounded-md text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                >
                  Edit
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 text-left">
            {viewMode === 'summary' ? (
              <div>
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Summary</h2>
                </div>
                
                {isEditing ? (
                  <div style={{marginTop: '16px'}}>
                    <label style={{display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px'}}>
                      Edit Summary
                    </label>
                    <textarea
                      value={editedSummary}
                      onChange={(e) => setEditedSummary(e.target.value)}
                      rows={10}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        lineHeight: '1.5',
                        resize: 'vertical',
                        outline: 'none'
                      }}
                      placeholder="Enter your summary here..."
                    />
                    <div style={{marginTop: '16px', display: 'flex', gap: '12px'}}>
                      <button
                        onClick={handleSaveSummary}
                        disabled={isSaving}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: isSaving ? '#9CA3AF' : '#2563EB',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          cursor: isSaving ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {isSaving ? 'Saving...' : 'Save Summary'}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#E5E7EB',
                          color: '#374151',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          cursor: isSaving ? 'not-allowed' : 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="formatted-text text-gray-800 whitespace-pre-wrap">
                    {article.summary}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Full Article</h2>
                <div className="formatted-text text-gray-800 whitespace-pre-wrap">
                  {article.full_text}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemViewScreen;