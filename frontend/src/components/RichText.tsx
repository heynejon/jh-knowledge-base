import React from 'react';

interface RichTextProps {
  content: string;
  className?: string;
}

const RichText: React.FC<RichTextProps> = ({ content, className = '' }) => {
  // Function to convert plain text to HTML with basic formatting
  const formatContent = (text: string): string => {
    if (!text) return '';
    
    // Split text into paragraphs by double line breaks first
    const paragraphs = text.split(/\n\s*\n/);
    
    let formatted = paragraphs.map(paragraph => {
      if (!paragraph.trim()) return '';
      
      // Convert single line breaks within paragraphs to <br />
      let p = paragraph.replace(/\n/g, '<br />');
      
      // Convert **bold** to <strong>
      p = p.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // Convert *italic* to <em>
      p = p.replace(/\*(.*?)\*/g, '<em>$1</em>');
      
      // Convert _underline_ to <u>
      p = p.replace(/_(.*?)_/g, '<u>$1</u>');
      
      // Convert `code` to <code>
      p = p.replace(/`(.*?)`/g, '<code>$1</code>');
      
      // Convert URLs to links
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      p = p.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
      
      return `<p>${p}</p>`;
    }).filter(p => p).join('');
    
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