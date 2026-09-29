import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { corpora, documents, documentChunks } from "@/db/schema";
import { chunkDocumentContent } from "@/lib/rag-engine";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      corpusId,
      title,
      docType,
      author,
      sourceRef,
      content,
      customChunkSize,
      customChunkOverlap,
    } = body;

    if (!corpusId || !title || !content) {
      return NextResponse.json(
        { error: "corpusId, title, and document content are required." },
        { status: 400 }
      );
    }

    const parentCorpora = await db
      .select()
      .from(corpora)
      .where(eq(corpora.id, Number(corpusId)));

    const cSize =
      Number(customChunkSize) || parentCorpora[0]?.chunkSize || 480;
    const cOverlap =
      customChunkOverlap !== undefined
        ? Number(customChunkOverlap)
        : parentCorpora[0]?.chunkOverlap ?? 75;

    const cleanContent = content.trim();
    const words = cleanContent.split(/\s+/).length;
    const segments = chunkDocumentContent(cleanContent, cSize, cOverlap);

    const [createdDoc] = await db
      .insert(documents)
      .values({
        corpusId: Number(corpusId),
        title: title.trim(),
        docType: docType || "Lecture Notes",
        author: author?.trim() || parentCorpora[0]?.professor || "Course Faculty",
        sourceRef: sourceRef?.trim() || "Uploaded Study Material",
        content: cleanContent,
        status: "indexed",
        wordCount: words,
        chunkCount: segments.length,
        embeddingDimensions: 64,
      })
      .returning();

    const insertedChunks = [];
    for (const seg of segments) {
      const [ch] = await db
        .insert(documentChunks)
        .values({
          documentId: createdDoc.id,
          corpusId: Number(corpusId),
          chunkIndex: seg.chunkIndex,
          sectionTitle: seg.sectionTitle,
          pageNumber: seg.pageNumber,
          content: seg.content,
          tokenCount: seg.tokenCount,
          keywords: seg.keywords,
          embedding: seg.embedding,
          vectorNorm: seg.vectorNorm,
        })
        .returning();
      insertedChunks.push(ch);
    }

    return NextResponse.json({
      document: createdDoc,
      chunksCreated: insertedChunks.length,
    });
  } catch (error) {
    console.error("Documents POST error:", error);
    return NextResponse.json(
      { error: "Failed to index and embed document" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      title,
      docType,
      author,
      sourceRef,
      content,
      customChunkSize,
      customChunkOverlap,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    const existingDocs = await db
      .select()
      .from(documents)
      .where(eq(documents.id, Number(id)));

    if (existingDocs.length === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const existingDoc = existingDocs[0];
    const newContent =
      content !== undefined ? content.trim() : existingDoc.content;
    const words = newContent.split(/\s+/).length;

    const cSize = Number(customChunkSize) || 480;
    const cOverlap =
      customChunkOverlap !== undefined ? Number(customChunkOverlap) : 75;

    const segments = chunkDocumentContent(newContent, cSize, cOverlap);

    const [updatedDoc] = await db
      .update(documents)
      .set({
        title: title ? title.trim() : existingDoc.title,
        docType: docType || existingDoc.docType,
        author: author ? author.trim() : existingDoc.author,
        sourceRef: sourceRef ? sourceRef.trim() : existingDoc.sourceRef,
        content: newContent,
        wordCount: words,
        chunkCount: segments.length,
        status: "indexed",
        updatedAt: new Date(),
      })
      .where(eq(documents.id, Number(id)))
      .returning();

    // Re-index chunks: remove old chunks and insert freshly embedded chunks
    await db
      .delete(documentChunks)
      .where(eq(documentChunks.documentId, Number(id)));

    for (const seg of segments) {
      await db.insert(documentChunks).values({
        documentId: updatedDoc.id,
        corpusId: updatedDoc.corpusId,
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

    return NextResponse.json({
      document: updatedDoc,
      reindexedChunks: segments.length,
    });
  } catch (error) {
    console.error("Documents PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update and re-index document" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    await db.delete(documents).where(eq(documents.id, Number(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Documents DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
