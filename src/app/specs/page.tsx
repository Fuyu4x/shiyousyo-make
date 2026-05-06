"use client";
import { useEffect, useState } from "react";
import { SpecDoc } from "@/types";

export default function SpecsPage() {
  const [specs, setSpecs] = useState<SpecDoc[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => { fetchSpecs(); }, []);

  async function fetchSpecs(kw?: string) {
    setLoading(true);
    try {
      const url = kw ? `/api/specs?keyword=${encodeURIComponent(kw)}` : "/api/specs";
      const data = await fetch(url).then((r) => r.json());
      setSpecs(data ?? []);
    } catch { setError("仕様書の取得に失敗しました"); }
    finally { setLoading(false); }
  }

  async function deleteSpec(id: string) {
    if (!confirm("削除してもよいですか？")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/specs?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setSpecs((p) => p.filter((s) => s.id !== id));
    } catch { setError("削除に失敗しました"); }
    finally { setDeleting(null); }
  }

  const CATEGORY_LABELS: Record<string, string> = { app: "アプリ", infra: "インフラ", common: "共通" };

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-100 border-l-2 border-blue-500 pl-3">過去仕様書管理</h1>
      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}
      <div className="flex gap-2">
        <input type="text" placeholder="キーワード検索..." value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchSpecs(keyword)}
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
        <button onClick={() => fetchSpecs(keyword)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500 transition-colors">検索</button>
        {keyword && (
          <button onClick={() => { setKeyword(""); fetchSpecs(); }}
            className="px-3 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-600 transition-colors">クリア</button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-slate-800 border border-slate-700 rounded-lg" />)}
        </div>
      ) : specs.length === 0 ? (
        <div className="text-center text-slate-500 py-16 text-sm">
          仕様書がありません。「仕様書レビュー」からファイルをアップロードしてください。
        </div>
      ) : (
        <div className="space-y-3">
          {specs.map((spec) => (
            <div key={spec.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-slate-500 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-200 truncate text-sm">{spec.title}</h3>
                    <span className="font-mono text-xs bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded shrink-0">
                      {CATEGORY_LABELS[spec.category] ?? spec.category}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-slate-500 mb-2">
                    {new Date(spec.uploadedAt).toLocaleString("ja-JP")}
                  </p>
                  <p className="text-sm text-slate-500 line-clamp-2">{spec.content}</p>
                </div>
                <button onClick={() => deleteSpec(spec.id)} disabled={deleting === spec.id}
                  className="font-mono text-xs text-slate-500 hover:text-red-400 border border-slate-700 hover:border-red-700 px-2 py-1 rounded shrink-0 transition-colors">
                  {deleting === spec.id ? "..." : "削除"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
