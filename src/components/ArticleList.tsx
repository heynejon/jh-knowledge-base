import { Article } from '@/types';
import ArticleCard from './ArticleCard';

interface ArticleListProps {
  articles: Article[];
  onDelete: (id: string) => void;
}

export default function ArticleList({ articles, onDelete }: ArticleListProps) {
  if (articles.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No articles yet. Add your first knowledge item above.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} onDelete={onDelete} />
      ))}
    </div>
  );
}
