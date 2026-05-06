import { NextRequest, NextResponse } from "next/server";
import { parseFileBuffer } from "@/lib/fileParser";
import { generateText } from "@/lib/anthropic";
import { addStorageEntry, saveOriginalFile } from "@/lib/storage";
import { StorageEntry } from "@/types";

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || "10") * 1024 * 1024;

const STRUCTURE_SYSTEM = `あなたは発注仕様書を分析する専門家です。
以下の仕様書テキストを分析し、必ずJSON形式のみで返してください。
余分なテキストやMarkdownコードブロック（\`\`\`json 等）は不要です。

JSONスキーマ（このスキーマに厳密に従うこと）：
{
  "title": "仕様書タイトル（文書内から読み取る）",
  "category": "app または infra または common または other",
  "summary": "300字以内のサマリー",
  "sections": [
    { "title": "セクション名", "level": 1, "keyPoints": ["要点1", "要点2"] }
  ],
  "keywords": ["キーワード1", "キーワード2"],
  "missingChecklist": ["不足していると思われる観点1", "観点2"],
  "qualityScore": 75,
  "phase": "mvp または production または unknown"
}`;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "ファイルが必要です" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `ファイルサイズが上限（${process.env.MAX_FILE_SIZE_MB ?? 10}MB）を超えています` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // テキスト抽出
    const rawText = await parseFileBuffer(buffer, file.type, file.name);

    // Claude で構造化（非ストリーミング）
    const jsonText = await generateText(STRUCTURE_SYSTEM, [
      { role: "user", content: rawText.slice(0, 8000) },
    ]);

    // JSON パース（マークダウンブロック対応）
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    let parsed: Partial<StorageEntry> = {};
    try {
      parsed = JSON.parse(jsonMatch?.[0] ?? jsonText);
    } catch {
      parsed = {
        title: file.name,
        category: "other",
        summary: rawText.slice(0, 200),
        sections: [],
        keywords: [],
        missingChecklist: [],
        qualityScore: 0,
        phase: "unknown",
      };
    }

    const id = `storage-${Date.now()}`;
    const entry: StorageEntry = {
      id,
      title: parsed.title ?? file.name,
      category: parsed.category ?? "other",
      uploadedAt: new Date().toISOString(),
      originalFileName: file.name,
      summary: parsed.summary ?? "",
      sections: parsed.sections ?? [],
      keywords: parsed.keywords ?? [],
      missingChecklist: parsed.missingChecklist ?? [],
      qualityScore: parsed.qualityScore ?? 0,
      phase: parsed.phase ?? "unknown",
    };

    // ファイル保存
    await saveOriginalFile(id, buffer, file.name);
    await addStorageEntry(entry);

    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "アップロードに失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
