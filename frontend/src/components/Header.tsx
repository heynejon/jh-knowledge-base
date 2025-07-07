import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from './ui';
import { ArrowLeftIcon, SettingsIcon, DocumentIcon } from './ui/Icons';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  showSettingsButton?: boolean;
  backPath?: string;
}

const Header: React.FC<HeaderProps> = ({
  title,
  showBackButton = false,
  showSettingsButton = true,
  backPath = '/',
}) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo/Brand and Back button */}
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Link to={backPath}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                </Button>
              </Link>
            )}
            
            {/* Brand/Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="flex items-center justify-center w-8 h-8 bg-primary-600 rounded-lg group-hover:bg-primary-700 transition-colors">
                <DocumentIcon className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-heading font-semibold text-gray-900 text-lg leading-tight">
                  {title && !isHomePage ? title : 'JH Knowledge Base'}
                </span>
                {isHomePage && (
                  <span className="text-xs text-gray-500 font-medium">
                    Personal Knowledge Management
                  </span>
                )}
              </div>
            </Link>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-2">
            {showSettingsButton && (
              <Link to="/settings">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700"
                >
                  <SettingsIcon className="w-5 h-5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;