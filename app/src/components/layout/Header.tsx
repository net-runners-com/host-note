import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaBars, FaSignOutAlt, FaUser } from 'react-icons/fa';
import { Sidebar } from './Sidebar';
import { useAuthStore } from '../../stores/authStore';
import { toast } from 'react-toastify';

export const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuthStore();

  const handleLogout = () => {
    logout();
    toast.success('ログアウトしました');
    navigate('/auth/login');
  };

  return (
    <>
      <header className="bg-[var(--color-surface)] border-b border-[var(--color-border)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              {/* モバイル用ハンバーガーメニューボタン */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] touch-manipulation"
                aria-label="メニューを開く"
              >
                <FaBars className="text-xl" />
              </button>
              <Link to="/" className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-[var(--color-primary)]">HostNote</span>
              </Link>
            </div>
            <nav className="hidden md:flex space-x-4">
            <Link
              to="/"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                location.pathname === '/'
                  ? 'bg-[var(--color-primary)] text-[var(--color-background)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
              }`}
            >
              ホーム
            </Link>
            <Link
              to="/hime"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                location.pathname.startsWith('/hime')
                  ? 'bg-[var(--color-primary)] text-[var(--color-background)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
              }`}
            >
              姫
            </Link>
            <Link
              to="/cast"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                location.pathname.startsWith('/cast')
                  ? 'bg-[var(--color-primary)] text-[var(--color-background)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
              }`}
            >
              キャスト
            </Link>
            <Link
              to="/table"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                location.pathname.startsWith('/table')
                  ? 'bg-[var(--color-primary)] text-[var(--color-background)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
              }`}
            >
              卓記録
            </Link>
            <Link
              to="/calendar"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                location.pathname.startsWith('/calendar')
                  ? 'bg-[var(--color-primary)] text-[var(--color-background)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
              }`}
            >
              カレンダー
            </Link>
            <Link
              to="/visit"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                location.pathname.startsWith('/visit')
                  ? 'bg-[var(--color-primary)] text-[var(--color-background)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
              }`}
            >
              来店履歴
            </Link>
            <Link
              to="/analysis"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                location.pathname.startsWith('/analysis')
                  ? 'bg-[var(--color-primary)] text-[var(--color-background)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
              }`}
            >
              分析
            </Link>
            <Link
              to="/tools"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                location.pathname.startsWith('/tools')
                  ? 'bg-[var(--color-primary)] text-[var(--color-background)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
              }`}
            >
              ツール
            </Link>
            <Link
              to="/settings"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                location.pathname.startsWith('/settings')
                  ? 'bg-[var(--color-primary)] text-[var(--color-background)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
              }`}
            >
              設定
            </Link>
          </nav>
          {isAuthenticated && user && (
            <div className="flex items-center space-x-4">
              <Link
                to="/settings"
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-background-secondary)] transition-colors touch-manipulation"
              >
                <FaUser />
                <span>{user.username}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-background-secondary)] transition-colors touch-manipulation"
              >
                <FaSignOutAlt />
                <span className="hidden sm:inline">ログアウト</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
    <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
};

