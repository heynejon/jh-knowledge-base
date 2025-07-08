import React, { useEffect, useState } from 'react';
import Button from './Button';
import Input from './Input';
import { CloseIcon } from './Icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    
    // Handle escape key
    const handleEscape = (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === 'Escape') {
        onClose();
      }
    };

    if (closeOnEscape) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.body.style.overflow = 'unset';
      if (closeOnEscape) {
        document.removeEventListener('keydown', handleEscape);
      }
    };
  }, [isOpen, onClose, closeOnEscape]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fade-in backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div 
        className={`w-full ${sizeClasses[size]} bg-white rounded-lg shadow-modal animate-scale-in transform transition-all duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            {title && (
              <h2 className="text-h3 font-semibold text-gray-900">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-1"
                aria-label="Close modal"
              >
                <CloseIcon />
              </Button>
            )}
          </div>
        )}
        
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// Confirmation Modal component for common use cases
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
  requireTyping?: string; // User must type this text to confirm
  showDetails?: boolean;
  details?: string[];
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  isLoading = false,
  requireTyping,
  showDetails = false,
  details = [],
}) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [showDetailsList, setShowDetailsList] = useState(false);
  
  // Reset confirmation text when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setConfirmationText('');
      setShowDetailsList(false);
    }
  }, [isOpen]);
  
  const canConfirm = requireTyping 
    ? confirmationText.trim() === requireTyping.trim() 
    : true;
  const iconColors = {
    danger: 'text-error-600',
    warning: 'text-warning-600',
    info: 'text-primary-600',
  };

  const buttonVariants = {
    danger: 'danger' as const,
    warning: 'primary' as const,
    info: 'primary' as const,
  };

  const icons = {
    danger: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
    warning: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
    info: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm" closeOnOverlayClick={!requireTyping}>
      <div className="space-y-4">
        {/* Icon and main message */}
        <div className="flex items-start space-x-4">
          <div className={`flex-shrink-0 ${iconColors[variant]} animate-bounce-gentle`}>
            {icons[variant]}
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-body text-gray-900 font-medium">
              {message}
            </p>
            {description && (
              <p className="text-body-sm text-gray-600">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Details section */}
        {showDetails && details.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <button
              onClick={() => setShowDetailsList(!showDetailsList)}
              className="flex items-center text-body-sm text-gray-700 hover:text-gray-900 transition-colors"
            >
              <svg 
                className={`w-4 h-4 mr-2 transition-transform ${showDetailsList ? 'rotate-90' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {showDetailsList ? 'Hide details' : 'Show details'} ({details.length} items)
            </button>
            
            {showDetailsList && (
              <div className="mt-3 pl-6 space-y-1 animate-fade-in-up">
                {details.map((detail, index) => (
                  <div key={index} className="text-body-sm text-gray-600 flex items-center">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 flex-shrink-0"></span>
                    {detail}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Confirmation typing requirement */}
        {requireTyping && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-body-sm text-yellow-800 mb-3">
              To confirm this action, please type <code className="bg-yellow-100 px-1 rounded font-mono text-xs">{requireTyping}</code> in the field below:
            </p>
            <Input
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={`Type "${requireTyping}" to confirm`}
              className="font-mono"
              autoFocus
            />
          </div>
        )}
      </div>
      
      <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={isLoading}
          className="min-w-[80px]"
        >
          {cancelText}
        </Button>
        <Button
          variant={buttonVariants[variant]}
          onClick={onConfirm}
          isLoading={isLoading}
          disabled={!canConfirm}
          className="min-w-[100px]"
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
};

export default Modal;