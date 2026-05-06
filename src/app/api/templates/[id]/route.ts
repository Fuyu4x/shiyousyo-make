import { NextRequest, NextResponse } from "next/server";
import { getTemplate, saveTemplate, deleteTemplate } from "@/lib/storage";
import { Template } from "@/types";

interface Params {
  params: { id: string };
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const existing = await getTemplate(params.id);
    if (!existing) {
      return NextResponse.json({ error: "テンプレートが見つかりません" }, { status: 404 });
    }
    const body = await req.json() as Partial<Template>;
    const updated: Template = { ...existing, ...body, id: params.id };
    await saveTemplate(updated);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await deleteTemplate(params.id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
