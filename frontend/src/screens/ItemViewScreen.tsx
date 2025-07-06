import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { articleApi, Article } from '../utils/api';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';

const ItemViewScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'summary' | 'full'>('summary');
  const [isEditing, setIsEditing] = useState(false);
  const [editedSummary, setEditedSummary] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      // Ensure summary is properly formatted for Quill
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

  const insertFormatting = (tag: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = editedSummary.substring(start, end);
    
    let replacement = '';
    if (selectedText) {
      // Wrap selected text
      replacement = `<${tag}>${selectedText}</${tag}>`;
    } else {
      // Insert tags at cursor
      replacement = `<${tag}></${tag}>`;
    }
    
    const newText = editedSummary.substring(0, start) + replacement + editedSummary.substring(end);
    setEditedSummary(newText);
    
    // Set cursor position
    setTimeout(() => {
      const newPosition = selectedText ? start + replacement.length : start + tag.length + 2;
      textarea.focus();
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    const text = prompt('Enter link text:') || url;
    if (url && text) {
      insertCustomTag(`<a href="${url}">${text}</a>`);
    }
  };

  const insertCustomTag = (content: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    const newText = editedSummary.substring(0, start) + content + editedSummary.substring(end);
    setEditedSummary(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + content.length, start + content.length);
    }, 0);
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
                  <div className="space-y-4">
                    {/* Formatting Toolbar */}
                    <div className="border border-gray-300 rounded-md p-2 bg-gray-50">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => insertFormatting('strong')}
                          className="px-3 py-1 bg-white border border-gray-300 rounded text-sm font-bold hover:bg-gray-100"
                          title="Bold"
                        >
                          B
                        </button>
                        <button
                          type="button"
                          onClick={() => insertFormatting('em')}
                          className="px-3 py-1 bg-white border border-gray-300 rounded text-sm italic hover:bg-gray-100"
                          title="Italic"
                        >
                          I
                        </button>
                        <button
                          type="button"
                          onClick={() => insertFormatting('u')}
                          className="px-3 py-1 bg-white border border-gray-300 rounded text-sm underline hover:bg-gray-100"
                          title="Underline"
                        >
                          U
                        </button>
                        <button
                          type="button"
                          onClick={() => insertFormatting('h3')}
                          className="px-3 py-1 bg-white border border-gray-300 rounded text-sm font-semibold hover:bg-gray-100"
                          title="Heading"
                        >
                          H3
                        </button>
                        <button
                          type="button"
                          onClick={insertLink}
                          className="px-3 py-1 bg-white border border-gray-300 rounded text-sm text-blue-600 hover:bg-gray-100"
                          title="Link"
                        >
                          Link
                        </button>
                        <button
                          type="button"
                          onClick={() => insertCustomTag('<li></li>')}
                          className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-100"
                          title="List Item"
                        >
                          • Li
                        </button>
                      </div>
                    </div>
                    <textarea
                      ref={textareaRef}
                      value={editedSummary}
                      onChange={(e) => setEditedSummary(e.target.value)}
                      className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                      placeholder="Edit the summary... Use the toolbar above to add formatting."
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveSummary}
                        disabled={isSaving}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="formatted-text text-gray-800"
                    dangerouslySetInnerHTML={{ 
                      __html: article.summary
                    }}
                  />
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