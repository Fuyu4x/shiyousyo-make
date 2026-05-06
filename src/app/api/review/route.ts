import { NextRequest } from "next/server";
import { getReviewPoints, getStorageEntry } from "@/lib/storage";
import { createReadableStream } from "@/lib/anthropic";
import { ReviewCategory } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      specText,
      selectedCategoryIds,
      referenceSpecIds = [],
    } = body as {
      specText: string;
      selectedCategoryIds: string[];
      referenceSpecIds?: string[];
    };

    if (!specText) {
      return new Response(JSON.stringify({ error: "仕様書テキストが必要です" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 観点マスタ
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

    // ストレージ参照: 構造化JSONのsummary + keyPointsのみ使用（トークン最適化）
    let referenceText = "";
    if (referenceSpecIds.length > 0) {
      const refParts: string[] = [];
      for (const id of referenceSpecIds) {
        const entry = await getStorageEntry(id);
        if (!entry) continue;
        const sectionSummary = entry.sections
          .map((s) => `${s.title}: ${s.keyPoints.join("、")}`)
          .join(" / ");
        refParts.push(
          `【参照仕様書: ${entry.title}】\n` +
          `サマリー: ${entry.summary}\n` +
          `主要セクション: ${sectionSummary}\n` +
          `品質スコア: ${entry.qualityScore}/100`
        );
      }
      if (refParts.length > 0) {
        referenceText = "\n\n【比較参照仕様書（要約）】\n" + refParts.join("\n\n");
      }
    }

    const system = `あなたはITシステム発注仕様書の専門レビュアーです。
以下の観点と参照仕様書を踏まえ、アップロードされた仕様書を評価してください。

評価は以下のフォーマットで出力してください：
■ 総合評価: [S / A / B / C]
（S: 非常に高品質、A: 良好、B: 改善余地あり、C: 大幅な改善が必要）

■ 検出された不足・懸念事項
  - [観点カテゴリ] 項目名: 指摘内容 / 改善提案

■ 良好な記載箇所
  - 項目名: コメント

■ 推奨追記事項（箇条書き）

日本語で回答してください。`;

    const userContent =
      `【レビュー対象仕様書】\n${specText}\n\n【評価観点】\n${pointsText}${referenceText}`;

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
