import { NextRequest, NextResponse } from "next/server";
import { generateDocx, parseSpecTextToSections } from "@/lib/wordExport";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, specText } = body as { title: string; specText: string };

    if (!specText) {
      return NextResponse.json({ error: "仕様書テキストが必要です" }, { status: 400 });
    }

    const sections = parseSpecTextToSections(specText);
    const buffer = await generateDocx(title || "仕様書ドラフト", sections);

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(title || "仕様書ドラフト")}.docx`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Word出力に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
