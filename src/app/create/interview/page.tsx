"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ChatWindow from "@/components/ChatWindow";
import SpecPreview from "@/components/SpecPreview";
import { InterviewMessage } from "@/types";

function InterviewContent() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get("templateId") ?? "";

  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [specText, setSpecText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [interviewDone, setInterviewDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { if (templateId) startInterview(); }, [templateId]);

  async function callInterview(msgs: InterviewMessage[]): Promise<string> {
    let result = "";
    const res = await fetch("/api/generate/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId, messages: msgs }),
    });
    if (!res.ok) throw new Error("ヒアリングに失敗しました");
    if (!res.body) throw new Error();
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      result += decoder.decode(value, { stream: true });
    }
    return result;
  }

  async function startInterview() {
    setLoading(true); setError("");
    try {
      const init: InterviewMessage[] = [{ role: "user", content: "仕様書の作成を始めてください。" }];
      const reply = await callInterview(init);
      setMessages([...init, { role: "assistant", content: reply }]);
    } catch (err) { setError(err instanceof Error ? err.message : "エラーが発生しました"); }
    finally { setLoading(false); }
  }

  async function handleSend(text: string) {
    const userMsg: InterviewMessage = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true); setError("");
    try {
      const reply = await callInterview(newMessages);
      const assistantMsg: InterviewMessage = { role: "assistant", content: reply };
      setMessages([...newMessages, assistantMsg]);
      if (reply.includes("ヒアリング完了")) setInterviewDone(true);
    } catch (err) { setError(err instanceof Error ? err.message : "エラーが発生しました"); }
    finally { setLoading(false); }
  }

  async function generateSpec() {
    setGenerating(true); setSpecText(""); setError("");
    try {
      const res = await fetch("/api/generate/spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, interviewHistory: messages }),
      });
      if (!res.ok) throw new Error("仕様書の生成に失敗しました");
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
        body: JSON.stringify({ title: "仕様書ドラフト", specText }),
      });
      if (!res.ok) throw new Error("Word出力に失敗しました");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "仕様書ドラフト.docx"; a.click();
      URL.revokeObjectURL(url);
    } catch (err) { setError(err instanceof Error ? err.message : "ダウンロードに失敗しました"); }
    finally { setDownloading(false); }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-100 border-l-2 border-blue-500 pl-3">AIヒアリング</h1>
      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}
      <div className={`grid gap-5 ${specText ? "lg:grid-cols-2" : "grid-cols-1 max-w-2xl"}`}>
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden" style={{ height: 560 }}>
          <div className="px-4 py-3 border-b border-slate-700 bg-slate-900/50 flex items-center gap-2">
            <span className="font-mono text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded">CHAT</span>
            <span className="text-sm text-slate-300">ヒアリング</span>
          </div>
          <div style={{ height: "calc(100% - 48px)" }}>
            <ChatWindow messages={messages} onSend={handleSend} loading={loading} placeholder="回答を入力..." disabled={generating} />
          </div>
        </div>

        {specText && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 overflow-y-auto" style={{ height: 560 }}>
            <SpecPreview text={specText} loading={generating} title="仕様書ドラフト" onDownload={downloadWord} downloading={downloading} />
          </div>
        )}
      </div>

      {(interviewDone || messages.length >= 4) && !specText && (
        <div className="flex justify-center">
          <button onClick={generateSpec} disabled={generating}
            className="px-8 py-3 bg-emerald-700 text-white rounded-lg font-semibold hover:bg-emerald-600 disabled:opacity-40 transition-colors">
            {generating ? "仕様書を生成中..." : "仕様書ドラフトを生成"}
          </button>
        </div>
      )}
      {specText && !generating && (
        <div className="flex justify-center">
          <button onClick={generateSpec}
            className="px-6 py-2 border border-emerald-700 text-emerald-400 rounded-lg text-sm hover:bg-emerald-900/30 transition-colors">
            再生成
          </button>
        </div>
      )}
    </div>
  );
}

export default function InterviewPage() {
  return (
    <Suspense fallback={<div className="text-center text-slate-400 py-12 animate-pulse">読み込み中...</div>}>
      <InterviewContent />
    </Suspense>
  );
}
