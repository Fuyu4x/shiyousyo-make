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

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    setLoading(true);
    try {
      const res = await fetch("/api/templates");
      const data = await res.json();
      setTemplates(data || []);
      if (data?.length > 0) setSelectedTemplateId(data[0].id);
    } catch {
      setError("テンプレート一覧の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  async function importTemplate() {
    if (!importFile) return;
    setImporting(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", importFile);
      formData.append("name", importName || importFile.name);
      const res = await fetch("/api/templates/import", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTemplates((prev) => [...prev, data]);
      setSelectedTemplateId(data.id);
      setImportFile(null);
      setImportName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "取り込みに失敗しました");
    } finally {
      setImporting(false);
    }
  }

  function startInterview() {
    if (!selectedTemplateId) return;
    router.push(`/create/interview?templateId=${selectedTemplateId}`);
  }

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">仕様書新規作成</h1>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* テンプレート選択 */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">1. フォーマット（テンプレート）を選択</h2>
        {loading ? (
          <p className="text-sm text-gray-400">読み込み中...</p>
        ) : (
          <div className="space-y-2">
            {templates.map((t) => (
              <label
                key={t.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                  ${selectedTemplateId === t.id
                    ? "border-primary-500 bg-primary-50"
                    : "border-gray-200 hover:border-gray-300"
                  }`}
              >
                <input
                  type="radio"
                  name="template"
                  value={t.id}
                  checked={selectedTemplateId === t.id}
                  onChange={() => setSelectedTemplateId(t.id)}
                />
                <div>
                  <p className="font-medium text-sm text-gray-800">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.sections.length}セクション</p>
                </div>
              </label>
            ))}
            {templates.length === 0 && (
              <p className="text-sm text-gray-400">テンプレートがありません。以下から取り込んでください。</p>
            )}
          </div>
        )}

        {selectedTemplate && (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-500 mb-1">セクション構成:</p>
            <div className="flex flex-wrap gap-1">
              {selectedTemplate.sections.map((s) => (
                <span key={s.id} className="text-xs bg-white border border-gray-200 px-2 py-0.5 rounded">
                  {s.title}{s.required && <span className="text-red-400 ml-0.5">*</span>}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* テンプレート取り込み */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">フォーマットファイルを取り込む（任意）</h2>
        <FileUpload
          onFile={(f) => { setImportFile(f); setImportName(f.name.replace(/\.[^.]+$/, "")); }}
          disabled={importing}
        />
        {importFile && (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="テンプレート名"
              value={importName}
              onChange={(e) => setImportName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={importTemplate}
              disabled={importing}
              className="w-full py-2 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
            >
              {importing ? "取り込み中..." : "テンプレートとして登録"}
            </button>
          </div>
        )}
      </div>

      {/* ヒアリング開始 */}
      <button
        onClick={startInterview}
        disabled={!selectedTemplateId}
        className="w-full py-4 bg-primary-600 text-white rounded-xl font-semibold text-lg hover:bg-primary-700 disabled:opacity-50"
      >
        AIヒアリングを開始 →
      </button>
    </div>
  );
}
