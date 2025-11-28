import React, { useState } from 'react';
import { Memo } from '../../types/common';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale/ja';
import { Button } from './Button';

interface MemoListProps {
  memos: Memo[];
  onAdd: (content: string) => void;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
}

export const MemoList: React.FC<MemoListProps> = ({ memos, onAdd, onEdit, onDelete }) => {
  const [newMemo, setNewMemo] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  const handleAdd = () => {
    if (newMemo.trim()) {
      onAdd(newMemo.trim());
      setNewMemo('');
    }
  };

  const handleStartEdit = (memo: Memo) => {
    setEditingId(memo.id);
    setEditingContent(memo.content);
  };

  const handleSaveEdit = () => {
    if (editingId && editingContent.trim()) {
      onEdit(editingId, editingContent.trim());
      setEditingId(null);
      setEditingContent('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingContent('');
  };

  const sortedMemos = [...memos].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">メモを追加</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <textarea
            value={newMemo}
            onChange={(e) => setNewMemo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleAdd();
              }
            }}
            placeholder="メモを入力（Ctrl+Enterで保存）"
            rows={3}
            className="flex-1 px-3 py-2.5 min-h-[80px] bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-base"
          />
          <Button type="button" onClick={handleAdd} className="w-full sm:w-auto sm:flex-shrink-0">
            追加
          </Button>
        </div>
      </div>

      {sortedMemos.length === 0 ? (
        <p className="text-[var(--color-text-secondary)] italic text-sm">メモはありません</p>
      ) : (
        <div className="space-y-3">
          {sortedMemos.map((memo) => (
            <div
              key={memo.id}
              className="p-3 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg"
            >
              {editingId === memo.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2.5 min-h-[80px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-base"
                  />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button type="button" onClick={handleSaveEdit} size="sm" className="flex-1 sm:flex-none">
                      保存
                    </Button>
                    <Button type="button" variant="secondary" onClick={handleCancelEdit} size="sm" className="flex-1 sm:flex-none">
                      キャンセル
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {format(new Date(memo.createdAt), 'yyyy年MM月dd日 HH:mm', { locale: ja })}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(memo)}
                        className="px-2 py-1 min-h-[32px] text-xs text-[var(--color-primary)] hover:underline touch-manipulation"
                      >
                        編集
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('このメモを削除しますか？')) {
                            onDelete(memo.id);
                          }
                        }}
                        className="px-2 py-1 min-h-[32px] text-xs text-[var(--color-error)] hover:underline touch-manipulation"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{memo.content}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


