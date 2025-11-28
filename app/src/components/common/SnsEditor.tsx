import { useState } from 'react';
import { SnsInfo, SnsAccount } from '../../types/common';
import { Button } from './Button';

interface SnsEditorProps {
  snsInfo: SnsInfo | null;
  onSave: (snsInfo: SnsInfo | null) => Promise<void>;
}

type SnsType = 'twitter' | 'instagram' | 'line';

const SNS_LABELS: Record<SnsType, string> = {
  twitter: 'Twitter',
  instagram: 'Instagram',
  line: 'LINE',
};

export const SnsEditor: React.FC<SnsEditorProps> = ({ snsInfo, onSave }) => {
  const [editingType, setEditingType] = useState<SnsType | null>(null);
  const [editingAccount, setEditingAccount] = useState<SnsAccount | null>(null);

  const getAvailableTypes = (): SnsType[] => {
    const allTypes: SnsType[] = ['twitter', 'instagram', 'line'];
    return allTypes.filter((type) => !snsInfo?.[type]);
  };

  const handleAdd = (type: SnsType) => {
    setEditingType(type);
    setEditingAccount({ username: '', url: '' });
  };

  const handleEdit = (type: SnsType, account: SnsAccount) => {
    setEditingType(type);
    setEditingAccount({ ...account });
  };

  const handleSave = async () => {
    if (!editingType || !editingAccount) return;

    const newSnsInfo: SnsInfo = {
      ...snsInfo,
      [editingType]: editingAccount.username || editingAccount.url ? editingAccount : undefined,
    };

    // 空のSNS情報を削除
    Object.keys(newSnsInfo).forEach((key) => {
      const account = newSnsInfo[key as SnsType];
      if (account && !account.username && !account.url) {
        delete newSnsInfo[key as SnsType];
      }
    });

    await onSave(Object.keys(newSnsInfo).length > 0 ? newSnsInfo : null);
    setEditingType(null);
    setEditingAccount(null);
  };

  const handleDelete = async (type: SnsType) => {
    if (!confirm('このSNSアカウントを削除しますか？')) return;

    const newSnsInfo: SnsInfo = { ...snsInfo };
    delete newSnsInfo[type];

    await onSave(Object.keys(newSnsInfo).length > 0 ? newSnsInfo : null);
  };

  const handleCancel = () => {
    setEditingType(null);
    setEditingAccount(null);
  };

  const getSnsUrl = (type: SnsType, account: SnsAccount): string => {
    if (account.url) return account.url;
    
    switch (type) {
      case 'twitter':
        return `https://twitter.com/${account.username?.replace('@', '') || ''}`;
      case 'instagram':
        return `https://instagram.com/${account.username || ''}`;
      default:
        return account.url || '#';
    }
  };

  return (
    <div className="space-y-2">
      {/* 既存のSNSアカウント */}
      {snsInfo && (
        <>
          {(['twitter', 'instagram', 'line'] as SnsType[]).map((type) => {
            const account = snsInfo[type];
            if (!account) return null;

            if (editingType === type) {
              return (
                <div key={type} className="p-3 md:p-4 bg-[var(--color-background)] rounded border border-[var(--color-border)]">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-[var(--color-text-secondary)] mb-2">
                        {SNS_LABELS[type]} ユーザー名
                      </label>
                      <input
                        type="text"
                        value={editingAccount?.username || ''}
                        onChange={(e) =>
                          setEditingAccount({ ...editingAccount!, username: e.target.value })
                        }
                        placeholder="@username または username"
                        className="w-full px-3 py-2.5 min-h-[44px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-[var(--color-text-secondary)] mb-2">
                        URL（任意）
                      </label>
                      <input
                        type="url"
                        value={editingAccount?.url || ''}
                        onChange={(e) =>
                          setEditingAccount({ ...editingAccount!, url: e.target.value })
                        }
                        placeholder="https://..."
                        className="w-full px-3 py-2.5 min-h-[44px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-base"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button type="button" onClick={handleSave} size="sm" className="flex-1 sm:flex-none">
                        保存
                      </Button>
                      <Button type="button" variant="secondary" onClick={handleCancel} size="sm" className="flex-1 sm:flex-none">
                        キャンセル
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        onClick={() => handleDelete(type)}
                        size="sm"
                        className="flex-1 sm:flex-none"
                      >
                        削除
                      </Button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={type}
                className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-3 bg-[var(--color-background)] rounded border border-[var(--color-border)]"
              >
                <a
                  href={getSnsUrl(type, account)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-[var(--color-primary)] text-[var(--color-background)] rounded hover:opacity-90 touch-manipulation min-h-[44px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {SNS_LABELS[type]}: {account.username || 'リンク'}
                </a>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => handleEdit(type, account)}
                    size="sm"
                    className="flex-1 sm:flex-none"
                  >
                    編集
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => handleDelete(type)}
                    size="sm"
                    className="flex-1 sm:flex-none"
                  >
                    削除
                  </Button>
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* 追加ボタン */}
      {editingType === null && getAvailableTypes().length > 0 && (
        <div className="space-y-2">
          {getAvailableTypes().map((type) => (
            <Button
              key={type}
              type="button"
              variant="secondary"
              onClick={() => handleAdd(type)}
              size="sm"
              className="w-full justify-center md:justify-start"
            >
              + {SNS_LABELS[type]}を追加
            </Button>
          ))}
        </div>
      )}

      {/* 新規追加フォーム */}
      {editingType && !snsInfo?.[editingType] && (
        <div className="p-3 md:p-4 bg-[var(--color-background)] rounded border border-[var(--color-border)]">
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-[var(--color-text-secondary)] mb-2">
                {SNS_LABELS[editingType]} ユーザー名
              </label>
              <input
                type="text"
                value={editingAccount?.username || ''}
                onChange={(e) =>
                  setEditingAccount({ ...editingAccount!, username: e.target.value })
                }
                placeholder="@username または username"
                className="w-full px-3 py-2.5 min-h-[44px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-base"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--color-text-secondary)] mb-2">
                URL（任意）
              </label>
              <input
                type="url"
                value={editingAccount?.url || ''}
                onChange={(e) =>
                  setEditingAccount({ ...editingAccount!, url: e.target.value })
                }
                placeholder="https://..."
                className="w-full px-3 py-2.5 min-h-[44px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-base"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button type="button" onClick={handleSave} size="sm" className="flex-1 sm:flex-none">
                保存
              </Button>
              <Button type="button" variant="secondary" onClick={handleCancel} size="sm" className="flex-1 sm:flex-none">
                キャンセル
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

