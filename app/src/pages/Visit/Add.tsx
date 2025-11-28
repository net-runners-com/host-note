import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useVisitStore } from '../../stores/visitStore';
import { useHimeStore } from '../../stores/himeStore';
import { useCastStore } from '../../stores/castStore';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { VisitFormData } from '../../types/visit';
import { toast } from 'react-toastify';
import { logError } from '../../utils/errorHandler';

export default function VisitAddPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addVisit } = useVisitStore();
  const { himeList, loadHimeList } = useHimeStore();
  const { castList, loadCastList } = useCastStore();
  const himeIdParam = searchParams.get('himeId');
  const [formData, setFormData] = useState<VisitFormData>({
    himeId: himeIdParam ? parseInt(himeIdParam) : 0,
    visitDate: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    loadHimeList();
    loadCastList();
    if (himeIdParam) {
      setFormData((prev) => ({ ...prev, himeId: parseInt(himeIdParam) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [himeIdParam]); // himeIdParamのみを依存配列に

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.himeId) {
      toast.error('姫を選択してください');
      return;
    }

    try {
      await addVisit({
        himeId: formData.himeId,
        visitDate: new Date(formData.visitDate).toISOString(),
        memo: formData.memo || null,
      });
      toast.success('来店を記録しました');
      navigate('/visit');
    } catch (error) {
      toast.error('記録に失敗しました');
      logError(error, { component: 'VisitAddPage', action: 'handleSubmit' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <h1 className="text-2xl font-bold mb-6">来店を記録</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              姫 <span className="text-[var(--color-error)]">*</span>
            </label>
            <select
              value={formData.himeId}
              onChange={(e) => setFormData({ ...formData, himeId: parseInt(e.target.value) })}
              className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              required
            >
              <option value={0}>選択してください</option>
              {himeList.map((hime) => {
                const tantoCast = hime.tantoCastId
                  ? castList.find((c) => c.id === hime.tantoCastId)
                  : null;
                const displayName = tantoCast
                  ? `${hime.name} (担当: ${tantoCast.name})`
                  : hime.name;
                return (
                  <option key={hime.id} value={hime.id}>
                    {displayName}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              来店日 <span className="text-[var(--color-error)]">*</span>
            </label>
            <input
              type="date"
              value={formData.visitDate}
              onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
              className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">メモ（任意）</label>
            <textarea
              value={formData.memo || ''}
              onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              placeholder="メモがあれば入力してください"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit">保存</Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/visit')}>
              キャンセル
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

