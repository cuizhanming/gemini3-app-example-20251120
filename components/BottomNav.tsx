import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, PlusCircle, MessageCircle, LogOut } from 'lucide-react';

export const BottomNav: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/upload', icon: PlusCircle, label: 'Add' },
    { path: '/chat', icon: MessageCircle, label: 'Assistant' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-ios-bg/90 backdrop-blur-md border-t border-ios-separator/50 pb-safe pt-2 px-6 flex justify-between items-center z-50 h-[84px]">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`flex flex-col items-center justify-center w-16 space-y-1 ${
            isActive(item.path) ? 'text-ios-blue' : 'text-ios-gray'
          }`}
        >
          <item.icon size={24} strokeWidth={isActive(item.path) ? 2.5 : 2} />
          <span className="text-[10px] font-medium">{item.label}</span>
        </Link>
      ))}
      <button
        onClick={onLogout}
        className="flex flex-col items-center justify-center w-16 space-y-1 text-ios-gray"
      >
        <LogOut size={24} strokeWidth={2} />
        <span className="text-[10px] font-medium">Logout</span>
      </button>
    </div>
  );
};