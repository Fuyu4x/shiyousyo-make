"use client";
import { useEffect, useState } from "react";
import FileUpload from "@/components/FileUpload";
import PointSelector from "@/components/PointSelector";
import ReviewResult from "@/components/ReviewResult";
import { ReviewCategory, StorageIndexEntry } from "@/types";

type Step = "upload" | "settings" | "result";

export default function ReviewPage() {
  const [step, setStep] = useState<Step>("upload");
  const [specText, setSpecText] = useState("");
  const [specTitle, setSpecTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<ReviewCategory[]>([]);
  const [selectedCatIds, setSelectedCatIds] = useState<string[]>([]);
  const [storageEntries, setStorageEntries] = useState<StorageIndexEntry[]>([]);
  const [referenceSpecIds, setReferenceSpecIds] = useState<string[]>([]);
  const [reviewing, setReviewing] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/masters/review-points").then((r) => r.json()),
      fetch("/api/storage").then((r) => r.json()),
    ]).then(([points, storage]) => {
      setCategories(points.categories ?? []);
      setSelectedCatIds(points.categories?.map((c: ReviewCategory) => c.id) ?? []);
      setStorageEntries(storage ?? []);
    });
  }, []);

  async function handleFileUpload(file: File) {
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", file.name);
      const res = await fetch("/api/specs/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSpecText(data.content);
      setSpecTitle(data.title);
      setStep("settings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "アップロードに失敗しました");
    } finally {
      setUploading(false);
    }
  }

  function toggleReferenceSpec(id: string) {
    setReferenceSpecIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function startReview() {
    setReviewing(true);
    setReviewText("");
    setStep("result");
    setError("");
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ specText, selectedCategoryIds: selectedCatIds, referenceSpecIds }),
      });
      if (!res.ok) throw new Error("レビューに失敗しました");
      if (!res.body) throw new Error("レスポンスがありません");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setReviewText((prev) => prev + decoder.decode(value, { stream: true }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "レビューに失敗しました");
    } finally {
      setReviewing(false);
    }
  }

  const STEPS: { key: Step; label: string }[] = [
    { key: "upload", label: "アップロード" },
    { key: "settings", label: "設定" },
    { key: "result", label: "結果" },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100 border-l-2 border-blue-500 pl-3">仕様書レビュー</h1>
        {step !== "upload" && (
          <button onClick={() => { setStep("upload"); setSpecText(""); setReviewText(""); }}
            className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
            ← 最初からやり直す
          </button>
        )}
      </div>

      {/* ステップ */}
      <div className="flex items-center gap-2">
        {STEPS.map(({ key, label }, idx) => (
          <div key={key} className="flex items-center gap-2">
            {idx > 0 && <span className="text-slate-600">→</span>}
            <span className={`font-mono text-xs px-3 py-1 rounded
              ${step === key ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"}`}>
              {idx + 1}. {label}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {/* STEP 1 */}
      {step === "upload" && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-4">
          <h2 className="font-semibold text-slate-200 border-l-2 border-blue-500 pl-3">仕様書ファイルをアップロード</h2>
          <FileUpload onFile={handleFileUpload} disabled={uploading} />
          {uploading && <p className="text-sm text-slate-400 text-center">ファイルを解析中...</p>}
        </div>
      )}

      {/* STEP 2 */}
      {step === "settings" && (
        <div className="space-y-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 space-y-2">
            <h2 className="font-semibold text-slate-200 border-l-2 border-blue-500 pl-3">対象仕様書</h2>
            <p className="text-sm text-slate-300 flex items-center gap-2">
              <span className="font-mono text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded">FILE</span>
              {specTitle}
            </p>
            <pre className="text-xs text-slate-500 bg-slate-900 rounded p-3 max-h-20 overflow-y-auto whitespace-pre-wrap">
              {specText.substring(0, 300)}...
            </pre>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 space-y-3">
            <h2 className="font-semibold text-slate-200 border-l-2 border-blue-500 pl-3">レビュー観点を選択</h2>
            <PointSelector categories={categories} selectedIds={selectedCatIds} onChange={setSelectedCatIds} />
          </div>

          {storageEntries.length > 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 space-y-3">
              <h2 className="font-semibold text-slate-200 border-l-2 border-blue-500 pl-3">参照仕様書（任意）</h2>
              <p className="text-xs text-slate-400">選択した仕様書の要約を参照してレビューします（トークン最適化済）</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {storageEntries.map((entry) => (
                  <label key={entry.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                      ${referenceSpecIds.includes(entry.id)
                        ? "border-blue-500 bg-blue-900/20"
                        : "border-slate-700 hover:border-slate-500"
                      }`}
                  >
                    <input type="checkbox" checked={referenceSpecIds.includes(entry.id)}
                      onChange={() => toggleReferenceSpec(entry.id)}
                      className="rounded bg-slate-800 border-slate-600 text-blue-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 truncate">{entry.title}</p>
                      <p className="text-xs text-slate-500 truncate">{entry.summary}</p>
                    </div>
                    <span className="font-mono text-xs bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded shrink-0">
                      {entry.qualityScore}pt
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <button onClick={startReview} disabled={selectedCatIds.length === 0}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500 disabled:opacity-40 transition-colors">
            AIレビューを実行 →
          </button>
        </div>
      )}

      {/* STEP 3 */}
      {step === "result" && (
        <div className="space-y-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="font-semibold text-slate-200 border-l-2 border-blue-500 pl-3 mb-4">
              レビュー結果: {specTitle}
            </h2>
            <ReviewResult text={reviewText} loading={reviewing} />
          </div>
          {!reviewing && reviewText && (
            <button onClick={() => setStep("settings")}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
              ← 設定を変更して再レビュー
            </button>
          )}
        </div>
      )}
    </div>
  );
}
