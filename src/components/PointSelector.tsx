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

  const allSelected = selectedIds.length === categories.length;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 pb-2 border-b">
        <input
          type="checkbox"
          id="select-all"
          checked={allSelected}
          onChange={toggleAll}
          className="rounded"
        />
        <label htmlFor="select-all" className="text-sm font-medium text-gray-700 cursor-pointer">
          すべて選択
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {categories.map((cat) => (
          <label
            key={cat.id}
            className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors
              ${selectedIds.includes(cat.id)
                ? "border-primary-500 bg-primary-50"
                : "border-gray-200 hover:border-gray-300"
              }`}
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(cat.id)}
              onChange={() => toggleCategory(cat.id)}
              className="rounded"
            />
            <span className="text-sm font-medium text-gray-700">{cat.name}</span>
            <span className="ml-auto text-xs text-gray-400">{cat.points.length}項目</span>
          </label>
        ))}
      </div>
    </div>
  );
}
