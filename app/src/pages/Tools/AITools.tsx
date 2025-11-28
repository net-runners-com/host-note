import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { FaRobot, FaChartLine, FaLightbulb, FaComments, FaMagic, FaLanguage, FaFileAlt } from 'react-icons/fa';

interface AITool {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  path: string;
  comingSoon?: boolean;
}

export default function AIToolsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const himeId = searchParams.get('himeId');

  const aiTools: AITool[] = [
    {
      id: 'analysis',
      name: 'AI分析',
      description: 'データを分析して洞察を提供',
      icon: FaChartLine,
      color: 'text-[var(--color-primary)]',
      path: '/tools/ai-analysis',
    },
    {
      id: 'recommendation',
      name: 'AI推奨事項',
      description: 'パーソナライズされた提案を生成',
      icon: FaLightbulb,
      color: 'text-[var(--color-accent)]',
      path: '/tools/ai-recommendation',
      comingSoon: true,
    },
    {
      id: 'conversation',
      name: 'AI会話分析',
      description: '会話内容から傾向を分析',
      icon: FaComments,
      color: 'text-[var(--color-success)]',
      path: '/tools/ai-conversation',
      comingSoon: true,
    },
    {
      id: 'magic',
      name: 'AI自動生成',
      description: 'メモや提案を自動生成',
      icon: FaMagic,
      color: 'text-[var(--color-warning)]',
      path: '/tools/ai-magic',
      comingSoon: true,
    },
    {
      id: 'translation',
      name: 'AI翻訳',
      description: 'テキストを自動翻訳',
      icon: FaLanguage,
      color: 'text-[var(--color-info)]',
      path: '/tools/ai-translation',
      comingSoon: true,
    },
    {
      id: 'summary',
      name: 'AI要約',
      description: '長文を要約して要点を抽出',
      icon: FaFileAlt,
      color: 'text-[var(--color-secondary)]',
      path: '/tools/ai-summary',
      comingSoon: true,
    },
  ];

  const handleToolClick = (tool: AITool) => {
    if (tool.comingSoon) return;
    
    const path = himeId ? `${tool.path}?himeId=${himeId}` : tool.path;
    navigate(path);
  };

  const handleBack = () => {
    if (himeId) {
      navigate(`/hime/${himeId}`);
    } else {
      navigate('/tools');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={handleBack} className="flex-shrink-0">
          ← 戻る
        </Button>
        <div className="flex items-center gap-3 flex-1">
          <FaRobot className="text-3xl text-[var(--color-primary)]" />
          <div>
            <h1 className="text-2xl font-bold">AIツール</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">
              AIを活用してデータを分析し、より良いサービスを提供できます
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {aiTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <div
              key={tool.id}
              onClick={() => handleToolClick(tool)}
              className={`cursor-pointer transition-transform ${tool.comingSoon ? 'opacity-60' : 'hover:scale-105'}`}
            >
              <Card className="p-0 border-2 hover:border-[var(--color-primary)] transition-all rounded-xl h-full">
                <div className="flex flex-col items-center text-center p-6 space-y-3 min-h-[160px] justify-center">
                  <div className={`text-5xl ${tool.color} mb-2`}>
                    <Icon />
                  </div>
                  <div className="w-full">
                    <h3 className="text-base font-semibold mb-2">
                      {tool.name}
                    </h3>
                    {tool.comingSoon && (
                      <span className="inline-block text-xs bg-[var(--color-text-secondary)] text-[var(--color-background)] px-2 py-1 rounded-full mb-2">
                        準備中
                      </span>
                    )}
                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                      {tool.description}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}

