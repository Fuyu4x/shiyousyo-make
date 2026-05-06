"use client";
import { useEffect, useState } from "react";
import ChatWindow from "@/components/ChatWindow";
import SpecPreview from "@/components/SpecPreview";
import { InterviewMessage, SpecDoc } from "@/types";

type Step = "search" | "interview" | "result";

export default function RevisionPage() {
  const [step, setStep] = useState<Step>("search");
  const [keyword, setKeyword] = useState("");
  const [specs, setSpecs] = useState<SpecDoc[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedSpec, setSelectedSpec] = useState<SpecDoc | null>(null);
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [specText, setSpecText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSpecs();
  }, []);

  async function fetchSpecs(kw?: string) {
    setSearching(true);
    try {
      const url = kw ? `/api/specs?keyword=${encodeURIComponent(kw)}` : "/api/specs";
      const res = await fetch(url);
      const data = await res.json();
      setSpecs(data || []);
    } catch {
      setError("仕様書の取得に失敗しました");
    } finally {
      setSearching(false);
    }
  }

  function selectSpec(spec: SpecDoc) {
    setSelectedSpec(spec);
    const initialMsg: InterviewMessage = {
      role: "assistant",
      content: `「${spec.title}」を選択しました。\nこの仕様書の改修内容についてヒアリングします。\n\n改修の背景・目的を教えてください。`,
    };
    setMessages([initialMsg]);
    setStep("interview");
  }

  async function handleSend(text: string) {
    if (!selectedSpec) return;
    const userMsg: InterviewMessage = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setChatLoading(true);
    setError("");
    try {
      const res = await fetch("/api/generate/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: "default",
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      if (!res.ok) throw new Error("ヒアリングに失敗しました");
      if (!res.body) throw new Error();
      let result = "";
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value, { stream: true });
      }
      setMessages([...newMessages, { role: "assistant", content: result }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setChatLoading(false);
    }
  }

  async function generateRevision() {
    if (!selectedSpec) return;
    setGenerating(true);
    setSpecText("");
    setStep("result");
    setError("");
    try {
      const res = await fetch("/api/generate/revision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ specId: selectedSpec.id, interviewHistory: messages }),
      });
      if (!res.ok) throw new Error("改修仕様書の生成に失敗しました");
      if (!res.body) throw new Error();
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setSpecText((prev) => prev + decoder.decode(value, { stream: true }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setGenerating(false);
    }
  }

  async function downloadWord() {
    setDownloading(true);
    try {
      const res = await fetch("/api/generate/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: `${selectedSpec?.title || "仕様書"}_改修版`, specText }),
      });
      if (!res.ok) throw new Error("Word出力に失敗しました");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedSpec?.title || "仕様書"}_改修版.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ダウンロードに失敗しました");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">改修仕様書作成</h1>
        {step !== "search" && (
          <button
            onClick={() => { setStep("search"); setSelectedSpec(null); setMessages([]); setSpecText(""); }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← 仕様書を選び直す
          </button>
        )}
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* STEP 1: 仕様書検索 */}
      {step === "search" && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-gray-800">ベースとなる仕様書を選択</h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="キーワードで検索..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchSpecs(keyword)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={() => fetchSpecs(keyword)}
                disabled={searching}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50"
              >
                検索
              </button>
            </div>
            {searching ? (
              <p className="text-sm text-gray-400 text-center">検索中...</p>
            ) : specs.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                仕様書がありません。「仕様書レビュー」からアップロードしてください。
              </p>
            ) : (
              <div className="space-y-2">
                {specs.map((spec) => (
                  <button
                    key={spec.id}
                    onClick={() => selectSpec(spec)}
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-colors"
                  >
                    <p className="font-medium text-gray-900 text-sm">{spec.title}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(spec.uploadedAt).toLocaleString("ja-JP")}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{spec.content}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: ヒアリング */}
      {step === "interview" && selectedSpec && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-700">
            対象仕様書: <strong>{selectedSpec.title}</strong>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden" style={{ height: "500px" }}>
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-700">改修内容ヒアリング</h2>
            </div>
            <div style={{ height: "calc(100% - 48px)" }}>
              <ChatWindow
                messages={messages}
                onSend={handleSend}
                loading={chatLoading}
                placeholder="改修内容を入力..."
              />
            </div>
          </div>
          {messages.length >= 3 && (
            <button
              onClick={generateRevision}
              disabled={generating}
              className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              改修仕様書を生成
            </button>
          )}
        </div>
      )}

      {/* STEP 3: 結果 */}
      {step === "result" && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <SpecPreview
              text={specText}
              loading={generating}
              title={`${selectedSpec?.title} 改修版`}
              onDownload={downloadWord}
              downloading={downloading}
            />
          </div>
          {!generating && specText && (
            <div className="flex gap-3">
              <button
                onClick={() => setStep("interview")}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                ← ヒアリングに戻る
              </button>
              <button
                onClick={generateRevision}
                className="px-4 py-2 border border-green-600 text-green-600 rounded-lg text-sm hover:bg-green-50"
              >
                再生成
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
