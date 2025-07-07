import React from 'react';
import { Modal, Button } from './ui';
import { DocumentIcon } from './ui/Icons';

interface DuplicateUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewExisting: () => void;
  articleId: string;
}

const DuplicateUrlModal: React.FC<DuplicateUrlModalProps> = ({
  isOpen,
  onClose,
  onViewExisting,
  articleId
}) => {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Article Already Exists"
      size="sm"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
          <DocumentIcon className="w-5 h-5 text-primary-600" />
        </div>
        <div className="flex-1">
          <p className="text-body text-gray-700">
            An article with this URL already exists in your knowledge base. 
            Would you like to view the existing article instead?
          </p>
        </div>
      </div>
      
      <div className="flex gap-3 mt-6">
        <Button
          variant="primary"
          onClick={onViewExisting}
          className="flex-1"
        >
          View Existing Article
        </Button>
        <Button
          variant="secondary"
          onClick={onClose}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </Modal>
  );
};

export default DuplicateUrlModal;