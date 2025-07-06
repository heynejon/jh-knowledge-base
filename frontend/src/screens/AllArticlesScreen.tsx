import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { articleApi, Article } from '../utils/api';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';

const AllArticlesScreen: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);
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
    } catch (error) {
      console.error('Error creating article:', error);
      alert('Failed to create article. Please check the URL and try again.');
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showSettingsButton={true} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add New Article Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Article</h2>
          <form onSubmit={handleCreateArticle} className="space-y-4">
            <div>
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="Paste article URL here..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isCreating || !newUrl.trim()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isCreating ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creating Article...
                </>
              ) : (
                'Add Knowledge Item'
              )}
            </button>
          </form>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <form onSubmit={handleSearch} className="flex space-x-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search articles..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Search
            </button>
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  loadArticles();
                }}
                className="text-gray-600 hover:text-gray-900 px-2"
              >
                Clear
              </button>
            )}
          </form>
        </div>

        {/* Articles List */}
        <div className="bg-white rounded-lg shadow-sm">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {searchTerm ? 'No articles found matching your search.' : 'No articles yet. Add your first article above!'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {articles.map((article) => (
                <Link
                  key={article._id}
                  to={`/article/${article._id}`}
                  className="block hover:bg-gray-50 transition-colors"
                >
                  <div className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 text-left">
                        <h3 className="text-base font-medium text-gray-900 mb-1 line-clamp-2">
                          {article.title}
                        </h3>
                        <div className="flex items-center text-xs text-gray-500 space-x-3">
                          <span>Source: {article.publication_name}</span>
                          <span>•</span>
                          <span>Added: {formatDate(article.date_added)}</span>
                        </div>
                      </div>
                      <div className="ml-3 flex-shrink-0">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllArticlesScreen;