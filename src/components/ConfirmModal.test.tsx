import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmModal from './ConfirmModal';

describe('ConfirmModal', () => {
  const defaultProps = {
    isOpen: true,
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  it('renders nothing when isOpen is false', () => {
    render(<ConfirmModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();
  });

  it('renders title and message when open', () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
  });

  it('uses default button text', () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('uses custom button text when provided', () => {
    render(
      <ConfirmModal
        {...defaultProps}
        confirmText="Delete"
        cancelText="Keep"
      />
    );
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Keep' })).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup();
    const handleConfirm = vi.fn();
    render(<ConfirmModal {...defaultProps} onConfirm={handleConfirm} />);

    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const handleCancel = vi.fn();
    render(<ConfirmModal {...defaultProps} onCancel={handleCancel} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const handleCancel = vi.fn();
    render(<ConfirmModal {...defaultProps} onCancel={handleCancel} />);

    // Click the backdrop (the dark overlay behind the modal)
    const backdrop = document.querySelector('.bg-black\\/50');
    await user.click(backdrop!);

    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  it('shows loading state when isLoading is true', () => {
    render(<ConfirmModal {...defaultProps} isLoading={true} />);

    expect(screen.getByRole('button', { name: 'Processing...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });

  it('disables buttons during loading', () => {
    render(<ConfirmModal {...defaultProps} isLoading={true} />);

    const confirmButton = screen.getByRole('button', { name: 'Processing...' });
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });

    expect(confirmButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });
});
