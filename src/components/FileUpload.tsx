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
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
        ${dragging ? "border-primary-500 bg-primary-50" : "border-gray-300 hover:border-gray-400"}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
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
      <div className="text-gray-500">
        <svg className="mx-auto h-10 w-10 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {fileName ? (
          <p className="text-sm font-medium text-primary-600">{fileName}</p>
        ) : (
          <p className="text-sm">{label}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">対応形式: .docx / .xlsx（最大10MB）</p>
      </div>
    </div>
  );
}
