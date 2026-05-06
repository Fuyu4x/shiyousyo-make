import { NextRequest } from "next/server";
import { getReviewPoints, getSpec } from "@/lib/storage";
import { createReadableStream } from "@/lib/anthropic";
import { ReviewCategory } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { specText, selectedCategoryIds, compareSpecId } = body as {
      specText: string;
      selectedCategoryIds: string[];
      compareSpecId?: string;
    };

    if (!specText) {
      return new Response(JSON.stringify({ error: "仕様書テキストが必要です" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const reviewPointsData = await getReviewPoints();
    let selectedCategories: ReviewCategory[] = [];

    if (selectedCategoryIds && selectedCategoryIds.length > 0) {
      selectedCategories = reviewPointsData.categories.filter((c) =>
        selectedCategoryIds.includes(c.id)
      );
    } else {
      selectedCategories = reviewPointsData.categories;
    }

    const pointsText = selectedCategories
      .map(
        (cat) =>
          `【${cat.name}】\n` +
          cat.points.map((p) => `- ${p.title}: ${p.description}`).join("\n")
      )
      .join("\n\n");

    let compareText = "";
    if (compareSpecId) {
      const compareSpec = await getSpec(compareSpecId);
      if (compareSpec) {
        compareText = `\n\n【比較対象の過去仕様書: ${compareSpec.title}】\n${compareSpec.content}`;
      }
    }

    const system = `あなたはITシステム発注仕様書の専門レビュアーです。
以下の観点と過去の仕様書を参照し、アップロードされた仕様書を評価してください。

評価は以下のフォーマットで出力してください：
■ 総合評価: [S / A / B / C]
（S: 非常に高品質、A: 良好、B: 改善余地あり、C: 大幅な改善が必要）

■ 検出された不足・懸念事項
  - [観点カテゴリ] 項目名: 指摘内容 / 改善提案

■ 良好な記載箇所
  - 項目名: コメント

■ 推奨追記事項（箇条書き）

日本語で回答してください。`;

    const userContent = `【レビュー対象仕様書】\n${specText}\n\n【評価観点】\n${pointsText}${compareText}`;

    const stream = await createReadableStream(system, [
      { role: "user", content: userContent },
    ]);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "レビューに失敗しました";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
