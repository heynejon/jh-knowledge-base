import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBar from './SearchBar';

describe('SearchBar', () => {
  it('renders with placeholder text', () => {
    render(<SearchBar value="" onChange={() => {}} />);
    expect(screen.getByPlaceholderText('Search articles...')).toBeInTheDocument();
  });

  it('displays the provided value', () => {
    render(<SearchBar value="test query" onChange={() => {}} />);
    expect(screen.getByDisplayValue('test query')).toBeInTheDocument();
  });

  it('calls onChange when user types', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<SearchBar value="" onChange={handleChange} />);

    const input = screen.getByPlaceholderText('Search articles...');
    await user.type(input, 'new search');

    expect(handleChange).toHaveBeenCalled();
    expect(handleChange).toHaveBeenCalledWith('n'); // First character
  });
});
