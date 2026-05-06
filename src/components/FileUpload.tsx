"use client";
import { useRef, useState } from "react";

interface Props {
  onFile: (file: File) => void;
  accept?: string;
  label?: string;
  disabled?: boolean;
}

export default function FileUpload({
  onFile,
  accept = ".docx,.xlsx",
  label = "Word / Excel ファイルをドロップ、またはクリックして選択",
  disabled = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  function handleFile(file: File) {
    setFileName(file.name);
    onFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${dragging ? "border-blue-500 bg-blue-900/20" : "border-slate-600 hover:border-blue-500 hover:bg-slate-800/50"}
        ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={disabled ? undefined : onDrop}
      onClick={() => !disabled && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={onInputChange}
        disabled={disabled}
      />
      <div className="text-slate-400">
        <svg className="mx-auto h-10 w-10 mb-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {fileName ? (
          <p className="text-sm font-medium text-blue-400 font-mono">{fileName}</p>
        ) : (
          <p className="text-sm text-slate-300">{label}</p>
        )}
        <p className="text-xs text-slate-500 mt-2 font-mono">対応形式: .docx / .xlsx（最大10MB）</p>
      </div>
    </div>
  );
}
