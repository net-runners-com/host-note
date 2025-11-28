import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaUser, FaUsers, FaClipboardList, FaCalendarAlt, FaHistory, FaTools, FaCog, FaTimes, FaChartBar } from 'react-icons/fa';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', icon: FaHome, label: 'ホーム' },
    { path: '/hime', icon: FaUser, label: '姫' },
    { path: '/cast', icon: FaUsers, label: 'キャスト' },
    { path: '/table', icon: FaClipboardList, label: '卓記録' },
    { path: '/calendar', icon: FaCalendarAlt, label: 'カレンダー' },
    { path: '/visit', icon: FaHistory, label: '来店履歴' },
    { path: '/analysis', icon: FaChartBar, label: '分析' },
    { path: '/tools', icon: FaTools, label: 'ツール' },
    { path: '/settings', icon: FaCog, label: '設定' },
  ];

  const handleLinkClick = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {/* オーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* サイドバー */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[var(--color-surface)] border-r border-[var(--color-border)] z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:hidden`}
      >
        <div className="flex flex-col h-full">
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
            <span className="text-xl font-bold text-[var(--color-primary)]">HostNote</span>
            <button
              onClick={onClose}
              className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] touch-manipulation"
              aria-label="メニューを閉じる"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>

          {/* ナビゲーションメニュー */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== '/' && location.pathname.startsWith(item.path));

                return (
                  <li key={item.path}>
                    <button
                      onClick={() => handleLinkClick(item.path)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors touch-manipulation ${
                        isActive
                          ? 'bg-[var(--color-primary)] text-[var(--color-background)]'
                          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-background)] hover:text-[var(--color-text)]'
                      }`}
                    >
                      <Icon className="text-xl flex-shrink-0" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </aside>
    </>
  );
};

