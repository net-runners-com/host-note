import React from 'react';
import { SnsInfo } from '../../types/common';

interface SnsInputProps {
  snsInfo: SnsInfo | null | undefined;
  onChange: (snsInfo: SnsInfo) => void;
}

export const SnsInput: React.FC<SnsInputProps> = ({ snsInfo, onChange }) => {
  const updateSns = (platform: 'twitter' | 'instagram' | 'line', field: 'url' | 'username', value: string) => {
    const updated = {
      ...snsInfo,
      [platform]: {
        ...snsInfo?.[platform],
        [field]: value || undefined,
      },
    } as SnsInfo;
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium mb-2">SNS情報</label>
      
      {/* Twitter */}
      <div>
        <label className="block text-xs text-[var(--color-text-secondary)] mb-1">Twitter</label>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="ユーザー名（例: @username）"
            value={snsInfo?.twitter?.username || ''}
            onChange={(e) => updateSns('twitter', 'username', e.target.value)}
            className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
          <input
            type="url"
            placeholder="URL（例: https://twitter.com/username）"
            value={snsInfo?.twitter?.url || ''}
            onChange={(e) => updateSns('twitter', 'url', e.target.value)}
            className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>
      </div>

      {/* Instagram */}
      <div>
        <label className="block text-xs text-[var(--color-text-secondary)] mb-1">Instagram</label>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="ユーザー名（例: username）"
            value={snsInfo?.instagram?.username || ''}
            onChange={(e) => updateSns('instagram', 'username', e.target.value)}
            className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
          <input
            type="url"
            placeholder="URL（例: https://instagram.com/username）"
            value={snsInfo?.instagram?.url || ''}
            onChange={(e) => updateSns('instagram', 'url', e.target.value)}
            className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>
      </div>

      {/* LINE */}
      <div>
        <label className="block text-xs text-[var(--color-text-secondary)] mb-1">LINE</label>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="ユーザー名またはID"
            value={snsInfo?.line?.username || ''}
            onChange={(e) => updateSns('line', 'username', e.target.value)}
            className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
          <input
            type="url"
            placeholder="URL（例: https://line.me/ti/p/...）"
            value={snsInfo?.line?.url || ''}
            onChange={(e) => updateSns('line', 'url', e.target.value)}
            className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>
      </div>
    </div>
  );
};


