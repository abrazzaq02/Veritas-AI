import type { CitationItem, RagTelemetry } from "@/db/schema";

export type { CitationItem, RagTelemetry };

export interface StudentUser {
  id: number;
  name: string;
  email: string;
  studentId: string;
  major: string;
  university: string;
  avatarColor: string;
  role: "student" | "faculty" | "admin";
}

export interface CorpusSummary {
  id: number;
  userId: number;
  code: string;
  title: string;
  professor: string;
  semester: string;
  description: string;
  embeddingModel: string;
  chunkSize: number;
  chunkOverlap: number;
  accentColor: string;
  documentCount: number;
  chunkCount: number;
  sessionCount: number;
  totalTokens: number;
}

export interface CourseDocument {
  id: number;
  corpusId: number;
  title: string;
  docType: string;
  author: string;
  sourceRef: string;
  content: string;
  status: string;
  wordCount: number;
  chunkCount: number;
  embeddingDimensions: number;
  createdAt: string;
  updatedAt: string;
}

export interface VectorChunk {
  id: number;
  documentId: number;
  corpusId: number;
  documentTitle: string;
  docType: string;
  chunkIndex: number;
  sectionTitle: string;
  pageNumber: number;
  content: string;
  tokenCount: number;
  keywords: string[];
  embedding: number[];
  vectorNorm: number;
  similarityScore?: number;
  cosineScore?: number;
  keywordScore?: number;
  matchedTerms?: string[];
}

export interface QaMessageItem {
  id: number;
  sessionId: number;
  role: "user" | "assistant" | string;
  content: string;
  citations: CitationItem[];
  telemetry: RagTelemetry | null;
  createdAt: string;
}

export interface QaSessionItem {
  id: number;
  corpusId: number;
  userId: number;
  title: string;
  topK: number;
  similarityThreshold: number;
  retrievalMode: string;
  createdAt: string;
  messages: QaMessageItem[];
}

export interface SavedNoteItem {
  id: number;
  corpusId: number;
  chunkId: number | null;
  documentTitle: string;
  question: string;
  answer: string;
  citationRef: string;
  masteryStatus: "reviewing" | "mastered" | "flagged" | string;
  createdAt: string;
}
