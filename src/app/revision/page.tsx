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

  useEffect(() => { fetchSpecs(); }, []);

  async function fetchSpecs(kw?: string) {
    setSearching(true);
    try {
      const url = kw ? `/api/specs?keyword=${encodeURIComponent(kw)}` : "/api/specs";
      const data = await fetch(url).then((r) => r.json());
      setSpecs(data ?? []);
    } catch { setError("仕様書の取得に失敗しました"); }
    finally { setSearching(false); }
  }

  function selectSpec(spec: SpecDoc) {
    setSelectedSpec(spec);
    setMessages([{
      role: "assistant",
      content: `「${spec.title}」を選択しました。\n改修の背景・目的を教えてください。`,
    }]);
    setStep("interview");
  }

  async function handleSend(text: string) {
    if (!selectedSpec) return;
    const newMessages = [...messages, { role: "user" as const, content: text }];
    setMessages(newMessages);
    setChatLoading(true); setError("");
    try {
      const res = await fetch("/api/generate/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: "default", messages: newMessages }),
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
    } catch (err) { setError(err instanceof Error ? err.message : "エラーが発生しました"); }
    finally { setChatLoading(false); }
  }

  async function generateRevision() {
    if (!selectedSpec) return;
    setGenerating(true); setSpecText(""); setStep("result"); setError("");
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
        setSpecText((p) => p + decoder.decode(value, { stream: true }));
      }
    } catch (err) { setError(err instanceof Error ? err.message : "エラーが発生しました"); }
    finally { setGenerating(false); }
  }

  async function downloadWord() {
    setDownloading(true);
    try {
      const res = await fetch("/api/generate/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: `${selectedSpec?.title ?? "仕様書"}_改修版`, specText }),
      });
      if (!res.ok) throw new Error("Word出力に失敗しました");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${selectedSpec?.title ?? "仕様書"}_改修版.docx`; a.click();
      URL.revokeObjectURL(url);
    } catch (err) { setError(err instanceof Error ? err.message : "ダウンロードに失敗しました"); }
    finally { setDownloading(false); }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100 border-l-2 border-blue-500 pl-3">改修仕様書作成</h1>
        {step !== "search" && (
          <button onClick={() => { setStep("search"); setSelectedSpec(null); setMessages([]); setSpecText(""); }}
            className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
            ← 仕様書を選び直す
          </button>
        )}
      </div>
      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {/* STEP 1: 検索 */}
      {step === "search" && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-4">
          <h2 className="font-semibold text-slate-200 border-l-2 border-blue-500 pl-3">ベースとなる仕様書を選択</h2>
          <div className="flex gap-2">
            <input type="text" placeholder="キーワードで検索..." value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchSpecs(keyword)}
              className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            <button onClick={() => fetchSpecs(keyword)} disabled={searching}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500 disabled:opacity-40 transition-colors">検索</button>
          </div>
          {searching ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2].map((i) => <div key={i} className="h-16 bg-slate-700 rounded-lg" />)}
            </div>
          ) : specs.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">
              仕様書がありません。「仕様書レビュー」からアップロードしてください。
            </p>
          ) : (
            <div className="space-y-2">
              {specs.map((spec) => (
                <button key={spec.id} onClick={() => selectSpec(spec)}
                  className="w-full text-left p-4 border border-slate-700 rounded-lg hover:border-blue-500 hover:bg-blue-900/10 transition-colors">
                  <p className="font-medium text-slate-200 text-sm">{spec.title}</p>
                  <p className="font-mono text-xs text-slate-500 mt-1">
                    {new Date(spec.uploadedAt).toLocaleString("ja-JP")}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">{spec.content}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STEP 2: ヒアリング */}
      {step === "interview" && selectedSpec && (
        <div className="space-y-4">
          <div className="font-mono text-xs bg-blue-900/40 border border-blue-800 text-blue-300 px-4 py-2 rounded-lg">
            対象: {selectedSpec.title}
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden" style={{ height: 480 }}>
            <div className="px-4 py-3 border-b border-slate-700 bg-slate-900/50 flex items-center gap-2">
              <span className="font-mono text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded">CHAT</span>
              <span className="text-sm text-slate-300">改修内容ヒアリング</span>
            </div>
            <div style={{ height: "calc(100% - 48px)" }}>
              <ChatWindow messages={messages} onSend={handleSend} loading={chatLoading} placeholder="改修内容を入力..." />
            </div>
          </div>
          {messages.length >= 3 && (
            <button onClick={generateRevision} disabled={generating}
              className="w-full py-3 bg-emerald-700 text-white rounded-lg font-semibold hover:bg-emerald-600 disabled:opacity-40 transition-colors">
              改修仕様書を生成
            </button>
          )}
        </div>
      )}

      {/* STEP 3: 結果 */}
      {step === "result" && (
        <div className="space-y-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
            <SpecPreview text={specText} loading={generating} title={`${selectedSpec?.title} 改修版`}
              onDownload={downloadWord} downloading={downloading} />
          </div>
          {!generating && specText && (
            <div className="flex gap-3">
              <button onClick={() => setStep("interview")}
                className="px-4 py-2 bg-slate-700 text-slate-200 rounded-lg text-sm hover:bg-slate-600 transition-colors">
                ← ヒアリングに戻る
              </button>
              <button onClick={generateRevision}
                className="px-4 py-2 border border-emerald-700 text-emerald-400 rounded-lg text-sm hover:bg-emerald-900/30 transition-colors">
                再生成
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
