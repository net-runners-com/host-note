import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useHimeStore } from '../../stores/himeStore';
import { useCastStore } from '../../stores/castStore';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Skeleton } from '../../components/common/Skeleton';
import { Avatar } from '../../components/common/Avatar';
import { api } from '../../utils/api';
import { Hime } from '../../types/hime';
import { Cast } from '../../types/cast';
import { Memo } from '../../types/common';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale/ja';
import { toast } from 'react-toastify';
import { logError } from '../../utils/errorHandler';

export default function MemoPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const himeId = searchParams.get('himeId') ? parseInt(searchParams.get('himeId')!) : null;
  const castId = searchParams.get('castId') ? parseInt(searchParams.get('castId')!) : null;
  const { loading: himeLoading, loadHimeList } = useHimeStore();
  const { loading: castLoading, loadCastList } = useCastStore();
  const [hime, setHime] = useState<Hime | null>(null);
  const [cast, setCast] = useState<Cast | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMemo, setNewMemo] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  useEffect(() => {
    if (!himeId && !castId) {
      toast.error('姫IDまたはキャストIDが指定されていません');
      navigate('/hime');
      return;
    }
    loadHimeList();
    loadCastList();
    if (himeId) {
      loadHimeData();
    } else if (castId) {
      loadCastData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [himeId, castId]); // himeId, castIdのみを依存配列に

  const loadHimeData = async () => {
    if (!himeId) return;
    try {
      setLoading(true);
      const himeData = await api.hime.get(himeId);
      if (!himeData) {
        toast.error('姫が見つかりませんでした');
        navigate('/hime');
        return;
      }
      setHime(himeData);
    } catch (error) {
      logError(error, { component: 'MemoPage', action: 'loadHimeData', himeId });
      toast.error('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const loadCastData = async () => {
    if (!castId) return;
    try {
      setLoading(true);
      const castData = await api.cast.get(castId);
      if (!castData) {
        toast.error('キャストが見つかりませんでした');
        navigate('/cast');
        return;
      }
      setCast(castData);
    } catch (error) {
      logError(error, { component: 'MemoPage', action: 'loadCastData', castId });
      toast.error('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newMemo.trim()) return;

    try {
      const newMemoObj: Memo = {
        id: `memo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content: newMemo.trim(),
        createdAt: new Date().toISOString(),
      };
      
      if (hime?.id) {
        const updatedMemos = [...(hime.memos || []), newMemoObj];
        await api.hime.update(hime.id, { memos: updatedMemos });
        setHime({ ...hime, memos: updatedMemos });
      } else if (cast?.id) {
        const updatedMemos = [...(cast.memos || []), newMemoObj];
        await api.cast.update(cast.id, { memos: updatedMemos });
        setCast({ ...cast, memos: updatedMemos });
      }
      
      setNewMemo('');
      toast.success('メモを追加しました');
    } catch (error) {
      logError(error, { component: 'MemoPage', action: 'handleAdd' });
      toast.error('メモの追加に失敗しました');
    }
  };

  const handleStartEdit = (memo: Memo) => {
    setEditingId(memo.id);
    setEditingContent(memo.content);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editingContent.trim()) return;

    try {
      if (hime?.id) {
        const updatedMemos = (hime.memos || []).map((m) =>
          m.id === editingId ? { ...m, content: editingContent.trim() } : m
        );
        await api.hime.update(hime.id, { memos: updatedMemos });
        setHime({ ...hime, memos: updatedMemos });
      } else if (cast?.id) {
        const updatedMemos = (cast.memos || []).map((m) =>
          m.id === editingId ? { ...m, content: editingContent.trim() } : m
        );
        await api.cast.update(cast.id, { memos: updatedMemos });
        setCast({ ...cast, memos: updatedMemos });
      }
      
      setEditingId(null);
      setEditingContent('');
      toast.success('メモを更新しました');
    } catch (error) {
      logError(error, { component: 'MemoPage', action: 'handleSaveEdit' });
      toast.error('メモの更新に失敗しました');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingContent('');
  };

  const handleDelete = async (memoId: string) => {
    if (!confirm('このメモを削除しますか？')) return;

    try {
      if (hime?.id) {
        const updatedMemos = (hime.memos || []).filter((m) => m.id !== memoId);
        await api.hime.update(hime.id, { memos: updatedMemos });
        setHime({ ...hime, memos: updatedMemos });
      } else if (cast?.id) {
        const updatedMemos = (cast.memos || []).filter((m) => m.id !== memoId);
        await api.cast.update(cast.id, { memos: updatedMemos });
        setCast({ ...cast, memos: updatedMemos });
      }
      
      toast.success('メモを削除しました');
    } catch (error) {
      logError(error, { component: 'MemoPage', action: 'handleDelete' });
      toast.error('メモの削除に失敗しました');
    }
  };

  const memos = hime?.memos || cast?.memos || [];
  const sortedMemos = [...memos].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const entity = hime || cast;
  const entityName = hime?.name || cast?.name || '';
  const entityPhotoUrl = hime?.photoUrl || cast?.photoUrl || null;
  const backPath = hime ? `/hime/${hime.id}` : `/cast/${cast?.id}`;

  if (loading || himeLoading || castLoading || !entity) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <Skeleton variant="rectangular" width={200} height={32} />
          <Skeleton variant="rectangular" width={100} height={40} />
        </div>
        <div className="space-y-4">
          <Skeleton variant="rectangular" width="100%" height={120} />
          <Skeleton variant="rectangular" width="100%" height={200} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-3">
        <Button
          variant="ghost"
          onClick={() => navigate(backPath)}
          className="w-auto"
        >
          ← 戻る
        </Button>
        <div className="flex items-center gap-3">
          <Avatar src={entityPhotoUrl} name={entityName} size="md" />
          <h1 className="text-xl sm:text-2xl font-bold">{entityName}のメモ</h1>
        </div>
      </div>

      <Card>
        <div className="space-y-4">
          {/* メモ追加セクション */}
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
              <Button
                type="button"
                onClick={handleAdd}
                className="w-full sm:w-auto sm:flex-shrink-0"
              >
                追加
              </Button>
            </div>
          </div>

          {/* メモ一覧 */}
          {sortedMemos.length === 0 ? (
            <p className="text-[var(--color-text-secondary)] italic text-sm">
              メモはありません
            </p>
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
                        <Button
                          type="button"
                          onClick={handleSaveEdit}
                          size="sm"
                          className="flex-1 sm:flex-none"
                        >
                          保存
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handleCancelEdit}
                          size="sm"
                          className="flex-1 sm:flex-none"
                        >
                          キャンセル
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-xs text-[var(--color-text-secondary)]">
                          {format(new Date(memo.createdAt), 'yyyy年MM月dd日 HH:mm', {
                            locale: ja,
                          })}
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
                            onClick={() => handleDelete(memo.id)}
                            className="px-2 py-1 min-h-[32px] text-xs text-[var(--color-error)] hover:underline touch-manipulation"
                          >
                            削除
                          </button>
                        </div>
                      </div>
                      <p className="whitespace-pre-wrap text-sm">
                        {memo.content}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
