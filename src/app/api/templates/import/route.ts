import { NextRequest, NextResponse } from "next/server";
import { extractSectionsFromDocx, extractSectionsFromXlsx } from "@/lib/fileParser";
import { saveTemplate } from "@/lib/storage";
import { Template } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const name = formData.get("name") as string | null;

    if (!file) {
      return NextResponse.json({ error: "ファイルが必要です" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.toLowerCase().split(".").pop();

    let sections;
    if (ext === "docx") {
      sections = await extractSectionsFromDocx(buffer);
    } else if (ext === "xlsx") {
      sections = await extractSectionsFromXlsx(buffer);
    } else {
      return NextResponse.json(
        { error: "Word（.docx）またはExcel（.xlsx）ファイルを使用してください" },
        { status: 400 }
      );
    }

    const template: Template = {
      id: `tmpl-${Date.now()}`,
      name: name || file.name,
      sections,
    };

    await saveTemplate(template);
    return NextResponse.json(template, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "テンプレートの取り込みに失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
