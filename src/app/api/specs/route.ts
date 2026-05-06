import { NextRequest, NextResponse } from "next/server";
import { listSpecs, deleteSpec } from "@/lib/storage";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const keyword = searchParams.get("keyword") || undefined;
    const specs = await listSpecs(keyword);
    return NextResponse.json(specs);
  } catch {
    return NextResponse.json(
      { error: "仕様書一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "IDが必要です" }, { status: 400 });
    }
    await deleteSpec(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
