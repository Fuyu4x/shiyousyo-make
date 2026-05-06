import { NextRequest, NextResponse } from "next/server";
import { getReviewPoints, saveReviewPoints } from "@/lib/storage";
import { ReviewPoint } from "@/types";

interface Params {
  params: { id: string };
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const body = await req.json();
    const data = await getReviewPoints();

    // id がカテゴリIDなら観点を追加、観点IDなら観点を更新
    let updated = false;

    // カテゴリへの観点追加
    if (body.action === "add_point") {
      const cat = data.categories.find((c) => c.id === id);
      if (!cat) {
        return NextResponse.json({ error: "カテゴリが見つかりません" }, { status: 404 });
      }
      const newPoint: ReviewPoint = {
        id: `point-${Date.now()}`,
        title: body.title,
        description: body.description || "",
      };
      cat.points.push(newPoint);
      await saveReviewPoints(data);
      return NextResponse.json(newPoint, { status: 201 });
    }

    // カテゴリ名更新
    for (const cat of data.categories) {
      if (cat.id === id) {
        if (body.name) cat.name = body.name;
        updated = true;
        break;
      }
      // 観点更新
      const pointIdx = cat.points.findIndex((p) => p.id === id);
      if (pointIdx !== -1) {
        cat.points[pointIdx] = { ...cat.points[pointIdx], ...body };
        updated = true;
        break;
      }
    }

    if (!updated) {
      return NextResponse.json({ error: "対象が見つかりません" }, { status: 404 });
    }

    await saveReviewPoints(data);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const data = await getReviewPoints();

    // カテゴリ削除
    const catIdx = data.categories.findIndex((c) => c.id === id);
    if (catIdx !== -1) {
      data.categories.splice(catIdx, 1);
      await saveReviewPoints(data);
      return NextResponse.json({ success: true });
    }

    // 観点削除
    for (const cat of data.categories) {
      const pointIdx = cat.points.findIndex((p) => p.id === id);
      if (pointIdx !== -1) {
        cat.points.splice(pointIdx, 1);
        await saveReviewPoints(data);
        return NextResponse.json({ success: true });
      }
    }

    return NextResponse.json({ error: "対象が見つかりません" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
