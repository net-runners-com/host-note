import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Loading } from '../../components/common/Loading';
import { Skeleton, SkeletonCard } from '../../components/common/Skeleton';
import { useHimeStore } from '../../stores/himeStore';
import { toast } from 'react-toastify';
import { logError } from '../../utils/errorHandler';
import { FaFileExport, FaDownload } from 'react-icons/fa';

type ExportFormat = 'json' | 'csv' | 'tsv';

export default function ExportPage() {
  const navigate = useNavigate();
  const { himeList, loading, loadHimeList } = useHimeStore();
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadHimeList();
  }, [loadHimeList]);

  const convertToCSV = (data: any[]): string => {
    if (data.length === 0) return '';

    // ヘッダー行を作成
    const headers = Object.keys(data[0]);
    const headerRow = headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(',');

    // データ行を作成
    const dataRows = data.map((item) => {
      return headers
        .map((header) => {
          const value = item[header];
          // null/undefinedは空文字
          if (value === null || value === undefined) {
            return '""';
          }
          // 配列やオブジェクトはJSON文字列に変換
          if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          }
          // 数値や真偽値はそのまま
          if (typeof value === 'number' || typeof value === 'boolean') {
            return String(value);
          }
          // 文字列は常にクォートで囲む（CSVの標準的な形式）
          return `"${String(value).replace(/"/g, '""')}"`;
        })
        .join(',');
    });

    return [headerRow, ...dataRows].join('\n');
  };

  const convertToTSV = (data: any[]): string => {
    if (data.length === 0) return '';

    // ヘッダー行を作成
    const headers = Object.keys(data[0]);
    const headerRow = headers.join('\t');

    // データ行を作成
    const dataRows = data.map((item) => {
      return headers
        .map((header) => {
          const value = item[header];
          // null/undefinedは空文字
          if (value === null || value === undefined) {
            return '';
          }
          // 配列やオブジェクトはJSON文字列に変換
          if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
            return JSON.stringify(value);
          }
          // その他の値は文字列に変換（タブや改行はそのまま）
          return String(value);
        })
        .join('\t');
    });

    return [headerRow, ...dataRows].join('\n');
  };

  const handleExport = () => {
    try {
      setExporting(true);

      // エクスポート用のデータを準備（不要なフィールドを除外）
      const exportData = himeList.map((hime) => ({
        id: hime.id,
        name: hime.name,
        photoUrl: hime.photoUrl,
        birthday: hime.birthday,
        isFirstVisit: hime.isFirstVisit,
        tantoCastId: hime.tantoCastId,
        drinkPreference: hime.drinkPreference,
        mixerPreference: hime.mixerPreference,
        snsInfo: hime.snsInfo,
        photos: hime.photos,
        memos: hime.memos,
        createdAt: hime.createdAt,
        updatedAt: hime.updatedAt,
      }));

      let content: string;
      let mimeType: string;
      let extension: string;

      switch (exportFormat) {
        case 'json':
          content = JSON.stringify(exportData, null, 2);
          mimeType = 'application/json';
          extension = 'json';
          break;
        case 'csv':
          content = convertToCSV(exportData);
          mimeType = 'text/csv';
          extension = 'csv';
          break;
        case 'tsv':
          content = convertToTSV(exportData);
          mimeType = 'text/tab-separated-values';
          extension = 'tsv';
          break;
        default:
          throw new Error('Invalid export format');
      }

      // Blobを作成してダウンロード
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `hime-data-${new Date().toISOString().split('T')[0]}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`${exportFormat.toUpperCase()}形式でエクスポートしました`);
    } catch (error) {
      toast.error('エクスポートに失敗しました');
      logError(error, { component: 'ExportPage', action: 'handleExport' });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton variant="rectangular" width={100} height={40} />
          <Skeleton variant="rectangular" width={200} height={32} />
        </div>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/tools')}>
          ← 戻る
        </Button>
        <h1 className="text-2xl font-bold">データエクスポート</h1>
      </div>

      <Card>
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <FaFileExport className="text-3xl text-[var(--color-primary)]" />
            <div>
              <h2 className="text-lg font-semibold">姫データのエクスポート</h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                登録されている姫のデータを各種形式で出力できます
              </p>
            </div>
          </div>

          <div className="bg-[var(--color-background)] rounded-xl p-4 border border-[var(--color-border)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">データ件数</span>
              <span className="text-lg font-bold text-[var(--color-primary)]">
                {himeList.length}件
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">出力形式</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => setExportFormat('json')}
                className={`p-4 rounded-xl border-2 transition-all min-h-[44px] ${
                  exportFormat === 'json'
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                    : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
                }`}
              >
                <div className="font-semibold">JSON</div>
                <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                  構造化データ
                </div>
              </button>
              <button
                onClick={() => setExportFormat('csv')}
                className={`p-4 rounded-xl border-2 transition-all min-h-[44px] ${
                  exportFormat === 'csv'
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                    : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
                }`}
              >
                <div className="font-semibold">CSV</div>
                <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                  カンマ区切り
                </div>
              </button>
              <button
                onClick={() => setExportFormat('tsv')}
                className={`p-4 rounded-xl border-2 transition-all min-h-[44px] ${
                  exportFormat === 'tsv'
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                    : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
                }`}
              >
                <div className="font-semibold">TSV</div>
                <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                  タブ区切り
                </div>
              </button>
            </div>
          </div>

          <div className="pt-4">
            <Button
              onClick={handleExport}
              disabled={exporting || himeList.length === 0}
              className="w-full md:w-auto min-h-[44px] rounded-xl"
            >
              {exporting ? (
                <span className="flex items-center">
                  <span className="animate-spin mr-2">⏳</span>
                  エクスポート中...
                </span>
              ) : (
                <>
                  <FaDownload className="inline-block mr-2" />
                  {exportFormat.toUpperCase()}形式でエクスポート
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="space-y-3">
          <h3 className="font-semibold">エクスポートされるデータ</h3>
          <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
            <li className="flex items-start gap-2">
              <span className="text-[var(--color-primary)]">•</span>
              <span>基本情報（名前、誕生日、担当キャストなど）</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--color-primary)]">•</span>
              <span>好み情報（お酒、割物）</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--color-primary)]">•</span>
              <span>SNS情報</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--color-primary)]">•</span>
              <span>メモ情報</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--color-primary)]">•</span>
              <span>写真URL（Base64データは含まれません）</span>
            </li>
          </ul>
        </div>
      </Card>
    </div>
  );
}

