import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { logError } from '../utils/errorHandler';

interface UseEntityDetailOptions<T> {
  entityName: string;
  fetchFn: (id: number) => Promise<T | null>;
  deleteFn?: (id: number) => Promise<void>;
  redirectPath: string;
  onDeleteSuccess?: () => void;
}

export function useEntityDetail<T>(id: string | undefined, options: UseEntityDetailOptions<T>) {
  const { entityName, fetchFn, deleteFn, redirectPath, onDeleteSuccess } = options;
  const navigate = useNavigate();
  const [entity, setEntity] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await fetchFn(parseInt(id));
      
      if (!data) {
        toast.error(`${entityName}が見つかりませんでした`);
        navigate(redirectPath);
        return;
      }
      
      setEntity(data);
    } catch (error) {
      logError(error, { component: 'useEntityDetail', action: 'loadData', entityName, id });
      toast.error('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [id, fetchFn, entityName, redirectPath, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = useCallback(async () => {
    if (!id || !deleteFn) return;
    
    if (!confirm(`本当に削除しますか？`)) return;

    try {
      await deleteFn(parseInt(id));
      toast.success('削除しました');
      onDeleteSuccess?.();
      navigate(redirectPath);
    } catch (error) {
      logError(error, { component: 'useEntityDetail', action: 'handleDelete', entityName, id });
      toast.error('削除に失敗しました');
    }
  }, [id, deleteFn, entityName, redirectPath, navigate, onDeleteSuccess]);

  return {
    entity,
    loading,
    reload: loadData,
    handleDelete: deleteFn ? handleDelete : undefined,
  };
}

