import { NextRequest, NextResponse } from "next/server";
import { listTemplates, saveTemplate } from "@/lib/storage";
import { Template } from "@/types";

export async function GET() {
  try {
    const templates = await listTemplates();
    return NextResponse.json(templates);
  } catch {
    return NextResponse.json(
      { error: "テンプレート一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const template = body as Template;
    if (!template.id || !template.name || !template.sections) {
      return NextResponse.json(
        { error: "id、name、sectionsは必須です" },
        { status: 400 }
      );
    }
    await saveTemplate(template);
    return NextResponse.json(template, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "テンプレートの保存に失敗しました" },
      { status: 500 }
    );
  }
}
