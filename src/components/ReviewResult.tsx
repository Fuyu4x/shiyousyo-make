"use client";

interface Props {
  text: string;
  loading?: boolean;
}

const GRADE_COLORS: Record<string, string> = {
  S: "bg-green-100 text-green-800 border-green-300",
  A: "bg-blue-100 text-blue-800 border-blue-300",
  B: "bg-yellow-100 text-yellow-800 border-yellow-300",
  C: "bg-red-100 text-red-800 border-red-300",
};

export default function ReviewResult({ text, loading }: Props) {
  if (loading && !text) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400">
        <svg className="animate-spin h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        AI がレビュー中です...
      </div>
    );
  }

  if (!text) return null;

  const gradeMatch = text.match(/総合評価:\s*\[?([SABC])\]?/);
  const grade = gradeMatch?.[1];

  const lines = text.split("\n");

  return (
    <div className="space-y-4">
      {grade && (
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-lg font-bold ${GRADE_COLORS[grade] || "bg-gray-100"}`}>
          総合評価: {grade}
        </div>
      )}
      <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
        {lines.map((line, i) => {
          if (line.startsWith("■")) {
            return <p key={i} className="font-bold text-gray-900 mt-3 first:mt-0">{line}</p>;
          }
          if (line.startsWith("  - ")) {
            return <p key={i} className="ml-4 text-gray-700">{line}</p>;
          }
          return <p key={i}>{line}</p>;
        })}
        {loading && <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1" />}
      </div>
    </div>
  );
}
