"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/review",    label: "仕様書レビュー",    icon: "🔍" },
  { href: "/masters",   label: "観点マスタ",         icon: "⚡" },
  { href: "/create",    label: "新規作成",            icon: "✨" },
  { href: "/revision",  label: "改修仕様書",          icon: "🔧" },
  { href: "/storage",   label: "仕様書ストレージ",    icon: "📁" },
  { href: "/templates", label: "テンプレート管理",    icon: "📋" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 bg-slate-900 border-r border-slate-700 flex flex-col overflow-hidden">
      {/* ロゴ */}
      <div className="px-5 py-5 border-b border-slate-700">
        <p className="text-slate-100 font-bold text-sm leading-tight">仕様書レビュー</p>
        <p className="text-slate-400 font-mono text-xs mt-0.5">AI-Powered</p>
      </div>

      {/* ナビ */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                ${
                  active
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
                }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* 設定 */}
      <div className="px-3 py-3 border-t border-slate-700">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
        >
          <span className="text-base">⚙</span>
          <span>設定</span>
        </Link>
      </div>
    </aside>
  );
}
