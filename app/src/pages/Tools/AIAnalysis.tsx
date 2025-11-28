import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { toast } from "react-toastify";
import { logError } from "../../utils/errorHandler";
import { FaRobot, FaChartLine, FaLightbulb } from "react-icons/fa";
import { useHimeStore } from "../../stores/himeStore";
import { useCastStore } from "../../stores/castStore";
import { useOptionStore } from "../../stores/optionStore";
import { Avatar } from "../../components/common/Avatar";

interface AnalysisRequest {
  himeId?: number;
  analysisType: "general" | "sales" | "visit" | "recommendation";
  period?: "week" | "month" | "year";
}

export default function AIAnalysisPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const himeIdParam = searchParams.get("himeId");
  const himeId = himeIdParam ? parseInt(himeIdParam) : undefined;
  const { himeList, loadHimeList } = useHimeStore();
  const { castList, loadCastList } = useCastStore();
  const { analysisTypeOptions, periodOptions, loadOptions } = useOptionStore();
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [request, setRequest] = useState<AnalysisRequest>({
    himeId,
    analysisType: "general",
    period: "month",
  });

  useEffect(() => {
    loadHimeList();
    loadCastList();
    loadOptions();
    if (himeId) {
      setRequest((prev) => ({ ...prev, himeId }));
    }
  }, [himeId, loadHimeList, loadCastList, loadOptions]);

  const targetHimeId = himeId || request.himeId;
  const selectedHime = targetHimeId
    ? himeList.find((h) => h.id === targetHimeId)
    : null;

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setAnalysisResult(null);

      // サーバーAPIを呼び出す実装（将来の拡張用）
      // 現在はモックデータを返す
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const targetHimeIdForAnalysis = himeId || request.himeId;
      const himeForAnalysis = targetHimeIdForAnalysis
        ? himeList.find((h) => h.id === targetHimeIdForAnalysis)
        : null;
      const himeName = himeForAnalysis ? himeForAnalysis.name : "";
      const himeContext = himeName ? `（${himeName}さん）` : "";

      const mockResults: Record<string, string> = {
        general: himeForAnalysis
          ? `${himeName}さんの総合分析結果${himeContext}\n\n主なポイント:\n- 来店頻度の傾向\n- 売上パターン\n- 個別の改善提案\n- 好みの傾向分析`
          : "全体的な分析結果がここに表示されます。\n\n主なポイント:\n- 来店頻度の傾向\n- 売上パターン\n- 改善提案",
        sales: himeForAnalysis
          ? `${himeName}さんの売上分析結果${himeContext}\n\n- 月間売上推移\n- 平均単価の傾向\n- 売上向上のポイント\n- 過去の売上パターンとの比較`
          : "売上分析結果がここに表示されます。\n\n- 月間売上推移\n- 平均単価の傾向\n- 売上向上のポイント",
        visit: himeForAnalysis
          ? `${himeName}さんの来店分析結果${himeContext}\n\n- 来店頻度の分析\n- 来店パターンの傾向\n- リピート率の改善点\n- 最適な来店タイミングの予測`
          : "来店分析結果がここに表示されます。\n\n- 来店頻度の分析\n- 来店パターンの傾向\n- リピート率の改善点",
        recommendation: himeForAnalysis
          ? `${himeName}さんへのAI推奨事項${himeContext}\n\n- 個別のアプローチ提案\n- 最適な来店タイミング\n- パーソナライズされた提案\n- 好みに基づいたサービス提案`
          : "AI推奨事項がここに表示されます。\n\n- 個別のアプローチ提案\n- 最適な来店タイミング\n- パーソナライズされた提案",
      };

      setAnalysisResult(
        mockResults[request.analysisType] || "分析結果がありません"
      );
      toast.success("分析が完了しました");
    } catch (error) {
      toast.error("分析に失敗しました");
      logError(error, { component: "AIAnalysisPage", action: "handleAnalyze" });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (himeId) {
      navigate(`/tools/ai-tools?himeId=${himeId}`);
    } else {
      navigate("/tools/ai-tools");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={handleBack} className="flex-shrink-0">
          ← 戻る
        </Button>
        <h1 className="text-2xl font-bold">AI分析</h1>
      </div>

      {selectedHime && (
        <Card>
          <div className="flex items-center gap-4">
            <Avatar
              src={selectedHime.photoUrl}
              name={selectedHime.name}
              size="lg"
            />
            <div>
              <h2 className="text-xl font-semibold">
                {selectedHime.name}さんの分析
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                個別のデータに基づいたAI分析を実行します
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <FaRobot className="text-3xl text-[var(--color-primary)]" />
            <div>
              <h2 className="text-lg font-semibold">分析タイプを選択</h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                AIがデータを分析して洞察を提供します
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!himeId && (
              <div>
                <label className="block text-sm font-medium mb-2">対象</label>
                <select
                  value={request.himeId || ""}
                  onChange={(e) =>
                    setRequest({
                      ...request,
                      himeId: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    })
                  }
                  className="w-full px-4 py-3 border border-[var(--color-border)] rounded-xl bg-[var(--color-surface)] text-[var(--color-text)] min-h-[44px]"
                >
                  <option value="">全姫</option>
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
            )}
            <div>
              <label className="block text-sm font-medium mb-2">
                分析タイプ
              </label>
              <select
                value={request.analysisType}
                onChange={(e) =>
                  setRequest({
                    ...request,
                    analysisType: e.target
                      .value as AnalysisRequest["analysisType"],
                  })
                }
                className="w-full px-4 py-3 border border-[var(--color-border)] rounded-xl bg-[var(--color-surface)] text-[var(--color-text)] min-h-[44px]"
              >
                {analysisTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">期間</label>
              <select
                value={request.period}
                onChange={(e) =>
                  setRequest({
                    ...request,
                    period: e.target.value as AnalysisRequest["period"],
                  })
                }
                className="w-full px-4 py-3 border border-[var(--color-border)] rounded-xl bg-[var(--color-surface)] text-[var(--color-text)] min-h-[44px]"
              >
                {periodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4">
            <Button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full md:w-auto min-h-[44px] rounded-xl"
            >
              {loading ? (
                <span className="flex items-center">
                  <span className="animate-spin mr-2">⏳</span>
                  分析中...
                </span>
              ) : (
                <>
                  <FaChartLine className="inline-block mr-2" />
                  AI分析を実行
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {analysisResult && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FaLightbulb className="text-xl text-[var(--color-primary)]" />
              <h2 className="text-lg font-semibold">分析結果</h2>
            </div>
            <div className="bg-[var(--color-background)] rounded-xl p-4 border border-[var(--color-border)]">
              <pre className="whitespace-pre-wrap text-sm text-[var(--color-text)] font-sans">
                {analysisResult}
              </pre>
            </div>
            <div className="text-xs text-[var(--color-text-secondary)]">
              ※
              この機能はサーバーAPIと連携する予定です。現在はモックデータを表示しています。
            </div>
          </div>
        </Card>
      )}

      <Card>
        <div className="space-y-3">
          <h3 className="font-semibold">実装予定の機能</h3>
          <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
            <li className="flex items-start gap-2">
              <span className="text-[var(--color-primary)]">•</span>
              <span>サーバーAPIとの連携（APIキーはサーバー側で管理）</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--color-primary)]">•</span>
              <span>個別の姫に対する分析</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--color-primary)]">•</span>
              <span>詳細な統計データの分析</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--color-primary)]">•</span>
              <span>パーソナライズされた推奨事項</span>
            </li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
