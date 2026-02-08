import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ArticleCard from './ArticleCard';
import { Article } from '@/types';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockArticle: Article = {
  id: 'article-123',
  user_id: 'user-456',
  title: 'Test Article Title',
  publication_name: 'Test Publication',
  source_url: 'https://example.com/article',
  full_text: 'Full article text here...',
  summary: 'Article summary...',
  created_at: '2024-01-15T10:30:00Z',
};

describe('ArticleCard', () => {
  it('renders article title', () => {
    render(<ArticleCard article={mockArticle} onDelete={() => {}} />);
    expect(screen.getByText('Test Article Title')).toBeInTheDocument();
  });

  it('renders publication name', () => {
    render(<ArticleCard article={mockArticle} onDelete={() => {}} />);
    expect(screen.getByText('Test Publication')).toBeInTheDocument();
  });

  it('renders formatted date', () => {
    render(<ArticleCard article={mockArticle} onDelete={() => {}} />);
    expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument();
  });

  it('links to article detail page', () => {
    render(<ArticleCard article={mockArticle} onDelete={() => {}} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/articles/article-123');
  });

  it('calls onDelete with article id when delete button clicked', async () => {
    const user = userEvent.setup();
    const handleDelete = vi.fn();
    render(<ArticleCard article={mockArticle} onDelete={handleDelete} />);

    const deleteButton = screen.getByTitle('Delete article');
    await user.click(deleteButton);

    expect(handleDelete).toHaveBeenCalledWith('article-123');
  });

  it('does not render publication name when null', () => {
    const articleWithoutPublication = { ...mockArticle, publication_name: null };
    render(<ArticleCard article={articleWithoutPublication} onDelete={() => {}} />);
    expect(screen.queryByText('Test Publication')).not.toBeInTheDocument();
  });
});
