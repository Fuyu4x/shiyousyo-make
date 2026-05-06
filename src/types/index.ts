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
  required: boolean;
  description: string;
}

export interface Template {
  id: string;
  name: string;
  sections: TemplateSection[];
}

export interface SpecDoc {
  id: string;
  title: string;
  category: "app" | "infra" | "common";
  uploadedAt: string;
  content: string;
}

export interface ReviewRequest {
  specText: string;
  selectedCategoryIds: string[];
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
