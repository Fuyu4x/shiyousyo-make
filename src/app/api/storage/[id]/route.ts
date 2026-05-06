import { NextRequest, NextResponse } from "next/server";
import { getStorageEntry, deleteStorageEntry } from "@/lib/storage";

interface Params {
  params: { id: string };
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const entry = await getStorageEntry(params.id);
    if (!entry) {
      return NextResponse.json({ error: "見つかりません" }, { status: 404 });
    }
    return NextResponse.json(entry);
  } catch {
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await deleteStorageEntry(params.id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
