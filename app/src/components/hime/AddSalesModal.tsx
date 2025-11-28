import React, { useState } from 'react';
import { SalesInfo } from '../../types/table';
import { SalesInfoForm } from '../table/SalesInfoForm';
import { Button } from '../common/Button';
import { api } from '../../utils/api';
import { toast } from 'react-toastify';
import { logError } from '../../utils/errorHandler';

interface AddSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  himeId: number;
  onSuccess: () => void;
}

export const AddSalesModal: React.FC<AddSalesModalProps> = ({
  isOpen,
  onClose,
  himeId,
  onSuccess,
}) => {
  const [salesInfo, setSalesInfo] = useState<SalesInfo>({
    tableCharge: 0,
    orderItems: [],
    visitType: 'normal',
    stayHours: 2,
    shimeiFee: 0,
    subtotal: 0,
    taxRate: 10,
    tax: 0,
    total: 0,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // 新しい卓記録を作成
      const now = new Date();
      const tableData = {
        datetime: now.toISOString(),
        himeIds: [himeId],
        mainCastId: 0,
        helpCastIds: [],
        salesInfo: salesInfo,
      };

      await api.table.create(tableData);
      toast.success('売上情報を追加しました');
      onSuccess();
      onClose();
      
      // リセット
      setSalesInfo({
        tableCharge: 0,
        orderItems: [],
        visitType: 'normal',
        stayHours: 2,
        shimeiFee: 0,
        subtotal: 0,
        taxRate: 10,
        tax: 0,
        total: 0,
      });
    } catch (error) {
      logError(error, { component: 'AddSalesModal', action: 'handleSave' });
      toast.error('売上情報の追加に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-[var(--color-surface)] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 md:p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">売上情報を追加</h2>
            <button
              onClick={onClose}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)] text-2xl"
              aria-label="閉じる"
            >
              ×
            </button>
          </div>

          <SalesInfoForm salesInfo={salesInfo} onChange={setSalesInfo} />

          <div className="flex gap-2 justify-end pt-4 border-t border-[var(--color-border)]">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={saving}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? '保存中...' : '保存'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

