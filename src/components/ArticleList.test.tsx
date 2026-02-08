import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ArticleList from './ArticleList';
import { Article } from '@/types';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockArticles: Article[] = [
  {
    id: 'article-1',
    user_id: 'user-456',
    title: 'First Article',
    publication_name: 'Publication One',
    source_url: 'https://example.com/1',
    full_text: 'Full text 1',
    summary: 'Summary 1',
    created_at: '2024-01-15T10:30:00Z',
  },
  {
    id: 'article-2',
    user_id: 'user-456',
    title: 'Second Article',
    publication_name: 'Publication Two',
    source_url: 'https://example.com/2',
    full_text: 'Full text 2',
    summary: 'Summary 2',
    created_at: '2024-01-16T10:30:00Z',
  },
];

describe('ArticleList', () => {
  it('shows empty state when no articles', () => {
    render(<ArticleList articles={[]} onDelete={() => {}} />);
    expect(screen.getByText('No articles yet. Add your first knowledge item above.')).toBeInTheDocument();
  });

  it('renders all articles', () => {
    render(<ArticleList articles={mockArticles} onDelete={() => {}} />);
    expect(screen.getByText('First Article')).toBeInTheDocument();
    expect(screen.getByText('Second Article')).toBeInTheDocument();
  });

  it('renders correct number of article cards', () => {
    render(<ArticleList articles={mockArticles} onDelete={() => {}} />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
  });

  it('passes onDelete handler to article cards', () => {
    const handleDelete = vi.fn();
    render(<ArticleList articles={mockArticles} onDelete={handleDelete} />);

    // Each ArticleCard should receive the onDelete prop
    // We verify by checking the delete buttons exist
    const deleteButtons = screen.getAllByTitle('Delete article');
    expect(deleteButtons).toHaveLength(2);
  });

  it('does not show empty state when articles exist', () => {
    render(<ArticleList articles={mockArticles} onDelete={() => {}} />);
    expect(screen.queryByText('No articles yet. Add your first knowledge item above.')).not.toBeInTheDocument();
  });
});
