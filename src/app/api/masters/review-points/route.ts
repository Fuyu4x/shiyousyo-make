import { NextRequest, NextResponse } from "next/server";
import { getReviewPoints, saveReviewPoints } from "@/lib/storage";
import { ReviewCategory } from "@/types";

export async function GET() {
  try {
    const data = await getReviewPoints();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "観点マスタの取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name } = body as { name: string };
    if (!name) {
      return NextResponse.json({ error: "カテゴリ名は必須です" }, { status: 400 });
    }

    const data = await getReviewPoints();
    const newCategory: ReviewCategory = {
      id: `cat-${Date.now()}`,
      name,
      points: [],
    };
    data.categories.push(newCategory);
    await saveReviewPoints(data);
    return NextResponse.json(newCategory, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "カテゴリの追加に失敗しました" },
      { status: 500 }
    );
  }
}
