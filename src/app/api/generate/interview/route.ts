import { NextRequest } from "next/server";
import { getTemplate } from "@/lib/storage";
import { createReadableStream } from "@/lib/anthropic";
import { InterviewMessage } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { templateId, messages } = body as {
      templateId: string;
      messages: InterviewMessage[];
    };

    const template = await getTemplate(templateId);
    if (!template) {
      return new Response(JSON.stringify({ error: "テンプレートが見つかりません" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const sectionList = template.sections
      .map((s) => `- ${s.title}${s.required ? "（必須）" : ""}`)
      .join("\n");

    const system = `あなたはITシステム発注仕様書の作成を支援するアシスタントです。
以下のフォーマット構成をもとに、仕様書作成に必要な情報をステップバイステップでヒアリングしてください。
1回の質問は1〜2項目に絞り、会話を自然に進めてください。
すべての必須項目についてヒアリングが完了したら、「ヒアリング完了」と伝え、収集した情報のサマリーを提示してください。

【フォーマット構成】
${sectionList}

日本語で回答してください。`;

    const stream = await createReadableStream(system, messages);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "ヒアリングに失敗しました";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
