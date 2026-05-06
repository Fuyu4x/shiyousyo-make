import fs from "fs/promises";
import path from "path";
import {
  ReviewPointsData,
  Template,
  SpecDoc,
  StorageEntry,
  StorageIndexEntry,
} from "@/types";

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.resolve(process.cwd(), "data");

export const PATHS = {
  reviewPoints: path.join(DATA_DIR, "masters", "review_points.json"),
  templates: path.join(DATA_DIR, "templates"),
  specs: path.join(DATA_DIR, "specs"),
  outputs: path.join(DATA_DIR, "outputs"),
  storageIndex: path.join(DATA_DIR, "storage", "index.json"),
  storageOriginals: path.join(DATA_DIR, "storage", "originals"),
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

// ─── Review Points ────────────────────────────────────────────────────────────

export async function getReviewPoints(): Promise<ReviewPointsData> {
  return readJson<ReviewPointsData>(PATHS.reviewPoints);
}

export async function saveReviewPoints(data: ReviewPointsData) {
  await writeJson(PATHS.reviewPoints, data);
}

// ─── Templates ───────────────────────────────────────────────────────────────

export async function listTemplates(): Promise<Template[]> {
  await ensureDir(PATHS.templates);
  const files = await fs.readdir(PATHS.templates);
  const templates: Template[] = [];
  for (const file of files) {
    if (file.endsWith(".json")) {
      try {
        const t = await readJson<Template>(path.join(PATHS.templates, file));
        templates.push(t);
      } catch {
        // skip malformed files
      }
    }
  }
  return templates.sort((a, b) =>
    (b.uploadedAt ?? "").localeCompare(a.uploadedAt ?? "")
  );
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

export async function deleteTemplate(id: string) {
  const filePath = path.join(PATHS.templates, `${id}_format.json`);
  await fs.unlink(filePath);
}

export async function setDefaultTemplate(id: string) {
  const templates = await listTemplates();
  for (const t of templates) {
    t.isDefault = t.id === id;
    await saveTemplate(t);
  }
}

// ─── Specs (legacy upload) ───────────────────────────────────────────────────

export async function listSpecs(keyword?: string): Promise<SpecDoc[]> {
  await ensureDir(PATHS.specs);
  const files = await fs.readdir(PATHS.specs);
  const specs: SpecDoc[] = [];
  for (const file of files) {
    if (file.endsWith("_spec.json")) {
      try {
        const s = await readJson<SpecDoc>(path.join(PATHS.specs, file));
        if (!keyword || s.title.includes(keyword) || s.content.includes(keyword)) {
          specs.push({ ...s, content: s.content.substring(0, 200) + "..." });
        }
      } catch {
        // skip
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

// ─── Storage (structured AI extraction) ──────────────────────────────────────

async function readStorageIndex(): Promise<StorageIndexEntry[]> {
  try {
    return await readJson<StorageIndexEntry[]>(PATHS.storageIndex);
  } catch {
    return [];
  }
}

async function writeStorageIndex(entries: StorageIndexEntry[]) {
  await writeJson(PATHS.storageIndex, entries);
}

export async function listStorageEntries(): Promise<StorageIndexEntry[]> {
  const entries = await readStorageIndex();
  return entries.sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );
}

export async function addStorageEntry(entry: StorageEntry) {
  const index = await readStorageIndex();
  const { sections: _s, keywords: _k, missingChecklist: _m, ...meta } = entry;
  index.unshift(meta);
  await writeStorageIndex(index);
  // save full extracted data
  const extractedPath = path.join(PATHS.specs, `${entry.id}_extracted.json`);
  await writeJson(extractedPath, entry);
}

export async function getStorageEntry(id: string): Promise<StorageEntry | null> {
  const extractedPath = path.join(PATHS.specs, `${id}_extracted.json`);
  try {
    return await readJson<StorageEntry>(extractedPath);
  } catch {
    return null;
  }
}

export async function deleteStorageEntry(id: string) {
  // remove from index
  const index = await readStorageIndex();
  const filtered = index.filter((e) => e.id !== id);
  await writeStorageIndex(filtered);

  // delete extracted JSON
  const extractedPath = path.join(PATHS.specs, `${id}_extracted.json`);
  await fs.unlink(extractedPath).catch(() => {});

  // delete original file (any extension)
  await ensureDir(PATHS.storageOriginals);
  const origFiles = await fs.readdir(PATHS.storageOriginals);
  for (const f of origFiles) {
    if (f.startsWith(id + ".")) {
      await fs.unlink(path.join(PATHS.storageOriginals, f)).catch(() => {});
    }
  }
}

export async function saveOriginalFile(
  id: string,
  buffer: Buffer,
  originalFileName: string
) {
  await ensureDir(PATHS.storageOriginals);
  const ext = originalFileName.split(".").pop() || "bin";
  const filePath = path.join(PATHS.storageOriginals, `${id}.${ext}`);
  await fs.writeFile(filePath, buffer);
}

export async function saveOutput(filename: string, buffer: Buffer) {
  await ensureDir(path.join(DATA_DIR, "outputs"));
  const filePath = path.join(DATA_DIR, "outputs", filename);
  await fs.writeFile(filePath, buffer);
  return filePath;
}
