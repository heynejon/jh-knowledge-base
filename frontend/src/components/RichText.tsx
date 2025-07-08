import React from 'react';

interface RichTextProps {
  content: string;
  className?: string;
}

const RichText: React.FC<RichTextProps> = ({ content, className = '' }) => {
  // Function to convert plain text to HTML with basic formatting
  const formatContent = (text: string): string => {
    if (!text) return '';
    
    // Convert line breaks to HTML breaks
    let formatted = text.replace(/\n/g, '<br />');
    
    // Convert **bold** to <strong>
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert *italic* to <em>
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Convert _underline_ to <u>
    formatted = formatted.replace(/_(.*?)_/g, '<u>$1</u>');
    
    // Convert `code` to <code>
    formatted = formatted.replace(/`(.*?)`/g, '<code>$1</code>');
    
    // Convert URLs to links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    formatted = formatted.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
    
    return formatted;
  };

  return (
    <div 
      className={`rich-text ${className}`}
      dangerouslySetInnerHTML={{ __html: formatContent(content) }}
    />
  );
};

export default RichText;