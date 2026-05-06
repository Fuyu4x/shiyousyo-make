import { NextRequest } from "next/server";
import { getSpec } from "@/lib/storage";
import { createReadableStream } from "@/lib/anthropic";
import { InterviewMessage } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { specId, interviewHistory } = body as {
      specId: string;
      interviewHistory: InterviewMessage[];
    };

    const spec = await getSpec(specId);
    if (!spec) {
      return new Response(JSON.stringify({ error: "仕様書が見つかりません" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const interviewSummary = interviewHistory
      .map((m) => `${m.role === "user" ? "ユーザ" : "AI"}: ${m.content}`)
      .join("\n");

    const system = `あなたはITシステムの改修仕様書作成を支援する専門家です。
添付の既存仕様書をベースに、ヒアリング内容をもとに変更差分を明確にした改修仕様書を作成してください。
変更箇所は [変更] [追加] [削除] のタグで明示してください。
出力はMarkdown形式で記載してください。
日本語で回答してください。`;

    const userContent = `【既存仕様書: ${spec.title}】\n${spec.content}\n\n【改修内容ヒアリング結果】\n${interviewSummary}`;

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
    const message = err instanceof Error ? err.message : "改修仕様書の生成に失敗しました";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
