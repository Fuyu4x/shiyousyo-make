import mammoth from "mammoth";
import * as XLSX from "xlsx";
import { TemplateSection } from "@/types";

export async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export async function extractTextFromXlsx(buffer: Buffer): Promise<string> {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const lines: string[] = [];
  for (const sheetName of workbook.SheetNames) {
    lines.push(`=== シート: ${sheetName} ===`);
    const sheet = workbook.Sheets[sheetName];
    const text = XLSX.utils.sheet_to_csv(sheet);
    lines.push(text);
  }
  return lines.join("\n");
}

export async function parseFileBuffer(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<string> {
  const ext = filename.toLowerCase().split(".").pop();
  if (
    ext === "docx" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return extractTextFromDocx(buffer);
  }
  if (
    ext === "xlsx" ||
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    return extractTextFromXlsx(buffer);
  }
  throw new Error("対応していないファイル形式です。Word（.docx）またはExcel（.xlsx）を使用してください。");
}

export async function extractSectionsFromDocx(buffer: Buffer): Promise<TemplateSection[]> {
  const result = await mammoth.convertToHtml({ buffer });
  const html = result.value;

  const sections: TemplateSection[] = [];
  const h1Regex = /<h1[^>]*>(.*?)<\/h1>/gi;
  const h2Regex = /<h2[^>]*>(.*?)<\/h2>/gi;

  let match: RegExpExecArray | null;
  while ((match = h1Regex.exec(html)) !== null) {
    const title = stripTags(match[1]).trim();
    if (title) {
      sections.push({
        id: `section-${sections.length + 1}`,
        title,
        required: true,
        description: "",
      });
    }
  }

  if (sections.length === 0) {
    while ((match = h2Regex.exec(html)) !== null) {
      const title = stripTags(match[1]).trim();
      if (title) {
        sections.push({
          id: `section-${sections.length + 1}`,
          title,
          required: true,
          description: "",
        });
      }
    }
  }

  return sections;
}

export async function extractSectionsFromXlsx(buffer: Buffer): Promise<TemplateSection[]> {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sections: TemplateSection[] = [];
  let idx = 1;

  for (const sheetName of workbook.SheetNames) {
    sections.push({
      id: `section-${idx++}`,
      title: sheetName,
      required: true,
      description: "",
    });
  }
  return sections;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}
