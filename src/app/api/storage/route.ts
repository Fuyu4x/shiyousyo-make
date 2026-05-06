import { NextResponse } from "next/server";
import { listStorageEntries } from "@/lib/storage";

export async function GET() {
  try {
    const entries = await listStorageEntries();
    return NextResponse.json(entries);
  } catch {
    return NextResponse.json(
      { error: "ストレージ一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}
