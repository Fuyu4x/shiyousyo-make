"use client";
import { useEffect, useState } from "react";
import { ReviewCategory, ReviewPoint } from "@/types";

export default function MastersPage() {
  const [categories, setCategories] = useState<ReviewCategory[]>([]);
  const [activeTab, setActiveTab] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [newCatName, setNewCatName] = useState("");
  const [newPointTitle, setNewPointTitle] = useState("");
  const [newPointDesc, setNewPointDesc] = useState("");
  const [editingPoint, setEditingPoint] = useState<ReviewPoint | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/masters/review-points");
      const data = await res.json();
      setCategories(data.categories ?? []);
      if (!activeTab && data.categories?.length > 0) setActiveTab(data.categories[0].id);
    } catch { setError("観点マスタの取得に失敗しました"); }
    finally { setLoading(false); }
  }

  async function addCategory() {
    if (!newCatName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/masters/review-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName }),
      });
      if (!res.ok) throw new Error();
      const cat = await res.json();
      setCategories((p) => [...p, cat]);
      setActiveTab(cat.id);
      setNewCatName("");
    } catch { setError("カテゴリの追加に失敗しました"); }
    finally { setSaving(false); }
  }

  async function addPoint(catId: string) {
    if (!newPointTitle.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/masters/review-points/${catId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_point", title: newPointTitle, description: newPointDesc }),
      });
      if (!res.ok) throw new Error();
      const point = await res.json();
      setCategories((p) => p.map((c) => c.id === catId ? { ...c, points: [...c.points, point] } : c));
      setNewPointTitle(""); setNewPointDesc("");
    } catch { setError("観点の追加に失敗しました"); }
    finally { setSaving(false); }
  }

  async function updatePoint(pointId: string) {
    if (!editingPoint) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/masters/review-points/${pointId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editingPoint.title, description: editingPoint.description }),
      });
      if (!res.ok) throw new Error();
      setCategories((p) => p.map((c) => ({ ...c, points: c.points.map((pt) => pt.id === pointId ? editingPoint : pt) })));
      setEditingPoint(null);
    } catch { setError("観点の更新に失敗しました"); }
    finally { setSaving(false); }
  }

  async function deleteItem(id: string) {
    if (!confirm("削除してもよいですか？")) return;
    try {
      const res = await fetch(`/api/masters/review-points/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setCategories((prev) => {
        const withoutCat = prev.filter((c) => c.id !== id);
        if (withoutCat.length !== prev.length) {
          setActiveTab(withoutCat[0]?.id ?? "");
          return withoutCat;
        }
        return prev.map((c) => ({ ...c, points: c.points.filter((p) => p.id !== id) }));
      });
    } catch { setError("削除に失敗しました"); }
  }

  const activeCategory = categories.find((c) => c.id === activeTab);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-slate-700 rounded" />
        <div className="bg-slate-800 border border-slate-700 rounded-lg h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-100 border-l-2 border-blue-500 pl-3">観点マスタ管理</h1>
      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm flex justify-between">
          {error}
          <button className="underline" onClick={() => setError("")}>閉じる</button>
        </div>
      )}

      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        {/* タブ */}
        <div className="border-b border-slate-700 flex items-center overflow-x-auto bg-slate-900/50">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                ${activeTab === cat.id
                  ? "border-blue-500 text-blue-400 bg-slate-800"
                  : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
            >
              {cat.name}
              <span className="ml-2 font-mono text-xs bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">
                {cat.points.length}
              </span>
            </button>
          ))}
          <div className="ml-auto px-3 py-2 flex items-center gap-2 shrink-0">
            <input
              type="text"
              placeholder="新規カテゴリ名"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCategory()}
              className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-slate-100 placeholder-slate-500 w-36 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={addCategory}
              disabled={saving || !newCatName.trim()}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-500 disabled:opacity-40 transition-colors"
            >
              追加
            </button>
          </div>
        </div>

        {/* 観点一覧 */}
        {activeCategory && (
          <div className="p-4 space-y-3">
            {activeCategory.points.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-6">観点がありません。以下から追加してください。</p>
            )}
            {activeCategory.points.map((point) => (
              <div key={point.id} className="border border-slate-700 rounded-lg p-4 bg-slate-900/30 hover:border-slate-600 transition-colors">
                {editingPoint?.id === point.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editingPoint.title}
                      onChange={(e) => setEditingPoint({ ...editingPoint, title: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <textarea
                      value={editingPoint.description}
                      onChange={(e) => setEditingPoint({ ...editingPoint, description: e.target.value })}
                      rows={2}
                      className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-sm text-slate-100 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => updatePoint(point.id)} disabled={saving}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-500 disabled:opacity-40">保存</button>
                      <button onClick={() => setEditingPoint(null)}
                        className="px-3 py-1 bg-slate-700 text-slate-300 rounded text-sm hover:bg-slate-600">キャンセル</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-200 text-sm">{point.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{point.description}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => setEditingPoint(point)}
                        className="font-mono text-xs text-slate-400 hover:text-blue-400 border border-slate-700 px-2 py-1 rounded hover:border-blue-500 transition-colors">編集</button>
                      <button onClick={() => deleteItem(point.id)}
                        className="font-mono text-xs text-slate-400 hover:text-red-400 border border-slate-700 px-2 py-1 rounded hover:border-red-700 transition-colors">削除</button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* 観点追加フォーム */}
            <div className="border border-dashed border-slate-600 rounded-lg p-4 space-y-2 bg-slate-900/20">
              <p className="text-xs font-mono text-slate-500">観点を追加</p>
              <input type="text" placeholder="観点タイトル" value={newPointTitle} onChange={(e) => setNewPointTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              <textarea placeholder="観点の説明（任意）" value={newPointDesc} onChange={(e) => setNewPointDesc(e.target.value)} rows={2}
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500" />
              <div className="flex items-center gap-2">
                <button onClick={() => addPoint(activeCategory.id)} disabled={saving || !newPointTitle.trim()}
                  className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-500 disabled:opacity-40 transition-colors">観点を追加</button>
                <button onClick={() => deleteItem(activeCategory.id)}
                  className="ml-auto font-mono text-xs text-red-400 border border-red-800 px-3 py-1.5 rounded hover:bg-red-900/30 transition-colors">このカテゴリを削除</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
