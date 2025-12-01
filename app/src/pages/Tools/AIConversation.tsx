import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { FaComments, FaRobot, FaLightbulb } from "react-icons/fa";
import { toast } from "react-toastify";
import { api } from "../../utils/api";
import { logError } from "../../utils/errorHandler";

interface ConversationRequest {
  selfProfile: string;
  partnerProfile: string;
  goal: string;
  extraInfo: string;
  chatLog: string;
}

export default function AIConversationPage() {
  const navigate = useNavigate();
  const [request, setRequest] = useState<ConversationRequest>({
    selfProfile: "",
    partnerProfile: "",
    goal: "",
    extraInfo: "",
    chatLog: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleBack = () => {
    navigate("/tools/ai-tools");
  };

  const handleAnalyze = async () => {
    if (!request.selfProfile.trim() || !request.partnerProfile.trim()) {
      toast.warning("自分と相手の情報を入力してください");
      return;
    }
    if (!request.chatLog.trim()) {
      toast.warning("会話ログを入力してください");
      return;
    }

    try {
      setLoading(true);
      setResult(null);
      const res = await api.ai.analyzeConversation({
        selfProfile: request.selfProfile,
        partnerProfile: request.partnerProfile,
        goal: request.goal,
        extraInfo: request.extraInfo,
        chatLog: request.chatLog,
      });
      setResult(res.result);
      toast.success("AI会話分析が完了しました");
    } catch (error) {
      toast.error("AI会話分析に失敗しました");
      logError(error, { component: "AIConversationPage", action: "handleAnalyze" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={handleBack} className="flex-shrink-0">
          ← 戻る
        </Button>
        <div className="flex items-center gap-3">
          <FaComments className="text-2xl text-[var(--color-primary)]" />
          <div>
            <h1 className="text-2xl font-bold">AI会話分析</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">
              自分と姫の情報＋チャットログから、ホスト向けの具体的な立ち回りをAIが提案します
            </p>
          </div>
        </div>
      </div>

      <Card>
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <FaRobot className="text-2xl text-[var(--color-primary)]" />
            <div>
              <h2 className="text-lg font-semibold">1. 状況・目標</h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                この子とどうなりたいか、今の悩み・不安などを書いてください
              </p>
            </div>
          </div>
          <textarea
            className="w-full min-h-[80px] px-4 py-3 border border-[var(--color-border)] rounded-xl bg-[var(--color-surface)] text-sm"
            placeholder="例）もっと指名を増やしたい／返信の頻度を上げたい／距離を縮めたい など"
            value={request.goal}
            onChange={(e) => setRequest({ ...request, goal: e.target.value })}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">2. 自分の情報（ホスト）</h2>
            <p className="text-xs text-[var(--color-text-secondary)]">
              年齢・勤務形態・売上帯・性格・強み／弱み・得意な接客スタイルなど
            </p>
            <textarea
              className="w-full min-h-[140px] px-4 py-3 border border-[var(--color-border)] rounded-xl bg-[var(--color-surface)] text-sm"
              placeholder="例）24歳／指名本数◯本／明るいけど少し不器用、恋愛経験少なめ など"
              value={request.selfProfile}
              onChange={(e) => setRequest({ ...request, selfProfile: e.target.value })}
            />
          </div>
        </Card>

        <Card>
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">3. 相手の情報（姫）</h2>
            <p className="text-xs text-[var(--color-text-secondary)]">
              年齢／職業／好きなもの・嫌いなもの／趣味／生活リズム／金銭感覚／育ちなど
            </p>
            <textarea
              className="w-full min-h-[140px] px-4 py-3 border border-[var(--color-border)] rounded-xl bg-[var(--color-surface)] text-sm"
              placeholder="例）23歳／風俗・昼職掛け持ち／推し活好き／夜型／お金に少しルーズ など"
              value={request.partnerProfile}
              onChange={(e) =>
                setRequest({ ...request, partnerProfile: e.target.value })
              }
            />
          </div>
        </Card>
      </div>

      <Card>
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">4. その他メモ</h2>
          <p className="text-xs text-[var(--color-text-secondary)]">
            共通の友達／店での様子／トラブル履歴／注意してほしい事情などがあれば
          </p>
          <textarea
            className="w-full min-h-[80px] px-4 py-3 border border-[var(--color-border)] rounded-xl bg-[var(--color-surface)] text-sm"
            placeholder="任意。必要なければ空でもOKです。"
            value={request.extraInfo}
            onChange={(e) => setRequest({ ...request, extraInfo: e.target.value })}
          />
        </div>
      </Card>

      <Card>
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">5. 会話ログ（LINEなど）</h2>
          <p className="text-xs text-[var(--color-text-secondary)]">
            古い順に上から貼ってください。名前やスタンプはある程度そのままで大丈夫です。
          </p>
          <textarea
            className="w-full min-h-[220px] px-4 py-3 border border-[var(--color-border)] rounded-xl bg-[var(--color-surface)] text-sm font-mono"
            placeholder={`例）
俺：今日仕事おつかれ！ちゃんとご飯食べた？ 
姫：食べてない〜
俺：また体調崩すよ？笑
姫：大丈夫だってばw
...`}
            value={request.chatLog}
            onChange={(e) => setRequest({ ...request, chatLog: e.target.value })}
          />
        </div>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleAnalyze}
          disabled={loading}
          className="min-w-[200px] min-h-[44px] rounded-xl"
        >
          {loading ? (
            <span className="flex items-center">
              <span className="animate-spin mr-2">⏳</span>
              解析中...
            </span>
          ) : (
            <>
              <FaComments className="inline-block mr-2" />
              AI会話分析を実行
            </>
          )}
        </Button>
      </div>

      {result && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FaLightbulb className="text-xl text-[var(--color-primary)]" />
              <h2 className="text-lg font-semibold">AIからの分析・アドバイス</h2>
            </div>
            <div className="bg-[var(--color-background)] rounded-xl p-4 border border-[var(--color-border)]">
              <pre className="whitespace-pre-wrap text-sm text-[var(--color-text)] font-sans">
                {result}
              </pre>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)]">
              ※ 出力内容はあくまでAIの提案です。実際の状況や相手の様子を見ながら、あなた自身の感覚と合わせて活用してください。
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}


