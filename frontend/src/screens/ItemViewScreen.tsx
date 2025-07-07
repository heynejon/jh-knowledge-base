import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { articleApi, Article } from '../utils/api';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import { Card, Button, Textarea, ConfirmationModal } from '../components/ui';
import { EditIcon, TrashIcon, ExternalLinkIcon, CalendarIcon, GlobeIcon } from '../components/ui/Icons';

const ItemViewScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'summary' | 'full'>('summary');
  const [isEditing, setIsEditing] = useState(false);
  const [editedSummary, setEditedSummary] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
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

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!article || !id) return;

    try {
      setIsDeleting(true);
      await articleApi.deleteArticle(id);
      navigate('/'); // Navigate back to main screen
    } catch (error) {
      console.error('Error deleting article:', error);
      alert('Failed to delete article. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
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
        <Header showBackButton={true} title="Article" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showBackButton={true} title="Article Not Found" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <GlobeIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-h3 text-gray-900 mb-2">Article not found</h2>
              <p className="text-body text-gray-500">The article you're looking for doesn't exist or has been removed.</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showBackButton={true} title={article.title} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Article Metadata */}
        <Card className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-h1 font-heading text-gray-900 mb-4">
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
          
          {/* View Toggle with Action Buttons */}
          <div className="flex flex-col gap-4">
            <div className="flex gap-2 w-full">
              <Button
                variant={viewMode === 'summary' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setViewMode('summary')}
                className="flex-1 sm:flex-none"
              >
                Summary
              </Button>
              <Button
                variant={viewMode === 'full' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setViewMode('full')}
                className="flex-1 sm:flex-none"
              >
                Full Article
              </Button>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              {viewMode === 'summary' && !isEditing && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  leftIcon={<EditIcon />}
                  className="w-full sm:w-auto"
                >
                  Edit Summary
                </Button>
              )}
              {!isEditing && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleDeleteClick}
                  leftIcon={<TrashIcon />}
                  className="w-full sm:w-auto"
                >
                  Delete
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Content */}
        <Card>
          {viewMode === 'summary' ? (
            <div>
              {isEditing ? (
                <div>
                  <h2 className="text-h3 font-semibold text-gray-900 mb-4">Edit Summary</h2>
                  <Textarea
                    value={editedSummary}
                    onChange={(e) => setEditedSummary(e.target.value)}
                    rows={12}
                    placeholder="Enter your summary here..."
                    className="mb-4"
                  />
                  <div className="flex gap-3">
                    <Button
                      onClick={handleSaveSummary}
                      disabled={isSaving}
                      isLoading={isSaving}
                      variant="primary"
                    >
                      {isSaving ? 'Saving Summary...' : 'Save Summary'}
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      variant="secondary"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-h3 font-semibold text-gray-900 mb-4">Summary</h2>
                  <div className="formatted-text text-gray-700">
                    {article.summary}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <h2 className="text-h3 font-semibold text-gray-900 mb-4">Full Article</h2>
              <div className="formatted-text text-gray-700">
                {article.full_text}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Article"
        message={`Are you sure you want to delete "${article.title}"? This action cannot be undone.`}
        confirmText="Delete Article"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ItemViewScreen;