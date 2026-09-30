import {
  pgTable,
  serial,
  text,
  integer,
  real,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

export interface CitationItem {
  citationNumber: number;
  chunkId: number;
  documentId: number;
  documentTitle: string;
  docType: string;
  sectionTitle: string;
  pageNumber: number;
  excerpt: string;
  similarityScore: number;
  cosineScore: number;
  keywordScore: number;
  matchedTerms: string[];
  embeddingPreview: number[];
}

export interface RagTelemetry {
  embedLatencyMs: number;
  retrievalLatencyMs: number;
  synthesisLatencyMs: number;
  totalChunksScanned: number;
  topKReturned: number;
  retrievalMode: string;
  similarityThreshold: number;
  modelUsed: string;
  queryVectorPreview: number[];
}

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  studentId: text("student_id").notNull(),
  major: text("major").notNull(),
  university: text("university").notNull(),
  avatarColor: text("avatar_color").notNull().default("#1E3A8A"),
  role: text("role").notNull().default("student"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const corpora = pgTable("corpora", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  title: text("title").notNull(),
  professor: text("professor").notNull(),
  semester: text("semester").notNull(),
  description: text("description").notNull(),
  embeddingModel: text("embedding_model")
    .notNull()
    .default("text-embedding-3-scholar-384d"),
  chunkSize: integer("chunk_size").notNull().default(480),
  chunkOverlap: integer("chunk_overlap").notNull().default(80),
  accentColor: text("accent_color").notNull().default("#1E3A8A"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  corpusId: integer("corpus_id")
    .notNull()
    .references(() => corpora.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  docType: text("doc_type").notNull().default("Lecture Notes"),
  author: text("author").notNull().default("Course Faculty"),
  sourceRef: text("source_ref").notNull().default("Pages 1–12"),
  content: text("content").notNull(),
  status: text("status").notNull().default("indexed"),
  wordCount: integer("word_count").notNull().default(0),
  chunkCount: integer("chunk_count").notNull().default(0),
  embeddingDimensions: integer("embedding_dimensions").notNull().default(64),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const documentChunks = pgTable("document_chunks", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  corpusId: integer("corpus_id")
    .notNull()
    .references(() => corpora.id, { onDelete: "cascade" }),
  chunkIndex: integer("chunk_index").notNull(),
  sectionTitle: text("section_title").notNull(),
  pageNumber: integer("page_number").notNull().default(1),
  content: text("content").notNull(),
  tokenCount: integer("token_count").notNull(),
  keywords: jsonb("keywords").$type<string[]>().notNull().default([]),
  embedding: jsonb("embedding").$type<number[]>().notNull(),
  vectorNorm: real("vector_norm").notNull().default(1.0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const qaSessions = pgTable("qa_sessions", {
  id: serial("id").primaryKey(),
  corpusId: integer("corpus_id")
    .notNull()
    .references(() => corpora.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  topK: integer("top_k").notNull().default(4),
  similarityThreshold: real("similarity_threshold").notNull().default(0.58),
  retrievalMode: text("retrieval_mode").notNull().default("hybrid"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const qaMessages = pgTable("qa_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id")
    .notNull()
    .references(() => qaSessions.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // "user" | "assistant"
  content: text("content").notNull(),
  citations: jsonb("citations").$type<CitationItem[]>().notNull().default([]),
  telemetry: jsonb("telemetry").$type<RagTelemetry | null>().default(null),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const savedNotes = pgTable("saved_notes", {
  id: serial("id").primaryKey(),
  corpusId: integer("corpus_id")
    .notNull()
    .references(() => corpora.id, { onDelete: "cascade" }),
  chunkId: integer("chunk_id"),
  documentTitle: text("document_title").notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  citationRef: text("citation_ref").notNull(),
  masteryStatus: text("mastery_status").notNull().default("reviewing"), // "reviewing" | "mastered" | "flagged"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
