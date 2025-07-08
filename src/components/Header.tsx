import React from 'react';
import { Icon } from './Icon';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, showBack, onBack, onLogout }) => {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-stone-900/80 backdrop-blur-sm border-b border-stone-800 flex items-center justify-between px-4 z-50 shadow-md">
      <div className="flex items-center">
        {showBack && onBack && (
          <button onClick={onBack} className="p-2 mr-2 -ml-2 rounded-full hover:bg-stone-800 transition-colors">
            <Icon type="back" className="w-6 h-6 text-stone-100" />
          </button>
        )}
        <h1 className="text-xl font-bold text-stone-100">{title}</h1>
      </div>
      {onLogout && (
        <button onClick={onLogout} className="p-2 -mr-2 rounded-full hover:bg-stone-800 transition-colors">
          <Icon type="logout" className="w-6 h-6 text-stone-300" />
        </button>
      )}
    </header>
  );
};