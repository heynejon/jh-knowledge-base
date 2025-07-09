import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { articleApi, Article } from '../utils/api';
import Header from '../components/Header';
import LoadingSpinner, { ArticleContentSkeleton } from '../components/LoadingSpinner';
import RichText from '../components/RichText';
import { ConfirmationModal, Toggle } from '../components/ui';
import { GlobeIcon, CalendarIcon, ExternalLinkIcon } from '../components/ui/Icons';

const NewItemScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const articleId = searchParams.get('id');
  
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'summary' | 'full'>('summary');
  const [isSaving, setIsSaving] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  useEffect(() => {
    if (articleId) {
      loadArticle(articleId);
    }
  }, [articleId]);

  const loadArticle = async (id: string) => {
    try {
      setLoading(true);
      const data = await articleApi.getArticle(id);
      setArticle(data);
    } catch (error) {
      console.error('Error loading article:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToKnowledgeBase = async () => {
    if (!article) return;

    try {
      setIsSaving(true);
      // Article is already saved, just navigate to it
      navigate(`/article/${article._id}`);
    } catch (error) {
      console.error('Error saving to knowledge base:', error);
      alert('Failed to save article. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardClick = () => {
    setShowDiscardModal(true);
  };

  const handleConfirmDiscard = async () => {
    if (!article) return;

    try {
      await articleApi.deleteArticle(article._id);
      navigate('/');
    } catch (error) {
      console.error('Error discarding article:', error);
      alert('Failed to discard article. Please try again.');
    }
  };

  const handleCancelDiscard = () => {
    setShowDiscardModal(false);
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
        <Header title="New Article" showBackButton={true} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <ArticleContentSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="New Article" showBackButton={true} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-500">Article not found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in">
      <Header title="New Article" showBackButton={true} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Article Header */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {article.title}
            </h1>
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4 text-body-sm text-gray-500 mb-6">
              <div className="flex items-center gap-1">
                <GlobeIcon className="w-4 h-4" />
                <span className="text-xs sm:text-sm">{article.publication_name}</span>
              </div>
              <div className="flex items-center gap-1">
                <CalendarIcon className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Added {formatDate(article.date_added)}</span>
              </div>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary-600 hover:text-primary-700 transition-colors"
              >
                <ExternalLinkIcon className="w-4 h-4" />
                <span className="text-xs sm:text-sm">View Original</span>
              </a>
            </div>
            
            {/* View Toggle */}
            <Toggle
              leftLabel="Summary"
              rightLabel="Article"
              isRight={viewMode === 'full'}
              onChange={(isRight) => setViewMode(isRight ? 'full' : 'summary')}
              size="md"
            />
          </div>

          {/* Content */}
          <div className="p-6">
            {viewMode === 'summary' ? (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
                <RichText content={article.summary || ''} />
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Full Article</h2>
                <RichText content={article.full_text || ''} />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="p-6 border-t border-gray-200">
            <div className="flex space-x-4">
              <button
                onClick={handleSaveToKnowledgeBase}
                disabled={isSaving}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isSaving ? 'Saving...' : 'Save to Knowledge Base'}
              </button>
              <button
                onClick={handleDiscardClick}
                className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Discard Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDiscardModal}
        onClose={handleCancelDiscard}
        onConfirm={handleConfirmDiscard}
        title="Discard Article"
        message={`Discard "${article?.title}"?`}
        description="The article will be permanently removed and you'll return to the main screen. Any processing work will be lost."
        confirmText="Discard Article"
        cancelText="Keep Article"
        variant="warning"
        showDetails={true}
        details={[
          "Article content will be deleted",
          "Generated summary will be lost",
          "You'll need to re-add the URL to try again"
        ]}
      />
    </div>
  );
};

export default NewItemScreen;