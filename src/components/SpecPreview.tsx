"use client";

interface Props {
  text: string;
  loading?: boolean;
  title?: string;
  onDownload?: () => void;
  downloading?: boolean;
}

export default function SpecPreview({ text, loading, title, onDownload, downloading }: Props) {
  if (loading && !text) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400">
        <svg className="animate-spin h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        仕様書を生成中です...
      </div>
    );
  }

  if (!text) return null;

  const sections = parseSections(text);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{title || "仕様書ドラフト"}</h3>
        {onDownload && (
          <button
            onClick={onDownload}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {downloading ? "生成中..." : "Word でダウンロード"}
          </button>
        )}
      </div>
      <div className="space-y-3">
        {sections.map((section, idx) => (
          <div key={idx} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
              <h4 className="font-semibold text-gray-800 text-sm">{section.title}</h4>
            </div>
            <div className="px-4 py-3 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {section.content}
              {loading && idx === sections.length - 1 && (
                <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function parseSections(text: string): { title: string; content: string }[] {
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
