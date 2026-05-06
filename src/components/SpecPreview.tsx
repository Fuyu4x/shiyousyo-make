"use client";

interface Props {
  text: string;
  loading?: boolean;
  title?: string;
  onDownload?: () => void;
  downloading?: boolean;
}

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
          <div className="bg-slate-700 px-4 py-2 h-9" />
          <div className="p-4 space-y-2">
            <div className="h-3 bg-slate-700 rounded w-full" />
            <div className="h-3 bg-slate-700 rounded w-5/6" />
            <div className="h-3 bg-slate-700 rounded w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SpecPreview({ text, loading, title, onDownload, downloading }: Props) {
  if (loading && !text) return <Skeleton />;
  if (!text) return null;

  const sections = parseSections(text);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-100 border-l-2 border-blue-500 pl-3">
          {title ?? "仕様書ドラフト"}
        </h3>
        {onDownload && (
          <button
            onClick={onDownload}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:opacity-40 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {downloading ? "生成中..." : "Word出力"}
          </button>
        )}
      </div>
      <div className="space-y-3">
        {sections.map((section, idx) => (
          <div key={idx} className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden hover:border-slate-600 transition-colors">
            <div className="bg-slate-700/60 border-b border-slate-700 px-4 py-2">
              <h4 className="font-medium text-slate-200 text-sm">{section.title}</h4>
            </div>
            <div className="px-4 py-3 text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
              {section.content}
              {loading && idx === sections.length - 1 && (
                <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-1" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function parseSections(text: string) {
  const lines = text.split("\n");
  const sections: { title: string; content: string }[] = [];
  let current: { title: string; content: string } | null = null;

  for (const line of lines) {
    if (line.startsWith("# ") || line.startsWith("## ")) {
      if (current) sections.push(current);
      current = { title: line.replace(/^#{1,2}\s+/, ""), content: "" };
    } else {
      if (!current) current = { title: "はじめに", content: "" };
      current.content += (current.content ? "\n" : "") + line;
    }
  }
  if (current && (current.content.trim() || sections.length === 0)) {
    sections.push(current);
  }
  return sections;
}
