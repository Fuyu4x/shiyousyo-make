import { NextRequest } from "next/server";
import { getTemplate } from "@/lib/storage";
import { createReadableStream } from "@/lib/anthropic";
import { InterviewMessage } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { templateId, interviewHistory } = body as {
      templateId: string;
      interviewHistory: InterviewMessage[];
    };

    const template = await getTemplate(templateId);
    if (!template) {
      return new Response(JSON.stringify({ error: "テンプレートが見つかりません" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const sectionList = template.sections
      .map((s) => `## ${s.title}\n${s.description || "（記載内容を入力）"}`)
      .join("\n\n");

    const interviewSummary = interviewHistory
      .map((m) => `${m.role === "user" ? "ユーザ" : "AI"}: ${m.content}`)
      .join("\n");

    const system = `あなたはITシステム発注仕様書の作成専門家です。
以下のヒアリング結果とフォーマットをもとに、発注仕様書のドラフトを作成してください。
各セクションを充実した内容で記載し、ヒアリングで得られた情報を最大限活用してください。
出力はMarkdown形式で、各セクションを「# セクション名」の見出しで区切ってください。
日本語で回答してください。`;

    const userContent = `【ヒアリング結果】\n${interviewSummary}\n\n【テンプレート構成】\n${sectionList}`;

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
    const message = err instanceof Error ? err.message : "仕様書生成に失敗しました";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
