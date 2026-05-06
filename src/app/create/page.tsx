"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FileUpload from "@/components/FileUpload";
import { Template } from "@/types";

export default function CreatePage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [importName, setImportName] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { fetchTemplates(); }, []);

  async function fetchTemplates() {
    setLoading(true);
    try {
      const res = await fetch("/api/templates");
      const data = await res.json();
      setTemplates(data ?? []);
      const def = data?.find((t: Template) => t.isDefault) ?? data?.[0];
      if (def) setSelectedTemplateId(def.id);
    } catch { setError("テンプレート一覧の取得に失敗しました"); }
    finally { setLoading(false); }
  }

  async function importTemplate() {
    if (!importFile) return;
    setImporting(true); setError("");
    try {
      const formData = new FormData();
      formData.append("file", importFile);
      formData.append("name", importName || importFile.name);
      const res = await fetch("/api/templates/import", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTemplates((p) => [...p, data]);
      setSelectedTemplateId(data.id);
      setImportFile(null); setImportName("");
    } catch (err) { setError(err instanceof Error ? err.message : "取り込みに失敗しました"); }
    finally { setImporting(false); }
  }

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-100 border-l-2 border-blue-500 pl-3">仕様書新規作成</h1>
      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {/* テンプレート選択 */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-4">
        <h2 className="font-semibold text-slate-200 border-l-2 border-blue-500 pl-3">1. フォーマットを選択</h2>
        {loading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-12 bg-slate-700 rounded-lg" />
            <div className="h-12 bg-slate-700 rounded-lg" />
          </div>
        ) : (
          <div className="space-y-2">
            {templates.map((t) => (
              <label key={t.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                  ${selectedTemplateId === t.id
                    ? "border-blue-500 bg-blue-900/20"
                    : "border-slate-700 hover:border-slate-500"
                  }`}
              >
                <input type="radio" name="template" value={t.id} checked={selectedTemplateId === t.id}
                  onChange={() => setSelectedTemplateId(t.id)}
                  className="text-blue-500" />
                <div className="flex-1">
                  <span className="font-medium text-sm text-slate-200">{t.name}</span>
                  {t.isDefault && (
                    <span className="ml-2 font-mono text-xs bg-blue-900/60 text-blue-300 px-1.5 py-0.5 rounded">DEFAULT</span>
                  )}
                </div>
                <span className="font-mono text-xs bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">
                  {t.sections.length}セクション
                </span>
              </label>
            ))}
            {templates.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">テンプレートがありません。以下から取り込んでください。</p>
            )}
          </div>
        )}

        {selectedTemplate && (
          <div className="p-3 bg-slate-900/60 rounded-lg">
            <p className="text-xs font-mono text-slate-500 mb-1.5">セクション構成</p>
            <div className="flex flex-wrap gap-1.5">
              {selectedTemplate.sections.map((s) => (
                <span key={s.id} className="font-mono text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                  {s.title}{s.required && <span className="text-red-400 ml-0.5">*</span>}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* フォーマット取り込み */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-4">
        <h2 className="font-semibold text-slate-200 border-l-2 border-blue-500 pl-3">フォーマットファイルを取り込む（任意）</h2>
        <FileUpload onFile={(f) => { setImportFile(f); setImportName(f.name.replace(/\.[^.]+$/, "")); }} disabled={importing} />
        {importFile && (
          <div className="space-y-2">
            <input type="text" placeholder="テンプレート名" value={importName} onChange={(e) => setImportName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            <button onClick={importTemplate} disabled={importing}
              className="w-full py-2 bg-slate-700 text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-600 disabled:opacity-40 transition-colors">
              {importing ? "取り込み中..." : "テンプレートとして登録"}
            </button>
          </div>
        )}
      </div>

      <button onClick={() => router.push(`/create/interview?templateId=${selectedTemplateId}`)}
        disabled={!selectedTemplateId}
        className="w-full py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-500 disabled:opacity-40 transition-colors">
        AIヒアリングを開始 →
      </button>
    </div>
  );
}
