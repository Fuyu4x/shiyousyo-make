import { NextRequest, NextResponse } from "next/server";
import { parseFileBuffer } from "@/lib/fileParser";
import { saveSpec } from "@/lib/storage";
import { SpecDoc } from "@/types";

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || "10") * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;
    const category = (formData.get("category") as string) || "common";

    if (!file) {
      return NextResponse.json({ error: "ファイルが必要です" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `ファイルサイズが上限（${process.env.MAX_FILE_SIZE_MB || 10}MB）を超えています` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const content = await parseFileBuffer(buffer, file.type, file.name);

    const spec: SpecDoc = {
      id: `spec-${Date.now()}`,
      title: title || file.name,
      category: (category as SpecDoc["category"]) || "common",
      uploadedAt: new Date().toISOString(),
      content,
    };

    await saveSpec(spec);
    return NextResponse.json({ id: spec.id, title: spec.title, content });
  } catch (err) {
    const message = err instanceof Error ? err.message : "ファイルのアップロードに失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
