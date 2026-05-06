import Anthropic from "@anthropic-ai/sdk";

// claude-sonnet-4-20250514 as specified; override via ANTHROPIC_MODEL env var
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";

export function getClient() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

export async function createReadableStream(
  system: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>
): Promise<ReadableStream> {
  const client = getClient();
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        const stream = await client.messages.stream({
          model: MODEL,
          max_tokens: 4096,
          system,
          messages,
        });

        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}

export async function generateText(
  system: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string> {
  const client = getClient();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system,
    messages,
  });

  const block = response.content[0];
  if (block.type === "text") return block.text;
  return "";
}
