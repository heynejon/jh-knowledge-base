import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { articleApi, Article } from '../utils/api';
import Header from '../components/Header';
import { ArticleCardSkeleton } from '../components/LoadingSpinner';
import DuplicateUrlModal from '../components/DuplicateUrlModal';
import { Card, Button, Input } from '../components/ui';
import { SearchIcon, PlusIcon, CalendarIcon, GlobeIcon, ArrowLeftIcon } from '../components/ui/Icons';

const AllArticlesScreen: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [duplicateModal, setDuplicateModal] = useState<{isOpen: boolean, articleId: string}>({isOpen: false, articleId: ''});
  const navigate = useNavigate();


  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async (search?: string) => {
    try {
      setLoading(true);
      const data = await articleApi.getAllArticles(search);
      setArticles(data);
    } catch (error) {
      console.error('Error loading articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadArticles(searchTerm);
  };

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;

    try {
      setIsCreating(true);
      const article = await articleApi.createArticle(newUrl);
      navigate(`/new-item?id=${article._id}`);
    } catch (error: any) {
      console.error('Error creating article:', error);
      
      // Check if it's a duplicate URL error (409 Conflict)
      if (error.response?.status === 409) {
        try {
          const errorMessage = error.response?.data?.detail || 'An article with this URL already exists.';
          // Check if the error message contains a link to the existing article
          if (errorMessage.includes('/article/')) {
            const linkMatch = errorMessage.match(/\/article\/(\d+)/);
            if (linkMatch) {
              const articleId = linkMatch[1];
              setDuplicateModal({isOpen: true, articleId});
              return;
            }
          } else {
            alert(errorMessage);
          }
        } catch (modalError) {
          console.error('Error in modal logic:', modalError);
          alert('An article with this URL already exists in your knowledge base.');
        }
      } else {
        alert('Failed to create article. Please check the URL and try again.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleViewExistingArticle = () => {
    setDuplicateModal({isOpen: false, articleId: ''});
    navigate(`/article/${duplicateModal.articleId}`);
    setNewUrl(''); // Clear the URL input
  };

  const handleCloseDuplicateModal = () => {
    setDuplicateModal({isOpen: false, articleId: ''});
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <Header showSettingsButton={true} />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-h1 font-heading text-gray-900 mb-2">
              Welcome back! 👋
            </h1>
            <p className="text-body-lg text-gray-600">
              You have {articles.length} article{articles.length !== 1 ? 's' : ''} in your knowledge base
            </p>
          </div>

          {/* Add New Article Section */}
          <Card className="mb-8">
            <h2 className="text-h3 font-semibold text-gray-900 mb-4">Add New Article</h2>
            <form onSubmit={handleCreateArticle} className="space-y-4">
              <Input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="Paste article URL here..."
                leftIcon={<GlobeIcon />}
                required
              />
              <Button
                type="submit"
                disabled={isCreating || !newUrl.trim()}
                isLoading={isCreating}
                leftIcon={!isCreating ? <PlusIcon /> : undefined}
                className="w-full"
              >
                {isCreating ? 'Creating Article...' : 'Add Knowledge Item'}
              </Button>
            </form>
          </Card>

          {/* Search Section */}
          <Card className="mb-8">
            <form onSubmit={handleSearch} className="flex gap-4">
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search articles..."
                leftIcon={<SearchIcon />}
                className="flex-1"
              />
              <Button type="submit" variant="secondary">
                Search
              </Button>
              {searchTerm && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setSearchTerm('');
                    loadArticles();
                  }}
                >
                  Clear
                </Button>
              )}
            </form>
          </Card>

          {/* Articles List */}
          <Card padding="none">
            {loading ? (
              <div className="p-6 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <ArticleCardSkeleton key={i} />
                ))}
              </div>
            ) : articles.length === 0 ? (
              <div className="text-center py-12 px-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <GlobeIcon className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-body-lg text-gray-500 mb-2">
                  {searchTerm ? 'No articles found' : 'No articles yet'}
                </p>
                <p className="text-body text-gray-400">
                  {searchTerm 
                    ? 'Try adjusting your search terms.' 
                    : 'Add your first article using the form above to get started!'
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {articles.map((article) => (
                  <Link
                    key={article._id}
                    to={`/article/${article._id}`}
                    className="block hover:bg-gray-50 transition-colors no-underline group"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-body-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
                            {article.title}
                          </h3>
                          <div className="flex items-center text-body-sm text-gray-500 gap-4">
                            <div className="flex items-center gap-1">
                              <GlobeIcon className="w-4 h-4" />
                              <span className="truncate max-w-[150px]">{article.publication_name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="w-4 h-4" />
                              <span>{formatDate(article.date_added)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ArrowLeftIcon className="w-5 h-5 text-gray-400 rotate-180" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Duplicate URL Modal - Rendered outside main container for proper overlay */}
      <DuplicateUrlModal
        isOpen={duplicateModal.isOpen}
        onClose={handleCloseDuplicateModal}
        onViewExisting={handleViewExistingArticle}
        articleId={duplicateModal.articleId}
      />
    </>
  );
};

export default AllArticlesScreen;