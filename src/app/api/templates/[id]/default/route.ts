import { NextRequest, NextResponse } from "next/server";
import { setDefaultTemplate } from "@/lib/storage";

interface Params {
  params: { id: string };
}

export async function PUT(_req: NextRequest, { params }: Params) {
  try {
    await setDefaultTemplate(params.id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "デフォルト設定に失敗しました" }, { status: 500 });
  }
}
