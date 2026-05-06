export interface ReviewPoint {
  id: string;
  title: string;
  description: string;
}

export interface ReviewCategory {
  id: string;
  name: string;
  points: ReviewPoint[];
}

export interface ReviewPointsData {
  categories: ReviewCategory[];
}

export interface TemplateSection {
  id: string;
  title: string;
  level?: number;
  required: boolean;
  description: string;
  order?: number;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  uploadedAt?: string;
  sections: TemplateSection[];
}

export interface SpecDoc {
  id: string;
  title: string;
  category: "app" | "infra" | "common";
  uploadedAt: string;
  content: string;
}

// Storage feature types
export interface StorageIndexEntry {
  id: string;
  title: string;
  category: "app" | "infra" | "common" | "other";
  uploadedAt: string;
  originalFileName: string;
  summary: string;
  qualityScore: number;
  phase: "mvp" | "production" | "unknown";
}

export interface StorageEntry extends StorageIndexEntry {
  sections: {
    title: string;
    level: number;
    keyPoints: string[];
  }[];
  keywords: string[];
  missingChecklist: string[];
}

export interface ReviewRequest {
  specText: string;
  selectedCategoryIds: string[];
  referenceSpecIds?: string[];
  compareSpecId?: string;
}

export interface InterviewMessage {
  role: "user" | "assistant";
  content: string;
}

export interface GenerateSpecRequest {
  templateId: string;
  interviewHistory: InterviewMessage[];
}

export interface RevisionRequest {
  specId: string;
  interviewHistory: InterviewMessage[];
}
