"use client";
import { useEffect, useState } from "react";
import FileUpload from "@/components/FileUpload";
import { Template } from "@/types";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importName, setImportName] = useState("");
  const [preview, setPreview] = useState<Template | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => { fetchTemplates(); }, []);

  async function fetchTemplates() {
    setLoading(true);
    try {
      const data = await fetch("/api/templates").then((r) => r.json());
      setTemplates(data ?? []);
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
      setImportFile(null); setImportName("");
    } catch (err) { setError(err instanceof Error ? err.message : "取り込みに失敗しました"); }
    finally { setImporting(false); }
  }

  async function updateName(id: string) {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName }),
      });
      if (!res.ok) throw new Error();
      setTemplates((p) => p.map((t) => t.id === id ? { ...t, name: editName } : t));
      setEditingId(null);
    } catch { setError("更新に失敗しました"); }
    finally { setSaving(false); }
  }

  async function setDefault(id: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/templates/${id}/default`, { method: "PUT" });
      if (!res.ok) throw new Error();
      setTemplates((p) => p.map((t) => ({ ...t, isDefault: t.id === id })));
    } catch { setError("デフォルト設定に失敗しました"); }
    finally { setSaving(false); }
  }

  async function deleteTemplate(id: string) {
    if (!confirm("削除してもよいですか？")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setTemplates((p) => p.filter((t) => t.id !== id));
      if (preview?.id === id) setPreview(null);
    } catch { setError("削除に失敗しました"); }
    finally { setDeleting(null); }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-100 border-l-2 border-blue-500 pl-3">テンプレート管理</h1>
      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm flex justify-between">
          {error}
          <button onClick={() => setError("")} className="underline">閉じる</button>
        </div>
      )}

      {/* インポート */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-4">
        <h2 className="font-semibold text-slate-200 border-l-2 border-blue-500 pl-3">Wordファイルから取り込む</h2>
        <p className="text-xs text-slate-400">Word（.docx）の見出し構造を自動抽出してテンプレートを生成します</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 一覧 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-slate-200">登録済みテンプレート</h2>
            <span className="font-mono text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded">{templates.length}件</span>
          </div>
          {loading ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2].map((i) => <div key={i} className="h-24 bg-slate-800 border border-slate-700 rounded-lg" />)}
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center text-slate-500 py-12 bg-slate-800 border border-slate-700 rounded-lg text-sm">
              テンプレートがありません。上から取り込んでください。
            </div>
          ) : (
            <div className="space-y-2">
              {templates.map((t) => (
                <div key={t.id}
                  className={`bg-slate-800 border rounded-lg p-4 transition-colors
                    ${preview?.id === t.id ? "border-blue-500" : "border-slate-700 hover:border-slate-500"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {editingId === t.id ? (
                        <div className="flex gap-2">
                          <input value={editName} onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && updateName(t.id)}
                            className="flex-1 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                          <button onClick={() => updateName(t.id)} disabled={saving}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-500 disabled:opacity-40">保存</button>
                          <button onClick={() => setEditingId(null)}
                            className="px-2 py-1 bg-slate-700 text-slate-300 rounded text-xs hover:bg-slate-600">×</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-200 text-sm truncate">{t.name}</p>
                          {t.isDefault && (
                            <span className="font-mono text-xs bg-blue-900/60 text-blue-300 px-1.5 py-0.5 rounded shrink-0">DEFAULT</span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-xs text-slate-500">{t.sections.length}セクション</span>
                        {t.uploadedAt && (
                          <span className="font-mono text-xs text-slate-600">
                            {new Date(t.uploadedAt).toLocaleDateString("ja-JP")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0 flex-wrap justify-end">
                      <button onClick={() => setPreview(preview?.id === t.id ? null : t)}
                        className="font-mono text-xs text-slate-400 hover:text-blue-400 border border-slate-700 hover:border-blue-500 px-2 py-1 rounded transition-colors">
                        {preview?.id === t.id ? "閉じる" : "詳細"}
                      </button>
                      {!t.isDefault && (
                        <button onClick={() => setDefault(t.id)} disabled={saving}
                          className="font-mono text-xs text-slate-400 hover:text-emerald-400 border border-slate-700 hover:border-emerald-700 px-2 py-1 rounded transition-colors disabled:opacity-40">
                          DEFAULT
                        </button>
                      )}
                      <button onClick={() => { setEditingId(t.id); setEditName(t.name); }}
                        className="font-mono text-xs text-slate-400 hover:text-yellow-400 border border-slate-700 hover:border-yellow-700 px-2 py-1 rounded transition-colors">
                        編集
                      </button>
                      <button onClick={() => deleteTemplate(t.id)} disabled={deleting === t.id}
                        className="font-mono text-xs text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-700 px-2 py-1 rounded transition-colors disabled:opacity-40">
                        {deleting === t.id ? "..." : "削除"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* セクションプレビュー */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
          {preview ? (
            <div className="p-5 space-y-4">
              <h3 className="font-bold text-slate-100">{preview.name}</h3>
              {preview.description && (
                <p className="text-sm text-slate-400">{preview.description}</p>
              )}
              <div className="space-y-2">
                <p className="font-mono text-xs text-slate-500 border-l-2 border-blue-500 pl-2">セクション構成</p>
                {preview.sections.map((s, i) => (
                  <div key={i} className="bg-slate-900/60 border border-slate-700 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate-500">{i + 1}.</span>
                      <span className="font-medium text-slate-200 text-sm">{s.title}</span>
                      {s.required && <span className="font-mono text-xs text-red-400">必須</span>}
                      {s.level && (
                        <span className="font-mono text-xs bg-slate-700 text-slate-400 px-1 py-0.5 rounded ml-auto">
                          H{s.level}
                        </span>
                      )}
                    </div>
                    {s.description && (
                      <p className="text-xs text-slate-500 mt-1 ml-5">{s.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-sm">
              <span className="text-2xl mb-2">📋</span>
              テンプレートを選択すると詳細が表示されます
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
