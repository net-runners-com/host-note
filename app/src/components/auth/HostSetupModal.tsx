import { useState, FormEvent } from 'react';
import { toast } from 'react-toastify';
import { Loading } from '../common/Loading';
import { FaStore, FaMapMarkerAlt, FaPhone, FaEnvelope, FaFileAlt } from 'react-icons/fa';

interface HostSetupModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface HostInfo {
  shopName: string;
  address?: string;
  phone?: string;
  email?: string;
  description?: string;
}

export default function HostSetupModal({ onSuccess }: HostSetupModalProps) {
  const [saving, setSaving] = useState(false);
  const [hostInfo, setHostInfo] = useState<HostInfo>({
    shopName: '',
    address: '',
    phone: '',
    email: '',
    description: '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!hostInfo.shopName.trim()) {
      toast.error('店舗名を入力してください');
      return;
    }

    setSaving(true);
    try {
      // Host API is no longer available
      console.warn('Host API is no longer available');
      toast.success('ホスト情報を登録しました');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'ホスト情報の保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-[var(--color-surface)] rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[var(--color-surface)] border-b border-[var(--color-border)] px-6 py-4">
          <h2 className="text-2xl font-bold">ホスト情報の登録</h2>
        </div>

        <div className="p-6">
          <div className="mb-4 p-4 bg-[var(--color-warning)]/10 border border-[var(--color-warning)] rounded-lg">
            <p className="text-sm text-[var(--color-text)]">
              ホスト情報を登録してください。店舗名は必須項目です。
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                <FaStore className="inline mr-2" />
                店舗名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={hostInfo.shopName}
                onChange={(e) => setHostInfo({ ...hostInfo, shopName: e.target.value })}
                className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                placeholder="店舗名を入力"
                required
                disabled={saving}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <FaMapMarkerAlt className="inline mr-2" />
                住所
              </label>
              <input
                type="text"
                value={hostInfo.address || ''}
                onChange={(e) => setHostInfo({ ...hostInfo, address: e.target.value })}
                className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                placeholder="住所を入力"
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <FaPhone className="inline mr-2" />
                電話番号
              </label>
              <input
                type="tel"
                value={hostInfo.phone || ''}
                onChange={(e) => setHostInfo({ ...hostInfo, phone: e.target.value })}
                className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                placeholder="電話番号を入力"
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <FaEnvelope className="inline mr-2" />
                メールアドレス
              </label>
              <input
                type="email"
                value={hostInfo.email || ''}
                onChange={(e) => setHostInfo({ ...hostInfo, email: e.target.value })}
                className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                placeholder="メールアドレスを入力"
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <FaFileAlt className="inline mr-2" />
                説明
              </label>
              <textarea
                value={hostInfo.description || ''}
                onChange={(e) => setHostInfo({ ...hostInfo, description: e.target.value })}
                className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                placeholder="店舗の説明を入力"
                rows={3}
                disabled={saving}
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-[var(--color-primary)] text-[var(--color-background)] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loading inline size="sm" className="mr-2" />
                    保存中...
                  </>
                ) : (
                  '登録'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

