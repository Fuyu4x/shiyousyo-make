"use client";
import { useEffect, useState } from "react";
import FileUpload from "@/components/FileUpload";
import { StorageIndexEntry, StorageEntry } from "@/types";

export default function StoragePage() {
  const [entries, setEntries] = useState<StorageIndexEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [detail, setDetail] = useState<StorageEntry | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState("");

  useEffect(() => { fetchEntries(); }, []);

  async function fetchEntries() {
    setLoading(true);
    try {
      const data = await fetch("/api/storage").then((r) => r.json());
      setEntries(data ?? []);
    } catch { setError("一覧の取得に失敗しました"); }
    finally { setLoading(false); }
  }

  async function handleFile(file: File) {
    setUploading(true); setError(""); setUploadProgress("テキスト抽出中...");
    try {
      const formData = new FormData();
      formData.append("file", file);
      setUploadProgress("AIで構造化中（数秒かかります）...");
      const res = await fetch("/api/storage/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEntries((p) => [data, ...p]);
      setUploadProgress("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "アップロードに失敗しました");
      setUploadProgress("");
    } finally { setUploading(false); }
  }

  async function openDetail(id: string) {
    setDetailLoading(true);
    try {
      const data = await fetch(`/api/storage/${id}`).then((r) => r.json());
      setDetail(data);
    } catch { setError("詳細の取得に失敗しました"); }
    finally { setDetailLoading(false); }
  }

  async function deleteEntry(id: string) {
    if (!confirm("削除してもよいですか？")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/storage/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setEntries((p) => p.filter((e) => e.id !== id));
      if (detail?.id === id) setDetail(null);
    } catch { setError("削除に失敗しました"); }
    finally { setDeleting(null); }
  }

  const CATEGORY_LABELS: Record<string, string> = { app: "アプリ", infra: "インフラ", common: "共通", other: "その他" };
  const PHASE_LABELS: Record<string, string> = { mvp: "MVP", production: "本番", unknown: "不明" };

  function scoreColor(score: number) {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-100 border-l-2 border-blue-500 pl-3">仕様書ストレージ</h1>
      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm flex justify-between">
          {error}
          <button onClick={() => setError("")} className="underline">閉じる</button>
        </div>
      )}

      {/* アップロード */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-3">
        <h2 className="font-semibold text-slate-200 border-l-2 border-blue-500 pl-3">仕様書をアップロード</h2>
        <p className="text-xs text-slate-400">アップロード時にAIが自動で構造化・品質スコアを算出します</p>
        <FileUpload onFile={handleFile} disabled={uploading} />
        {uploading && (
          <div className="flex items-center gap-2 text-sm text-blue-400">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            {uploadProgress}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 一覧 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-slate-200">格納済み仕様書</h2>
            <span className="font-mono text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded">{entries.length}件</span>
          </div>
          {loading ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-slate-800 border border-slate-700 rounded-lg" />)}
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center text-slate-500 py-12 bg-slate-800 border border-slate-700 rounded-lg text-sm">
              仕様書がありません。上からアップロードしてください。
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => (
                <div key={entry.id}
                  className={`bg-slate-800 border rounded-lg p-4 transition-colors cursor-pointer
                    ${detail?.id === entry.id ? "border-blue-500 bg-blue-900/10" : "border-slate-700 hover:border-slate-500"}`}
                  onClick={() => openDetail(entry.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-200 text-sm truncate">{entry.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="font-mono text-xs bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">
                          {CATEGORY_LABELS[entry.category] ?? entry.category}
                        </span>
                        <span className="font-mono text-xs bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">
                          {PHASE_LABELS[entry.phase] ?? entry.phase}
                        </span>
                        <span className={`font-mono text-xs font-bold ${scoreColor(entry.qualityScore)}`}>
                          {entry.qualityScore}pt
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{entry.summary}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); deleteEntry(entry.id); }}
                      disabled={deleting === entry.id}
                      className="font-mono text-xs text-slate-500 hover:text-red-400 border border-slate-700 hover:border-red-700 px-2 py-1 rounded transition-colors shrink-0">
                      {deleting === entry.id ? "..." : "削除"}
                    </button>
                  </div>
                  <p className="font-mono text-xs text-slate-600 mt-2">
                    {new Date(entry.uploadedAt).toLocaleString("ja-JP")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 詳細パネル */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
          {detailLoading ? (
            <div className="p-6 space-y-3 animate-pulse">
              <div className="h-6 bg-slate-700 rounded w-3/4" />
              <div className="h-4 bg-slate-700 rounded w-full" />
              <div className="h-4 bg-slate-700 rounded w-5/6" />
            </div>
          ) : detail ? (
            <div className="p-5 space-y-4 overflow-y-auto max-h-[600px]">
              <div>
                <h3 className="font-bold text-slate-100 text-base">{detail.title}</h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="font-mono text-xs bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">
                    {CATEGORY_LABELS[detail.category] ?? detail.category}
                  </span>
                  <span className={`font-mono text-xs font-bold ${scoreColor(detail.qualityScore)}`}>
                    品質スコア: {detail.qualityScore}/100
                  </span>
                </div>
              </div>

              <div>
                <p className="font-mono text-xs text-slate-500 mb-1 border-l-2 border-blue-500 pl-2">サマリー</p>
                <p className="text-sm text-slate-300 leading-relaxed">{detail.summary}</p>
              </div>

              {detail.sections.length > 0 && (
                <div>
                  <p className="font-mono text-xs text-slate-500 mb-2 border-l-2 border-blue-500 pl-2">セクション</p>
                  <div className="space-y-2">
                    {detail.sections.map((sec, i) => (
                      <div key={i} className="bg-slate-900/60 rounded-lg p-3">
                        <p className="text-sm font-medium text-slate-200">{sec.title}</p>
                        <ul className="mt-1 space-y-0.5">
                          {sec.keyPoints.map((kp, j) => (
                            <li key={j} className="text-xs text-slate-400 flex items-start gap-1.5">
                              <span className="text-blue-500 mt-0.5">•</span>{kp}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detail.keywords.length > 0 && (
                <div>
                  <p className="font-mono text-xs text-slate-500 mb-1.5 border-l-2 border-blue-500 pl-2">キーワード</p>
                  <div className="flex flex-wrap gap-1.5">
                    {detail.keywords.map((kw, i) => (
                      <span key={i} className="font-mono text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">{kw}</span>
                    ))}
                  </div>
                </div>
              )}

              {detail.missingChecklist.length > 0 && (
                <div>
                  <p className="font-mono text-xs text-yellow-600 mb-1.5 border-l-2 border-yellow-600 pl-2">不足観点（AI推定）</p>
                  <ul className="space-y-1">
                    {detail.missingChecklist.map((item, i) => (
                      <li key={i} className="text-xs text-yellow-400 flex items-start gap-1.5">
                        <span className="mt-0.5">⚠</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-sm">
              <span className="text-2xl mb-2">📄</span>
              仕様書を選択すると詳細が表示されます
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
