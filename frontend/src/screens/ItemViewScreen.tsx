import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { articleApi, Article } from '../utils/api';
import Header from '../components/Header';
import LoadingSpinner, { ArticleContentSkeleton } from '../components/LoadingSpinner';
import RichText from '../components/RichText';
import { Card, Button, Textarea, Toggle, ConfirmationModal, useSuccessToast, useErrorToast } from '../components/ui';
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
  const [isCleaning, setIsCleaning] = useState(false);
  const showSuccessToast = useSuccessToast();
  const showErrorToast = useErrorToast();
  
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
      showSuccessToast('Summary Updated', 'Your article summary has been saved successfully.');
    } catch (error) {
      console.error('Error saving summary:', error);
      showErrorToast('Failed to Save Summary', 'Please try again in a moment.');
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
      showSuccessToast('Article Deleted', 'The article has been removed from your knowledge base.');
      navigate('/'); // Navigate back to main screen
    } catch (error) {
      console.error('Error deleting article:', error);
      showErrorToast('Failed to Delete Article', 'Please try again in a moment.');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  const handleCleanContent = async () => {
    if (!article || !id) return;

    try {
      setIsCleaning(true);
      const response = await articleApi.cleanContent(id);
      const result = response;
      
      // Update the article with cleaned content
      setArticle({ ...article, full_text: result.article.full_text });
      
      showSuccessToast(
        'Content Cleaned', 
        `Article content has been cleaned with AI. Reduced from ${result.original_length} to ${result.cleaned_length} characters.`
      );
    } catch (error) {
      console.error('Error cleaning content:', error);
      showErrorToast('Failed to Clean Content', 'Please try again in a moment.');
    } finally {
      setIsCleaning(false);
    }
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
        <Header showBackButton={true} title="Loading..." />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <Card className="mb-4 sm:mb-6">
            <ArticleContentSkeleton />
          </Card>
          <Card>
            <ArticleContentSkeleton />
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
    <div className="min-h-screen bg-gray-50 animate-fade-in">
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
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <Toggle
              leftLabel="Summary"
              rightLabel="Article"
              isRight={viewMode === 'full'}
              onChange={(isRight) => setViewMode(isRight ? 'full' : 'summary')}
              size="md"
            />
            
            <div className="flex flex-col sm:flex-row gap-2">
              {viewMode === 'summary' && !isEditing && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  leftIcon={<EditIcon />}
                  className="w-full sm:w-[85px]"
                >
                  Edit
                </Button>
              )}
              {viewMode === 'full' && !isEditing && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCleanContent}
                  disabled={isCleaning}
                  isLoading={isCleaning}
                  className="w-full sm:w-auto"
                >
                  {isCleaning ? 'Cleaning...' : 'Clean with AI'}
                </Button>
              )}
              {!isEditing && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleDeleteClick}
                  leftIcon={<TrashIcon />}
                  className="w-full sm:w-[85px]"
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
                  <RichText content={article.summary || ''} />
                </div>
              )}
            </div>
          ) : (
            <div>
              <h2 className="text-h3 font-semibold text-gray-900 mb-4">Full Article</h2>
              <RichText content={article.full_text || ''} />
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
        message={`Delete "${article.title}"?`}
        description="This action cannot be undone. The article and its summary will be permanently removed from your knowledge base."
        confirmText="Delete Article"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
        showDetails={true}
        details={[
          "Article content will be permanently deleted",
          "Custom summary will be lost", 
          "This action cannot be reversed",
          "The article URL will no longer be tracked"
        ]}
      />
    </div>
  );
};

export default ItemViewScreen;