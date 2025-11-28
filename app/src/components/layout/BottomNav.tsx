import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaUser, FaUsers, FaClipboardList, FaCalendarAlt, FaHistory } from 'react-icons/fa';

export const BottomNav: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: FaHome, label: 'ホーム' },
    { path: '/hime', icon: FaUser, label: '姫' },
    { path: '/cast', icon: FaUsers, label: 'キャスト' },
    { path: '/table', icon: FaClipboardList, label: '卓' },
    { path: '/calendar', icon: FaCalendarAlt, label: 'カレンダー' },
    { path: '/visit', icon: FaHistory, label: '来店' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--color-surface)] border-t border-[var(--color-border)] z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path));
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full ${
                isActive
                  ? 'text-[var(--color-primary)]'
                  : 'text-[var(--color-text-secondary)]'
              }`}
            >
              <Icon className="text-xl mb-1" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

