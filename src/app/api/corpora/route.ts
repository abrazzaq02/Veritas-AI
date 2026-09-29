import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, corpora, documents, documentChunks } from "@/db/schema";
import { chunkDocumentContent } from "@/lib/rag-engine";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      code,
      title,
      professor,
      semester,
      description,
      chunkSize,
      chunkOverlap,
      accentColor,
      starterContent,
    } = body;

    if (!code || !title) {
      return NextResponse.json(
        { error: "Course code and title are required." },
        { status: 400 }
      );
    }

    const allUsers = await db.select().from(users);
    const userId = allUsers[0]?.id ?? 1;

    const cSize = Number(chunkSize) || 480;
    const cOverlap = Number(chunkOverlap) || 75;

    const [created] = await db
      .insert(corpora)
      .values({
        userId,
        code: code.trim().toUpperCase(),
        title: title.trim(),
        professor: professor?.trim() || "Course Faculty",
        semester: semester?.trim() || "Spring 2026",
        description:
          description?.trim() ||
          `Semantic vector archive and RAG study workspace for ${code.trim().toUpperCase()}: ${title.trim()}.`,
        embeddingModel: "text-embedding-3-scholar-64d",
        chunkSize: cSize,
        chunkOverlap: cOverlap,
        accentColor: accentColor || "#1E3A8A",
      })
      .returning();

    // If starterContent is provided, index an initial document right away
    if (starterContent && starterContent.trim().length > 20) {
      const text = starterContent.trim();
      const words = text.split(/\s+/).length;
      const segments = chunkDocumentContent(text, cSize, cOverlap);

      const [doc] = await db
        .insert(documents)
        .values({
          corpusId: created.id,
          title: `${created.code} Course Overview & Study Guide.md`,
          docType: "Syllabus & Exam Guide",
          author: created.professor,
          sourceRef: "Module 1 • Overview",
          content: text,
          status: "indexed",
          wordCount: words,
          chunkCount: segments.length,
          embeddingDimensions: 64,
        })
        .returning();

      for (const seg of segments) {
        await db.insert(documentChunks).values({
          documentId: doc.id,
          corpusId: created.id,
          chunkIndex: seg.chunkIndex,
          sectionTitle: seg.sectionTitle,
          pageNumber: seg.pageNumber,
          content: seg.content,
          tokenCount: seg.tokenCount,
          keywords: seg.keywords,
          embedding: seg.embedding,
          vectorNorm: seg.vectorNorm,
        });
      }
    }

    return NextResponse.json({ corpus: created });
  } catch (error) {
    console.error("Corpora POST error:", error);
    return NextResponse.json(
      { error: "Failed to create course corpus" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      code,
      title,
      professor,
      semester,
      description,
      chunkSize,
      chunkOverlap,
      accentColor,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Corpus ID is required" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(corpora)
      .set({
        ...(code ? { code: code.trim().toUpperCase() } : {}),
        ...(title ? { title: title.trim() } : {}),
        ...(professor ? { professor: professor.trim() } : {}),
        ...(semester ? { semester: semester.trim() } : {}),
        ...(description !== undefined ? { description: description.trim() } : {}),
        ...(chunkSize ? { chunkSize: Number(chunkSize) } : {}),
        ...(chunkOverlap !== undefined ? { chunkOverlap: Number(chunkOverlap) } : {}),
        ...(accentColor ? { accentColor } : {}),
      })
      .where(eq(corpora.id, Number(id)))
      .returning();

    return NextResponse.json({ corpus: updated });
  } catch (error) {
    console.error("Corpora PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update course corpus" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Corpus ID is required" },
        { status: 400 }
      );
    }

    await db.delete(corpora).where(eq(corpora.id, Number(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Corpora DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete course corpus" },
      { status: 500 }
    );
  }
}
