"use client";

interface Props {
  text: string;
  loading?: boolean;
}

const GRADE_COLORS: Record<string, string> = {
  S: "bg-emerald-900/60 text-emerald-300 border-emerald-600",
  A: "bg-blue-900/60 text-blue-300 border-blue-600",
  B: "bg-yellow-900/60 text-yellow-300 border-yellow-600",
  C: "bg-red-900/60 text-red-300 border-red-600",
};

function Skeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-8 w-40 bg-slate-700 rounded" />
      <div className="space-y-2">
        <div className="h-4 bg-slate-700 rounded w-full" />
        <div className="h-4 bg-slate-700 rounded w-5/6" />
        <div className="h-4 bg-slate-700 rounded w-4/6" />
      </div>
      <div className="space-y-2 pt-2">
        <div className="h-4 bg-slate-700 rounded w-full" />
        <div className="h-4 bg-slate-700 rounded w-3/4" />
      </div>
    </div>
  );
}

export default function ReviewResult({ text, loading }: Props) {
  if (loading && !text) return <Skeleton />;
  if (!text) return null;

  const gradeMatch = text.match(/総合評価:\s*\[?([SABC])\]?/);
  const grade = gradeMatch?.[1];
  const lines = text.split("\n");

  return (
    <div className="space-y-4">
      {grade && (
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border font-bold font-mono text-lg ${GRADE_COLORS[grade] ?? "bg-slate-700 text-slate-300 border-slate-600"}`}>
          総合評価: {grade}
        </div>
      )}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-5 text-sm text-slate-200 whitespace-pre-wrap leading-relaxed font-mono">
        {lines.map((line, i) => {
          if (line.startsWith("■")) {
            return (
              <p key={i} className="font-bold text-slate-100 mt-4 first:mt-0 border-l-2 border-blue-500 pl-3">
                {line}
              </p>
            );
          }
          if (line.startsWith("  - ")) {
            return <p key={i} className="ml-4 text-slate-300">{line}</p>;
          }
          return <p key={i} className="text-slate-400">{line || " "}</p>;
        })}
        {loading && (
          <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-1" />
        )}
      </div>
    </div>
  );
}
