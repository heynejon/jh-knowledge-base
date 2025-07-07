import React from 'react';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="ml-3 text-lg font-medium text-gray-900">
            Article Already Exists
          </h3>
        </div>
        
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            An article with this URL already exists in your knowledge base. 
            Would you like to view the existing article?
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={onViewExisting}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            View Existing Article
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DuplicateUrlModal;