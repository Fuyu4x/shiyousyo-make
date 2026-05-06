"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ChatWindow from "@/components/ChatWindow";
import SpecPreview from "@/components/SpecPreview";
import { InterviewMessage } from "@/types";

function InterviewContent() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get("templateId") || "";

  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [specText, setSpecText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [interviewDone, setInterviewDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (templateId) {
      startInterview();
    }
  }, [templateId]);

  async function startInterview() {
    setLoading(true);
    setError("");
    try {
      const initMessages: InterviewMessage[] = [
        { role: "user", content: "仕様書の作成を始めてください。" },
      ];
      const assistantMsg = await callInterview(initMessages);
      setMessages([...initMessages, { role: "assistant", content: assistantMsg }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

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

  async function handleSend(text: string) {
    const userMsg: InterviewMessage = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);
    setError("");
    try {
      const assistantText = await callInterview(newMessages);
      const assistantMsg: InterviewMessage = { role: "assistant", content: assistantText };
      setMessages([...newMessages, assistantMsg]);
      if (assistantText.includes("ヒアリング完了")) {
        setInterviewDone(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  async function generateSpec() {
    setGenerating(true);
    setSpecText("");
    setError("");
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
        body: JSON.stringify({ title: "仕様書ドラフト", specText }),
      });
      if (!res.ok) throw new Error("Word出力に失敗しました");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "仕様書ドラフト.docx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ダウンロードに失敗しました");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">AIヒアリング</h1>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      <div className={`grid gap-6 ${specText ? "lg:grid-cols-2" : "grid-cols-1"}`}>
        {/* チャット */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden" style={{ height: "600px" }}>
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">ヒアリングチャット</h2>
          </div>
          <div style={{ height: "calc(100% - 48px)" }}>
            <ChatWindow
              messages={messages}
              onSend={handleSend}
              loading={loading}
              placeholder="回答を入力..."
              disabled={generating}
            />
          </div>
        </div>

        {/* プレビュー */}
        {specText && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 overflow-y-auto" style={{ height: "600px" }}>
            <SpecPreview
              text={specText}
              loading={generating}
              title="仕様書ドラフト"
              onDownload={downloadWord}
              downloading={downloading}
            />
          </div>
        )}
      </div>

      {/* 仕様書生成ボタン */}
      {(interviewDone || messages.length >= 4) && !specText && (
        <div className="flex justify-center">
          <button
            onClick={generateSpec}
            disabled={generating}
            className="px-8 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50"
          >
            {generating ? "仕様書を生成中..." : "仕様書ドラフトを生成"}
          </button>
        </div>
      )}
      {specText && !generating && (
        <div className="flex justify-center">
          <button
            onClick={generateSpec}
            className="px-6 py-2 border border-green-600 text-green-600 rounded-xl text-sm hover:bg-green-50"
          >
            再生成
          </button>
        </div>
      )}
    </div>
  );
}

export default function InterviewPage() {
  return (
    <Suspense fallback={<div className="text-center text-gray-400 py-12">読み込み中...</div>}>
      <InterviewContent />
    </Suspense>
  );
}
