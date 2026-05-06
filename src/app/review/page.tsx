"use client";
import { useEffect, useState } from "react";
import FileUpload from "@/components/FileUpload";
import PointSelector from "@/components/PointSelector";
import ReviewResult from "@/components/ReviewResult";
import { ReviewCategory, SpecDoc } from "@/types";

type Step = "upload" | "settings" | "result";

export default function ReviewPage() {
  const [step, setStep] = useState<Step>("upload");
  const [specText, setSpecText] = useState("");
  const [specTitle, setSpecTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<ReviewCategory[]>([]);
  const [selectedCatIds, setSelectedCatIds] = useState<string[]>([]);
  const [pastSpecs, setPastSpecs] = useState<SpecDoc[]>([]);
  const [compareSpecId, setCompareSpecId] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/masters/review-points").then((r) => r.json()),
      fetch("/api/specs").then((r) => r.json()),
    ]).then(([points, specs]) => {
      setCategories(points.categories || []);
      setSelectedCatIds(points.categories?.map((c: ReviewCategory) => c.id) || []);
      setPastSpecs(specs || []);
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

  async function startReview() {
    setReviewing(true);
    setReviewText("");
    setStep("result");
    setError("");
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ specText, selectedCategoryIds: selectedCatIds, compareSpecId: compareSpecId || undefined }),
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

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">仕様書レビュー</h1>
        {step !== "upload" && (
          <button
            onClick={() => { setStep("upload"); setSpecText(""); setReviewText(""); }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← 最初からやり直す
          </button>
        )}
      </div>

      {/* ステップ表示 */}
      <div className="flex items-center gap-2 text-sm">
        {(["upload", "settings", "result"] as Step[]).map((s, idx) => (
          <div key={s} className="flex items-center gap-2">
            {idx > 0 && <span className="text-gray-300">→</span>}
            <span className={`px-3 py-1 rounded-full ${step === s ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-500"}`}>
              {idx + 1}. {s === "upload" ? "アップロード" : s === "settings" ? "設定" : "結果"}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* STEP 1: ファイルアップロード */}
      {step === "upload" && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">ステップ1: 仕様書ファイルをアップロード</h2>
          <FileUpload onFile={handleFileUpload} disabled={uploading} />
          {uploading && (
            <p className="text-sm text-gray-500 text-center">ファイルを解析中...</p>
          )}
        </div>
      )}

      {/* STEP 2: レビュー設定 */}
      {step === "settings" && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-2">
            <h2 className="font-semibold text-gray-800">アップロード済み仕様書</h2>
            <p className="text-sm text-gray-600">📄 {specTitle}</p>
            <p className="text-xs text-gray-400 bg-gray-50 rounded p-2 max-h-20 overflow-y-auto whitespace-pre-wrap">
              {specText.substring(0, 300)}...
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-3">
            <h2 className="font-semibold text-gray-800">レビュー観点を選択</h2>
            <PointSelector
              categories={categories}
              selectedIds={selectedCatIds}
              onChange={setSelectedCatIds}
            />
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-3">
            <h2 className="font-semibold text-gray-800">過去仕様書と比較（任意）</h2>
            <select
              value={compareSpecId}
              onChange={(e) => setCompareSpecId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">比較しない</option>
              {pastSpecs.map((s) => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>
          <button
            onClick={startReview}
            disabled={selectedCatIds.length === 0}
            className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            AIレビューを実行
          </button>
        </div>
      )}

      {/* STEP 3: レビュー結果 */}
      {step === "result" && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="font-semibold text-gray-800 mb-4">レビュー結果: {specTitle}</h2>
            <ReviewResult text={reviewText} loading={reviewing} />
          </div>
          {!reviewing && reviewText && (
            <button
              onClick={() => setStep("settings")}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              ← 設定を変更して再レビュー
            </button>
          )}
        </div>
      )}
    </div>
  );
}
