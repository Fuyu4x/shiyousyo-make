import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Packer,
  AlignmentType,
} from "docx";

interface Section {
  title: string;
  content: string;
}

export async function generateDocx(
  title: string,
  sections: Section[]
): Promise<Buffer> {
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  for (const section of sections) {
    children.push(
      new Paragraph({
        text: section.title,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    const lines = section.content.split("\n");
    for (const line of lines) {
      if (line.trim() === "") {
        children.push(new Paragraph({ text: "" }));
      } else {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: line })],
            spacing: { after: 100 },
          })
        );
      }
    }
  }

  const doc = new Document({
    sections: [
      {
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}

export function parseSpecTextToSections(specText: string): Section[] {
  const lines = specText.split("\n");
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const line of lines) {
    if (line.startsWith("# ") || line.startsWith("## ")) {
      if (current) sections.push(current);
      current = { title: line.replace(/^#{1,2}\s+/, ""), content: "" };
    } else {
      if (current) {
        current.content += (current.content ? "\n" : "") + line;
      } else {
        current = { title: "本文", content: line };
      }
    }
  }
  if (current) sections.push(current);
  return sections;
}
