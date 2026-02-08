import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ArticleView from './ArticleView';
import { Article } from '@/types';

// Mock react-markdown to avoid parsing complexity in tests
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <div data-testid="markdown">{children}</div>,
}));

const mockArticle: Article = {
  id: 'article-123',
  user_id: 'user-456',
  title: 'Test Article',
  publication_name: 'Test Publication',
  source_url: 'https://example.com/article',
  full_text: 'This is the full text of the article.',
  summary: 'This is the summary of the article.',
  created_at: '2024-01-15T10:30:00Z',
};

describe('ArticleView', () => {
  describe('view toggle', () => {
    it('shows summary view by default', () => {
      render(<ArticleView article={mockArticle} />);
      expect(screen.getByText('This is the summary of the article.')).toBeInTheDocument();
    });

    it('switches to full text view when clicked', async () => {
      const user = userEvent.setup();
      render(<ArticleView article={mockArticle} />);

      await user.click(screen.getByRole('button', { name: 'Full Text' }));

      expect(screen.getByText('This is the full text of the article.')).toBeInTheDocument();
    });

    it('switches back to summary view', async () => {
      const user = userEvent.setup();
      render(<ArticleView article={mockArticle} />);

      await user.click(screen.getByRole('button', { name: 'Full Text' }));
      await user.click(screen.getByRole('button', { name: 'Summary' }));

      expect(screen.getByText('This is the summary of the article.')).toBeInTheDocument();
    });

    it('highlights active view button', async () => {
      const user = userEvent.setup();
      render(<ArticleView article={mockArticle} />);

      const summaryButton = screen.getByRole('button', { name: 'Summary' });
      const fullTextButton = screen.getByRole('button', { name: 'Full Text' });

      // Summary is active by default
      expect(summaryButton).toHaveClass('bg-blue-600');
      expect(fullTextButton).not.toHaveClass('bg-blue-600');

      await user.click(fullTextButton);

      expect(fullTextButton).toHaveClass('bg-blue-600');
      expect(summaryButton).not.toHaveClass('bg-blue-600');
    });
  });

  describe('edit mode', () => {
    it('shows Edit Summary button when editable and has onSummaryUpdate', () => {
      render(<ArticleView article={mockArticle} onSummaryUpdate={() => {}} isEditable={true} />);
      expect(screen.getByRole('button', { name: 'Edit Summary' })).toBeInTheDocument();
    });

    it('hides Edit Summary button when isEditable is false', () => {
      render(<ArticleView article={mockArticle} onSummaryUpdate={() => {}} isEditable={false} />);
      expect(screen.queryByRole('button', { name: 'Edit Summary' })).not.toBeInTheDocument();
    });

    it('hides Edit Summary button when onSummaryUpdate is not provided', () => {
      render(<ArticleView article={mockArticle} isEditable={true} />);
      expect(screen.queryByRole('button', { name: 'Edit Summary' })).not.toBeInTheDocument();
    });

    it('enters edit mode when Edit Summary is clicked', async () => {
      const user = userEvent.setup();
      render(<ArticleView article={mockArticle} onSummaryUpdate={() => {}} />);

      await user.click(screen.getByRole('button', { name: 'Edit Summary' }));

      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('populates textarea with current summary', async () => {
      const user = userEvent.setup();
      render(<ArticleView article={mockArticle} onSummaryUpdate={() => {}} />);

      await user.click(screen.getByRole('button', { name: 'Edit Summary' }));

      expect(screen.getByRole('textbox')).toHaveValue('This is the summary of the article.');
    });

    it('cancels edit and reverts changes', async () => {
      const user = userEvent.setup();
      render(<ArticleView article={mockArticle} onSummaryUpdate={() => {}} />);

      await user.click(screen.getByRole('button', { name: 'Edit Summary' }));
      await user.clear(screen.getByRole('textbox'));
      await user.type(screen.getByRole('textbox'), 'New summary text');
      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      // Should be back to view mode with original summary
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.getByText('This is the summary of the article.')).toBeInTheDocument();
    });

    it('calls onSummaryUpdate with new text when saved', async () => {
      const user = userEvent.setup();
      const handleUpdate = vi.fn().mockResolvedValue(undefined);
      render(<ArticleView article={mockArticle} onSummaryUpdate={handleUpdate} />);

      await user.click(screen.getByRole('button', { name: 'Edit Summary' }));
      await user.clear(screen.getByRole('textbox'));
      await user.type(screen.getByRole('textbox'), 'Updated summary');
      await user.click(screen.getByRole('button', { name: 'Save' }));

      expect(handleUpdate).toHaveBeenCalledWith('Updated summary');
    });

    it('shows saving state during save', async () => {
      const user = userEvent.setup();
      let resolveUpdate: () => void;
      const handleUpdate = vi.fn().mockImplementation(
        () => new Promise<void>((resolve) => { resolveUpdate = resolve; })
      );
      render(<ArticleView article={mockArticle} onSummaryUpdate={handleUpdate} />);

      await user.click(screen.getByRole('button', { name: 'Edit Summary' }));
      await user.click(screen.getByRole('button', { name: 'Save' }));

      expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();

      // Resolve the promise
      resolveUpdate!();
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: 'Saving...' })).not.toBeInTheDocument();
      });
    });

    it('exits edit mode after successful save', async () => {
      const user = userEvent.setup();
      const handleUpdate = vi.fn().mockResolvedValue(undefined);
      render(<ArticleView article={mockArticle} onSummaryUpdate={handleUpdate} />);

      await user.click(screen.getByRole('button', { name: 'Edit Summary' }));
      await user.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => {
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      });
    });
  });
});
