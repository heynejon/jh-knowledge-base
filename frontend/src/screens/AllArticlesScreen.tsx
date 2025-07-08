import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { articleApi, Article } from '../utils/api';
import Header from '../components/Header';
import { ArticleCardSkeleton, ArticleGridSkeleton } from '../components/LoadingSpinner';
import DuplicateUrlModal from '../components/DuplicateUrlModal';
import { Card, Button, Input, useErrorToast } from '../components/ui';
import { SearchIcon, PlusIcon, CalendarIcon, GlobeIcon, ArrowLeftIcon, FilterIcon, SortIcon, GridIcon, ListIcon } from '../components/ui/Icons';

type SortOption = 'newest' | 'oldest' | 'title' | 'publication';
type ViewMode = 'list' | 'grid';

const AllArticlesScreen: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [duplicateModal, setDuplicateModal] = useState<{isOpen: boolean, articleId: string}>({isOpen: false, articleId: ''});
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPublication, setSelectedPublication] = useState('');
  const navigate = useNavigate();
  const showErrorToast = useErrorToast();


  useEffect(() => {
    loadArticles();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [articles, searchTerm, sortBy, selectedPublication]);

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

  const applyFiltersAndSort = () => {
    let filtered = [...articles];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.publication_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (article.summary || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply publication filter
    if (selectedPublication) {
      filtered = filtered.filter(article => article.publication_name === selectedPublication);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.date_added).getTime() - new Date(a.date_added).getTime();
        case 'oldest':
          return new Date(a.date_added).getTime() - new Date(b.date_added).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'publication':
          return a.publication_name.localeCompare(b.publication_name);
        default:
          return 0;
      }
    });

    setFilteredArticles(filtered);
  };

  const getUniquePublications = () => {
    const publications = articles.map(article => article.publication_name);
    const uniquePublications = Array.from(new Set(publications));
    return uniquePublications.sort();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is now handled by the useEffect with applyFiltersAndSort
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedPublication('');
    setSortBy('newest');
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
            showErrorToast('Duplicate Article', errorMessage);
          }
        } catch (modalError) {
          console.error('Error in modal logic:', modalError);
          showErrorToast('Duplicate Article', 'An article with this URL already exists in your knowledge base.');
        }
      } else {
        showErrorToast('Failed to Create Article', 'Please check the URL and try again.');
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
      <div className="min-h-screen bg-gray-50 animate-fade-in">
        <Header showSettingsButton={true} />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Welcome Section */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-h1 font-heading text-gray-900 mb-2">
              Welcome back! 👋
            </h1>
            <p className="text-body sm:text-body-lg text-gray-600">
              You have {articles.length} article{articles.length !== 1 ? 's' : ''} in your knowledge base
              {filteredArticles.length !== articles.length && (
                <span className="text-primary-600 block sm:inline"> • {filteredArticles.length} showing</span>
              )}
            </p>
          </div>

          {/* Add New Article Section */}
          <Card className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-h3 font-semibold text-gray-900 mb-4">Add New Article</h2>
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
                size="sm"
              >
                {isCreating ? 'Creating Article...' : 'Add Knowledge Item'}
              </Button>
            </form>
          </Card>

          {/* Search and Filter Section */}
          <Card className="mb-6 sm:mb-8">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search articles..."
                  leftIcon={<SearchIcon />}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowFilters(!showFilters)}
                  leftIcon={<FilterIcon />}
                  className="w-full sm:w-auto"
                  size="sm"
                >
                  Filters
                </Button>
              </div>

              {/* Filter Controls */}
              {showFilters && (
                <div className="border-t pt-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Sort By */}
                    <div>
                      <label className="block text-body-sm font-medium text-gray-700 mb-2">
                        Sort By
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="title">Title A-Z</option>
                        <option value="publication">Publication A-Z</option>
                      </select>
                    </div>

                    {/* Publication Filter */}
                    <div>
                      <label className="block text-body-sm font-medium text-gray-700 mb-2">
                        Publication
                      </label>
                      <select
                        value={selectedPublication}
                        onChange={(e) => setSelectedPublication(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">All Publications</option>
                        {getUniquePublications().map(pub => (
                          <option key={pub} value={pub}>{pub}</option>
                        ))}
                      </select>
                    </div>

                    {/* View Mode */}
                    <div className="sm:col-span-2 lg:col-span-1">
                      <label className="block text-body-sm font-medium text-gray-700 mb-2">
                        View Mode
                      </label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={viewMode === 'list' ? 'primary' : 'secondary'}
                          size="sm"
                          onClick={() => setViewMode('list')}
                          leftIcon={<ListIcon />}
                          className="flex-1 sm:flex-none"
                        >
                          <span className="hidden sm:inline">List</span>
                        </Button>
                        <Button
                          type="button"
                          variant={viewMode === 'grid' ? 'primary' : 'secondary'}
                          size="sm"
                          onClick={() => setViewMode('grid')}
                          leftIcon={<GridIcon />}
                          className="flex-1 sm:flex-none"
                        >
                          <span className="hidden sm:inline">Grid</span>
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Clear Filters */}
                  {(searchTerm || selectedPublication || sortBy !== 'newest') && (
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={clearAllFilters}
                        size="sm"
                      >
                        Clear All Filters
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Articles List */}
          <Card padding="none">
            {loading ? (
              <div className={viewMode === 'grid' ? 'p-6' : 'p-6 space-y-4'}>
                {viewMode === 'list' ? (
                  <div className="divide-y divide-gray-200">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="p-6">
                        <ArticleCardSkeleton />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {[...Array(6)].map((_, i) => (
                      <ArticleGridSkeleton key={i} />
                    ))}
                  </div>
                )}
              </div>
            ) : articles.length === 0 ? (
              <div className="text-center py-12 px-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <GlobeIcon className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-body-lg text-gray-500 mb-2">No articles yet</p>
                <p className="text-body text-gray-400">
                  Add your first article using the form above to get started!
                </p>
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="text-center py-12 px-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <SearchIcon className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-body-lg text-gray-500 mb-2">No articles found</p>
                <p className="text-body text-gray-400 mb-4">
                  Try adjusting your search terms or filters.
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={clearAllFilters}
                  size="sm"
                >
                  Clear All Filters
                </Button>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'p-6' : ''}>
                {viewMode === 'list' ? (
                  <div className="divide-y divide-gray-200">
                    {filteredArticles.map((article, index) => (
                      <Link
                        key={article._id}
                        to={`/article/${article._id}`}
                        className="block hover:bg-gray-50 transition-all duration-200 no-underline group hover:shadow-sm rounded-lg animate-fade-in-up"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="p-4 sm:p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-body sm:text-body-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
                                {article.title}
                              </h3>
                              <div className="flex flex-col sm:flex-row sm:items-center text-body-sm text-gray-500 gap-2 sm:gap-4">
                                <div className="flex items-center gap-1">
                                  <GlobeIcon className="w-4 h-4 flex-shrink-0" />
                                  <span className="truncate text-xs sm:text-sm">{article.publication_name}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <CalendarIcon className="w-4 h-4 flex-shrink-0" />
                                  <span className="text-xs sm:text-sm">{formatDate(article.date_added)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="ml-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:translate-x-1">
                              <ArrowLeftIcon className="w-5 h-5 text-gray-400 rotate-180" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {filteredArticles.map((article, index) => (
                      <Link
                        key={article._id}
                        to={`/article/${article._id}`}
                        className="block no-underline group animate-fade-in-up"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <Card className="h-full hover:shadow-md transition-all duration-200 transform hover:-translate-y-1" padding="sm">
                          <div className="space-y-2 sm:space-y-3">
                            <h3 className="text-body sm:text-body-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
                              {article.title}
                            </h3>
                            <div className="flex items-center text-body-sm text-gray-500 gap-2 sm:gap-3">
                              <div className="flex items-center gap-1">
                                <GlobeIcon className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate text-xs sm:text-sm">{article.publication_name}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-body-sm text-gray-400">
                              <CalendarIcon className="w-4 h-4 flex-shrink-0" />
                              <span className="text-xs sm:text-sm">{formatDate(article.date_added)}</span>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
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