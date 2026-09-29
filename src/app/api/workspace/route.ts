import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  users,
  corpora,
  documents,
  documentChunks,
  qaSessions,
  qaMessages,
  savedNotes,
} from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
import { asc, desc, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    await ensureSeeded();

    const corpusIdParam = req.nextUrl.searchParams.get("corpusId");
    const allUsers = await db.select().from(users);
    const currentUser = allUsers[0] || null;

    const allCorpora = await db
      .select()
      .from(corpora)
      .orderBy(asc(corpora.id));

    const allDocuments = await db
      .select()
      .from(documents)
      .orderBy(asc(documents.id));

    const allChunks = await db
      .select()
      .from(documentChunks)
      .orderBy(asc(documentChunks.documentId), asc(documentChunks.chunkIndex));

    const allSessions = await db
      .select()
      .from(qaSessions)
      .orderBy(desc(qaSessions.createdAt));

    const corporaWithMetrics = allCorpora.map((c) => {
      const cDocs = allDocuments.filter((d) => d.corpusId === c.id);
      const cChunks = allChunks.filter((ch) => ch.corpusId === c.id);
      const cSessions = allSessions.filter((s) => s.corpusId === c.id);
      const totalTokens = cChunks.reduce((acc, ch) => acc + ch.tokenCount, 0);
      return {
        ...c,
        documentCount: cDocs.length,
        chunkCount: cChunks.length,
        sessionCount: cSessions.length,
        totalTokens,
      };
    });

    const activeCorpusId = corpusIdParam
      ? Number(corpusIdParam)
      : corporaWithMetrics[0]?.id ?? null;

    const activeCorpus =
      corporaWithMetrics.find((c) => c.id === activeCorpusId) ||
      corporaWithMetrics[0] ||
      null;

    if (!activeCorpus) {
      return NextResponse.json({
        user: currentUser,
        corpora: [],
        activeCorpus: null,
        documents: [],
        chunks: [],
        sessions: [],
        notes: [],
      });
    }

    const corpusDocs = allDocuments.filter(
      (d) => d.corpusId === activeCorpus.id
    );
    const docMap = new Map(corpusDocs.map((d) => [d.id, d]));

    const corpusChunks = allChunks
      .filter((ch) => ch.corpusId === activeCorpus.id)
      .map((ch) => {
        const parentDoc = docMap.get(ch.documentId);
        return {
          ...ch,
          documentTitle: parentDoc?.title || "Course Document",
          docType: parentDoc?.docType || "Lecture Notes",
        };
      });

    const corpusSessions = allSessions.filter(
      (s) => s.corpusId === activeCorpus.id
    );

    const allMessages = await db
      .select()
      .from(qaMessages)
      .orderBy(asc(qaMessages.id));

    const sessionsWithMessages = corpusSessions.map((s) => ({
      ...s,
      messages: allMessages.filter((m) => m.sessionId === s.id),
    }));

    const corpusNotes = await db
      .select()
      .from(savedNotes)
      .where(eq(savedNotes.corpusId, activeCorpus.id))
      .orderBy(desc(savedNotes.id));

    return NextResponse.json({
      user: currentUser
        ? {
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            studentId: currentUser.studentId,
            major: currentUser.major,
            university: currentUser.university,
            avatarColor: currentUser.avatarColor,
          }
        : null,
      corpora: corporaWithMetrics,
      activeCorpus,
      documents: corpusDocs,
      chunks: corpusChunks,
      sessions: sessionsWithMessages,
      notes: corpusNotes,
    });
  } catch (error) {
    console.error("Workspace GET error:", error);
    return NextResponse.json(
      { error: "Failed to load RAG workspace data" },
      { status: 500 }
    );
  }
}
