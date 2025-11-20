import React from 'react';
import { BottomNav } from './BottomNav';

interface LayoutProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
  onLogout: () => void;
  title?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, isAuthenticated, onLogout, title }) => {
  if (!isAuthenticated) {
    return <div className="min-h-screen bg-ios-bg">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-ios-bg flex flex-col">
       {title && (
         <header className="sticky top-0 z-40 bg-ios-bg/90 backdrop-blur-md border-b border-ios-separator/50 px-4 pt-safe-top h-[60px] flex items-center justify-center">
            <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
         </header>
       )}
      <main className="flex-1 overflow-y-auto pb-[100px] px-4 pt-4">
        {children}
      </main>
      <BottomNav onLogout={onLogout} />
    </div>
  );
};