CREATE TABLE "corpora" (
	"id" serial PRIMARY KEY,
	"user_id" integer NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"professor" text NOT NULL,
	"semester" text NOT NULL,
	"description" text NOT NULL,
	"embedding_model" text DEFAULT 'text-embedding-3-scholar-384d' NOT NULL,
	"chunk_size" integer DEFAULT 480 NOT NULL,
	"chunk_overlap" integer DEFAULT 80 NOT NULL,
	"accent_color" text DEFAULT '#1E3A8A' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_chunks" (
	"id" serial PRIMARY KEY,
	"document_id" integer NOT NULL,
	"corpus_id" integer NOT NULL,
	"chunk_index" integer NOT NULL,
	"section_title" text NOT NULL,
	"page_number" integer DEFAULT 1 NOT NULL,
	"content" text NOT NULL,
	"token_count" integer NOT NULL,
	"keywords" jsonb DEFAULT '[]' NOT NULL,
	"embedding" jsonb NOT NULL,
	"vector_norm" real DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY,
	"corpus_id" integer NOT NULL,
	"title" text NOT NULL,
	"doc_type" text DEFAULT 'Lecture Notes' NOT NULL,
	"author" text DEFAULT 'Course Faculty' NOT NULL,
	"source_ref" text DEFAULT 'Pages 1–12' NOT NULL,
	"content" text NOT NULL,
	"status" text DEFAULT 'indexed' NOT NULL,
	"word_count" integer DEFAULT 0 NOT NULL,
	"chunk_count" integer DEFAULT 0 NOT NULL,
	"embedding_dimensions" integer DEFAULT 64 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qa_messages" (
	"id" serial PRIMARY KEY,
	"session_id" integer NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"citations" jsonb DEFAULT '[]' NOT NULL,
	"telemetry" jsonb DEFAULT 'null',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qa_sessions" (
	"id" serial PRIMARY KEY,
	"corpus_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"top_k" integer DEFAULT 4 NOT NULL,
	"similarity_threshold" real DEFAULT 0.58 NOT NULL,
	"retrieval_mode" text DEFAULT 'hybrid' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_notes" (
	"id" serial PRIMARY KEY,
	"corpus_id" integer NOT NULL,
	"chunk_id" integer,
	"document_title" text NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"citation_ref" text NOT NULL,
	"mastery_status" text DEFAULT 'reviewing' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"password_hash" text NOT NULL,
	"student_id" text NOT NULL,
	"major" text NOT NULL,
	"university" text NOT NULL,
	"avatar_color" text DEFAULT '#1E3A8A' NOT NULL,
	"role" text DEFAULT 'student' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "corpora" ADD CONSTRAINT "corpora_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_document_id_documents_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_corpus_id_corpora_id_fkey" FOREIGN KEY ("corpus_id") REFERENCES "corpora"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_corpus_id_corpora_id_fkey" FOREIGN KEY ("corpus_id") REFERENCES "corpora"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "qa_messages" ADD CONSTRAINT "qa_messages_session_id_qa_sessions_id_fkey" FOREIGN KEY ("session_id") REFERENCES "qa_sessions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "qa_sessions" ADD CONSTRAINT "qa_sessions_corpus_id_corpora_id_fkey" FOREIGN KEY ("corpus_id") REFERENCES "corpora"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "qa_sessions" ADD CONSTRAINT "qa_sessions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "saved_notes" ADD CONSTRAINT "saved_notes_corpus_id_corpora_id_fkey" FOREIGN KEY ("corpus_id") REFERENCES "corpora"("id") ON DELETE CASCADE;