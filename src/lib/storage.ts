import fs from "fs/promises";
import path from "path";
import { ReviewPointsData, Template, SpecDoc } from "@/types";

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.resolve(process.cwd(), "data");

export const PATHS = {
  reviewPoints: path.join(DATA_DIR, "masters", "review_points.json"),
  templates: path.join(DATA_DIR, "templates"),
  specs: path.join(DATA_DIR, "specs"),
  outputs: path.join(DATA_DIR, "outputs"),
};

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

async function writeJson(filePath: string, data: unknown) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// Review Points
export async function getReviewPoints(): Promise<ReviewPointsData> {
  return readJson<ReviewPointsData>(PATHS.reviewPoints);
}

export async function saveReviewPoints(data: ReviewPointsData) {
  await writeJson(PATHS.reviewPoints, data);
}

// Templates
export async function listTemplates(): Promise<Template[]> {
  await ensureDir(PATHS.templates);
  const files = await fs.readdir(PATHS.templates);
  const templates: Template[] = [];
  for (const file of files) {
    if (file.endsWith(".json")) {
      const t = await readJson<Template>(path.join(PATHS.templates, file));
      templates.push(t);
    }
  }
  return templates;
}

export async function getTemplate(id: string): Promise<Template | null> {
  const filePath = path.join(PATHS.templates, `${id}_format.json`);
  try {
    return await readJson<Template>(filePath);
  } catch {
    return null;
  }
}

export async function saveTemplate(template: Template) {
  const filePath = path.join(PATHS.templates, `${template.id}_format.json`);
  await writeJson(filePath, template);
}

// Specs
export async function listSpecs(keyword?: string): Promise<SpecDoc[]> {
  await ensureDir(PATHS.specs);
  const files = await fs.readdir(PATHS.specs);
  const specs: SpecDoc[] = [];
  for (const file of files) {
    if (file.endsWith("_spec.json")) {
      const s = await readJson<SpecDoc>(path.join(PATHS.specs, file));
      if (!keyword || s.title.includes(keyword) || s.content.includes(keyword)) {
        specs.push({ ...s, content: s.content.substring(0, 200) + "..." });
      }
    }
  }
  return specs.sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );
}

export async function getSpec(id: string): Promise<SpecDoc | null> {
  const filePath = path.join(PATHS.specs, `${id}_spec.json`);
  try {
    return await readJson<SpecDoc>(filePath);
  } catch {
    return null;
  }
}

export async function saveSpec(spec: SpecDoc) {
  const filePath = path.join(PATHS.specs, `${spec.id}_spec.json`);
  await writeJson(filePath, spec);
}

export async function deleteSpec(id: string) {
  const filePath = path.join(PATHS.specs, `${id}_spec.json`);
  await fs.unlink(filePath);
}

export async function saveOutput(filename: string, buffer: Buffer) {
  await ensureDir(PATHS.outputs);
  const filePath = path.join(PATHS.outputs, filename);
  await fs.writeFile(filePath, buffer);
  return filePath;
}
