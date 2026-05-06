"use client";
import { useEffect, useState } from "react";
import { SpecDoc } from "@/types";

export default function SpecsPage() {
  const [specs, setSpecs] = useState<SpecDoc[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSpecs();
  }, []);

  async function fetchSpecs(kw?: string) {
    setLoading(true);
    try {
      const url = kw ? `/api/specs?keyword=${encodeURIComponent(kw)}` : "/api/specs";
      const res = await fetch(url);
      const data = await res.json();
      setSpecs(data || []);
    } catch {
      setError("仕様書の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  async function deleteSpec(id: string) {
    if (!confirm("この仕様書を削除してもよいですか？")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/specs?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setSpecs((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setError("削除に失敗しました");
    } finally {
      setDeleting(null);
    }
  }

  const CATEGORY_LABELS: Record<string, string> = {
    app: "アプリ",
    infra: "インフラ",
    common: "共通",
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900">過去仕様書管理</h1>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="キーワード検索..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchSpecs(keyword)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <button
          onClick={() => fetchSpecs(keyword)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
        >
          検索
        </button>
        {keyword && (
          <button
            onClick={() => { setKeyword(""); fetchSpecs(); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            クリア
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-12">読み込み中...</div>
      ) : specs.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          仕様書がありません。「仕様書レビュー」からファイルをアップロードしてください。
        </div>
      ) : (
        <div className="space-y-3">
          {specs.map((spec) => (
            <div key={spec.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">{spec.title}</h3>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full shrink-0">
                      {CATEGORY_LABELS[spec.category] || spec.category}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">
                    {new Date(spec.uploadedAt).toLocaleString("ja-JP")}
                  </p>
                  <p className="text-sm text-gray-600 line-clamp-2">{spec.content}</p>
                </div>
                <button
                  onClick={() => deleteSpec(spec.id)}
                  disabled={deleting === spec.id}
                  className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-2 py-1 rounded shrink-0"
                >
                  {deleting === spec.id ? "削除中..." : "削除"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
