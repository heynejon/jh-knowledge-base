import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UrlInput from './UrlInput';

describe('UrlInput', () => {
  it('renders input and button', () => {
    render(<UrlInput onSubmit={() => {}} isLoading={false} />);
    expect(screen.getByPlaceholderText('Paste article URL...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Knowledge Item' })).toBeInTheDocument();
  });

  it('disables button when input is empty', () => {
    render(<UrlInput onSubmit={() => {}} isLoading={false} />);
    const button = screen.getByRole('button', { name: 'Add Knowledge Item' });
    expect(button).toBeDisabled();
  });

  it('enables button when URL is entered', async () => {
    const user = userEvent.setup();
    render(<UrlInput onSubmit={() => {}} isLoading={false} />);

    const input = screen.getByPlaceholderText('Paste article URL...');
    await user.type(input, 'https://example.com/article');

    const button = screen.getByRole('button', { name: 'Add Knowledge Item' });
    expect(button).toBeEnabled();
  });

  it('calls onSubmit with trimmed URL when form is submitted', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    render(<UrlInput onSubmit={handleSubmit} isLoading={false} />);

    const input = screen.getByPlaceholderText('Paste article URL...');
    await user.type(input, '  https://example.com/article  ');
    await user.click(screen.getByRole('button', { name: 'Add Knowledge Item' }));

    expect(handleSubmit).toHaveBeenCalledWith('https://example.com/article');
  });

  it('shows loading state', () => {
    render(<UrlInput onSubmit={() => {}} isLoading={true} />);
    expect(screen.getByRole('button', { name: 'Processing...' })).toBeDisabled();
    expect(screen.getByPlaceholderText('Paste article URL...')).toBeDisabled();
  });

  it('does not submit when URL is only whitespace', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    render(<UrlInput onSubmit={handleSubmit} isLoading={false} />);

    const input = screen.getByPlaceholderText('Paste article URL...');
    await user.type(input, '   ');

    const button = screen.getByRole('button', { name: 'Add Knowledge Item' });
    expect(button).toBeDisabled();
  });
});
