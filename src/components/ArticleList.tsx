import { Article } from '@/types';
import ArticleCard from './ArticleCard';

interface ArticleListProps {
  articles: Article[];
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

function SkeletonCard() {
  return (
    <div className="bg-white p-5 border border-slate-200 rounded-xl">
      <div className="animate-shimmer h-5 w-24 rounded-full mb-3" />
      <div className="animate-shimmer h-6 w-3/4 rounded mb-2" />
      <div className="animate-shimmer h-4 w-full rounded mb-1" />
      <div className="animate-shimmer h-4 w-2/3 rounded mb-3" />
      <div className="animate-shimmer h-3 w-28 rounded" />
    </div>
  );
}

export default function ArticleList({ articles, onDelete, isLoading }: ArticleListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-1">No articles yet</h3>
        <p className="text-slate-500">Add your first knowledge item using the form above.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} onDelete={onDelete} />
      ))}
    </div>
  );
}
