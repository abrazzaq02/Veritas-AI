import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  users,
  corpora,
  documents,
  documentChunks,
  qaSessions,
  qaMessages,
} from "@/db/schema";
import {
  retrieveTopChunks,
  synthesizeRagAnswer,
  type ChunkCandidate,
} from "@/lib/rag-engine";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      corpusId,
      sessionId,
      documentId,
      query,
      topK = 4,
      similarityThreshold = 0.55,
      retrievalMode = "hybrid",
      mode = "qa", // "qa" | "search_only"
    } = body;

    if (!corpusId || !query || !query.trim()) {
      return NextResponse.json(
        { error: "corpusId and query are required." },
        { status: 400 }
      );
    }

    const foundCorpora = await db
      .select()
      .from(corpora)
      .where(eq(corpora.id, Number(corpusId)));

    const activeCorpus = foundCorpora[0];
    if (!activeCorpus) {
      return NextResponse.json({ error: "Corpus not found" }, { status: 404 });
    }

    const corpusDocs = await db
      .select()
      .from(documents)
      .where(eq(documents.corpusId, Number(corpusId)));

    const docMap = new Map(corpusDocs.map((d) => [d.id, d]));

    let rawChunks = await db
      .select()
      .from(documentChunks)
      .where(eq(documentChunks.corpusId, Number(corpusId)));

    if (documentId && Number(documentId) > 0) {
      rawChunks = rawChunks.filter(
        (ch) => ch.documentId === Number(documentId)
      );
    }

    const candidates: ChunkCandidate[] = rawChunks.map((ch) => {
      const parentDoc = docMap.get(ch.documentId);
      return {
        id: ch.id,
        documentId: ch.documentId,
        documentTitle: parentDoc?.title || "Course Document",
        docType: parentDoc?.docType || "Lecture Notes",
        chunkIndex: ch.chunkIndex,
        sectionTitle: ch.sectionTitle,
        pageNumber: ch.pageNumber,
        content: ch.content,
        tokenCount: ch.tokenCount,
        keywords: ch.keywords || [],
        embedding: ch.embedding || [],
      };
    });

    const retrieval = retrieveTopChunks(query.trim(), candidates, {
      topK: Number(topK) || 4,
      similarityThreshold: Number(similarityThreshold) || 0.52,
      retrievalMode,
    });

    if (mode === "search_only") {
      return NextResponse.json({
        results: retrieval.results,
        queryEmbedding: retrieval.queryEmbedding,
        embedLatencyMs: retrieval.embedLatencyMs,
        retrievalLatencyMs: retrieval.retrievalLatencyMs,
        totalChunksScanned: candidates.length,
      });
    }

    // Full RAG Synthesis + Session Persistence
    const synthesis = await synthesizeRagAnswer(
      query.trim(),
      retrieval.results,
      {
        code: activeCorpus.code,
        title: activeCorpus.title,
        retrievalMode,
        similarityThreshold: Number(similarityThreshold) || 0.55,
      }
    );

    const finalTelemetry = {
      ...synthesis.telemetry,
      embedLatencyMs: retrieval.embedLatencyMs,
      retrievalLatencyMs: retrieval.retrievalLatencyMs,
      totalChunksScanned: candidates.length,
    };

    let targetSessionId = sessionId ? Number(sessionId) : null;

    if (!targetSessionId) {
      const allUsers = await db.select().from(users);
      const userId = allUsers[0]?.id ?? 1;
      const shortTitle =
        query.trim().length > 52
          ? `${query.trim().slice(0, 52)}...`
          : query.trim();

      const [newSession] = await db
        .insert(qaSessions)
        .values({
          corpusId: Number(corpusId),
          userId,
          title: shortTitle,
          topK: Number(topK) || 4,
          similarityThreshold: Number(similarityThreshold) || 0.55,
          retrievalMode,
        })
        .returning();

      targetSessionId = newSession.id;
    } else {
      await db
        .update(qaSessions)
        .set({
          topK: Number(topK) || 4,
          similarityThreshold: Number(similarityThreshold) || 0.55,
          retrievalMode,
        })
        .where(eq(qaSessions.id, targetSessionId));
    }

    const [userMsg] = await db
      .insert(qaMessages)
      .values({
        sessionId: targetSessionId,
        role: "user",
        content: query.trim(),
        citations: [],
        telemetry: null,
      })
      .returning();

    const [assistantMsg] = await db
      .insert(qaMessages)
      .values({
        sessionId: targetSessionId,
        role: "assistant",
        content: synthesis.answer,
        citations: synthesis.citations,
        telemetry: finalTelemetry,
      })
      .returning();

    return NextResponse.json({
      sessionId: targetSessionId,
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      retrievedChunks: retrieval.results,
      telemetry: finalTelemetry,
    });
  } catch (error) {
    console.error("RAG Query POST error:", error);
    return NextResponse.json(
      { error: "Failed to execute RAG retrieval and synthesis" },
      { status: 500 }
    );
  }
}
