import React from 'react';
import { ViewState } from '../types';
import { Icons } from './Icons';

interface NavigationProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, setView }) => {
  // Only show nav on main screens
  const mainViews = [ViewState.HOME, ViewState.MAP, ViewState.CREATE_POST, ViewState.CHATS, ViewState.PROFILE, ViewState.MARKETPLACE, ViewState.ADMIN];
  if (!mainViews.includes(currentView) && currentView !== ViewState.CREATE_POST) return null;

  const navItems = [
    { view: ViewState.HOME, icon: Icons.Home, label: 'Home' },
    { view: ViewState.MARKETPLACE, icon: Icons.Market, label: 'Market' },
    { view: ViewState.CREATE_POST, icon: Icons.Plus, label: 'Post', primary: true },
    { view: ViewState.CHATS, icon: Icons.Chat, label: 'Chats' },
    { view: ViewState.PROFILE, icon: Icons.User, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg pb-safe safe-area-inset-bottom z-50 transition-colors duration-300">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = currentView === item.view;
          const Icon = item.icon;
          
          if (item.primary) {
            return (
              <button
                key={item.label}
                onClick={() => setView(item.view)}
                className="relative -top-5 bg-teal-400 hover:bg-teal-500 text-white rounded-full p-4 shadow-lg transition-transform active:scale-95"
              >
                <Icon size={28} />
              </button>
            );
          }

          return (
            <button
              key={item.label}
              onClick={() => setView(item.view)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Navigation;