import Link from "next/link";

const FEATURES = [
  {
    href: "/review",
    title: "仕様書レビュー",
    description: "作成済みの仕様書をAIがレビューし、不足事項・改善提案を提示します。",
    icon: "🔍",
    badge: "最優先",
    badgeColor: "bg-red-100 text-red-700",
  },
  {
    href: "/masters",
    title: "観点マスタ管理",
    description: "レビュー観点（セキュリティ・アプリ・インフラ等）を管理します。",
    icon: "📋",
    badge: "最優先",
    badgeColor: "bg-red-100 text-red-700",
  },
  {
    href: "/create",
    title: "仕様書新規作成",
    description: "AIヒアリングを通じて、0から発注仕様書のドラフトを自動生成します。",
    icon: "✍️",
    badge: "推奨",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  {
    href: "/revision",
    title: "改修仕様書作成",
    description: "過去の仕様書をベースに、改修内容を反映した仕様書を作成します。",
    icon: "🔧",
    badge: "便利",
    badgeColor: "bg-gray-100 text-gray-600",
  },
  {
    href: "/specs",
    title: "過去仕様書管理",
    description: "アップロード済みの仕様書を一覧・検索・管理します。",
    icon: "📁",
    badge: "",
    badgeColor: "",
  },
];

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">仕様書レビュー・作成支援</h1>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto">
          AIを活用して、発注仕様書の品質レビュー・新規作成・改修仕様書の作成を支援します。
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURES.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-3xl">{f.icon}</span>
              {f.badge && (
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${f.badgeColor}`}>
                  {f.badge}
                </span>
              )}
            </div>
            <h2 className="text-lg font-semibold text-gray-900 group-hover:text-primary-700 mb-2">
              {f.title}
            </h2>
            <p className="text-sm text-gray-500">{f.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
