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

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/masters/review-points");
      const data = await res.json();
      setCategories(data.categories || []);
      if (!activeTab && data.categories?.length > 0) {
        setActiveTab(data.categories[0].id);
      }
    } catch {
      setError("観点マスタの取得に失敗しました");
    } finally {
      setLoading(false);
    }
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
      setCategories((prev) => [...prev, cat]);
      setActiveTab(cat.id);
      setNewCatName("");
    } catch {
      setError("カテゴリの追加に失敗しました");
    } finally {
      setSaving(false);
    }
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
      setCategories((prev) =>
        prev.map((c) => c.id === catId ? { ...c, points: [...c.points, point] } : c)
      );
      setNewPointTitle("");
      setNewPointDesc("");
    } catch {
      setError("観点の追加に失敗しました");
    } finally {
      setSaving(false);
    }
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
      setCategories((prev) =>
        prev.map((c) => ({
          ...c,
          points: c.points.map((p) => p.id === pointId ? editingPoint : p),
        }))
      );
      setEditingPoint(null);
    } catch {
      setError("観点の更新に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(id: string) {
    if (!confirm("削除してもよいですか？")) return;
    try {
      const res = await fetch(`/api/masters/review-points/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setCategories((prev) => {
        const withoutCat = prev.filter((c) => c.id !== id);
        if (withoutCat.length !== prev.length) {
          setActiveTab(withoutCat[0]?.id || "");
          return withoutCat;
        }
        return prev.map((c) => ({ ...c, points: c.points.filter((p) => p.id !== id) }));
      });
    } catch {
      setError("削除に失敗しました");
    }
  }

  const activeCategory = categories.find((c) => c.id === activeTab);

  if (loading) {
    return <div className="flex justify-center items-center h-40 text-gray-400">読み込み中...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">観点マスタ管理</h1>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
          <button className="ml-2 underline" onClick={() => setError("")}>閉じる</button>
        </div>
      )}

      {/* カテゴリタブ */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="border-b border-gray-200 flex items-center overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                ${activeTab === cat.id
                  ? "border-primary-600 text-primary-700 bg-primary-50"
                  : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
            >
              {cat.name}
              <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                {cat.points.length}
              </span>
            </button>
          ))}
          <div className="ml-auto px-3 flex items-center gap-2 shrink-0">
            <input
              type="text"
              placeholder="新規カテゴリ名"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCategory()}
              className="border border-gray-300 rounded px-2 py-1 text-sm w-36 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <button
              onClick={addCategory}
              disabled={saving || !newCatName.trim()}
              className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700 disabled:opacity-50"
            >
              追加
            </button>
          </div>
        </div>

        {/* 観点一覧 */}
        {activeCategory && (
          <div className="p-4 space-y-3">
            {activeCategory.points.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">観点がありません。以下から追加してください。</p>
            )}
            {activeCategory.points.map((point) => (
              <div key={point.id} className="border border-gray-200 rounded-lg p-4">
                {editingPoint?.id === point.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editingPoint.title}
                      onChange={(e) => setEditingPoint({ ...editingPoint, title: e.target.value })}
                      className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                    <textarea
                      value={editingPoint.description}
                      onChange={(e) => setEditingPoint({ ...editingPoint, description: e.target.value })}
                      rows={2}
                      className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => updatePoint(point.id)}
                        disabled={saving}
                        className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700 disabled:opacity-50"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => setEditingPoint(null)}
                        className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{point.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{point.description}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => setEditingPoint(point)}
                        className="text-xs text-gray-500 hover:text-primary-600 border border-gray-200 px-2 py-1 rounded"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => deleteItem(point.id)}
                        className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-2 py-1 rounded"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* 観点追加フォーム */}
            <div className="border border-dashed border-gray-300 rounded-lg p-4 space-y-2 bg-gray-50">
              <p className="text-xs font-medium text-gray-500">観点を追加</p>
              <input
                type="text"
                placeholder="観点タイトル（例: 個人情報の取扱い定義）"
                value={newPointTitle}
                onChange={(e) => setNewPointTitle(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <textarea
                placeholder="観点の説明（任意）"
                value={newPointDesc}
                onChange={(e) => setNewPointDesc(e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => addPoint(activeCategory.id)}
                  disabled={saving || !newPointTitle.trim()}
                  className="px-4 py-1.5 bg-primary-600 text-white rounded text-sm hover:bg-primary-700 disabled:opacity-50"
                >
                  観点を追加
                </button>
                <button
                  onClick={() => deleteItem(activeCategory.id)}
                  className="ml-auto px-3 py-1.5 text-red-600 border border-red-200 rounded text-sm hover:bg-red-50"
                >
                  このカテゴリを削除
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
