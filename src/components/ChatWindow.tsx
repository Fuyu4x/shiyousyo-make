"use client";
import { useEffect, useRef, useState } from "react";
import { InterviewMessage } from "@/types";

interface Props {
  messages: InterviewMessage[];
  onSend: (text: string) => void;
  loading?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export default function ChatWindow({
  messages,
  onSend,
  loading = false,
  placeholder = "メッセージを入力...",
  disabled = false,
}: Props) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function handleSend() {
    const text = input.trim();
    if (!text || loading || disabled) return;
    setInput("");
    onSend(text);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-3 p-4 min-h-0">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed
                ${msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-700 border border-slate-600 text-slate-100"
                }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-3">
              <span className="inline-flex space-x-1.5">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-slate-700 p-3 flex gap-2">
        <textarea
          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-40"
          rows={2}
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading || disabled}
        />
        <button
          onClick={handleSend}
          disabled={loading || disabled || !input.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed self-end transition-colors"
        >
          送信
        </button>
      </div>
    </div>
  );
}
