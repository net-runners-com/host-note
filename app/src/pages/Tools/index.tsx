import { Link } from "react-router-dom";
import { Card } from "../../components/common/Card";
import { FaRobot, FaFileExport, FaEdit } from "react-icons/fa";

export default function ToolsPage() {
  const tools = [
    {
      title: "AIツール",
      description: "AIがデータを分析して洞察を提供",
      icon: FaRobot,
      path: "/tools/ai-tools",
      color: "text-[var(--color-accent)]",
    },
    {
      title: "データエクスポート",
      description: "データをJSON/CSV/TSV形式で出力",
      icon: FaFileExport,
      path: "/tools/export",
      color: "text-[var(--color-success)]",
    },
    {
      title: "シャンパンコールテスト",
      description: "穴埋め問題を作成",
      icon: FaEdit,
      path: "/tools/fill-in-the-blank",
      color: "text-[var(--color-accent)]",
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">ツール</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const content = (
            <Card className="cursor-pointer hover:border-[var(--color-primary)] transition-colors">
              <div className="flex items-start space-x-4">
                <div className={`text-3xl ${tool.color}`}>
                  <Icon />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">{tool.title}</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {tool.description}
                  </p>
                </div>
              </div>
            </Card>
          );

          return (
            <Link key={tool.path} to={tool.path}>
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
