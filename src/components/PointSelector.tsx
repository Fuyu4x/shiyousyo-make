"use client";
import { ReviewCategory } from "@/types";

interface Props {
  categories: ReviewCategory[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export default function PointSelector({ categories, selectedIds, onChange }: Props) {
  function toggleCategory(catId: string) {
    if (selectedIds.includes(catId)) {
      onChange(selectedIds.filter((id) => id !== catId));
    } else {
      onChange([...selectedIds, catId]);
    }
  }

  function toggleAll() {
    if (selectedIds.length === categories.length) {
      onChange([]);
    } else {
      onChange(categories.map((c) => c.id));
    }
  }

  const allSelected = selectedIds.length === categories.length && categories.length > 0;

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 cursor-pointer pb-2 border-b border-slate-700">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleAll}
          className="rounded bg-slate-800 border-slate-600 text-blue-500 focus:ring-blue-500"
        />
        <span className="text-sm font-medium text-slate-300">すべて選択</span>
      </label>
      <div className="grid grid-cols-2 gap-2">
        {categories.map((cat) => {
          const selected = selectedIds.includes(cat.id);
          return (
            <label
              key={cat.id}
              className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors
                ${selected
                  ? "border-blue-500 bg-blue-900/20"
                  : "border-slate-700 hover:border-slate-500 bg-slate-800/50"
                }`}
            >
              <input
                type="checkbox"
                checked={selected}
                onChange={() => toggleCategory(cat.id)}
                className="rounded bg-slate-800 border-slate-600 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-200">{cat.name}</span>
              <span className="ml-auto font-mono text-xs bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">
                {cat.points.length}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
