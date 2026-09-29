import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { documents, documentChunks } from "@/db/schema";
import {
  computeSemanticEmbedding,
  extractKeywords,
} from "@/lib/rag-engine";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { documentId, corpusId, sectionTitle, pageNumber, content } = body;

    if (!documentId || !corpusId || !content) {
      return NextResponse.json(
        { error: "documentId, corpusId, and content are required." },
        { status: 400 }
      );
    }

    const existingChunks = await db
      .select()
      .from(documentChunks)
      .where(eq(documentChunks.documentId, Number(documentId)));

    const cleanText = content.trim();
    const section = sectionTitle?.trim() || `§Custom Vector Segment #${existingChunks.length + 1}`;
    const words = cleanText.split(/\s+/).length;
    const tokenCount = Math.max(10, Math.round(words * 1.32));
    const keywords = extractKeywords(`${section} ${cleanText}`, 6);
    const { embedding, norm } = computeSemanticEmbedding(`${section} ${cleanText}`);

    const [createdChunk] = await db
      .insert(documentChunks)
      .values({
        documentId: Number(documentId),
        corpusId: Number(corpusId),
        chunkIndex: existingChunks.length,
        sectionTitle: section,
        pageNumber: Number(pageNumber) || 1,
        content: cleanText,
        tokenCount,
        keywords,
        embedding,
        vectorNorm: norm,
      })
      .returning();

    await db
      .update(documents)
      .set({ chunkCount: existingChunks.length + 1 })
      .where(eq(documents.id, Number(documentId)));

    return NextResponse.json({ chunk: createdChunk });
  } catch (error) {
    console.error("Chunks POST error:", error);
    return NextResponse.json(
      { error: "Failed to create and embed chunk" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, sectionTitle, pageNumber, content } = body;

    if (!id || !content) {
      return NextResponse.json(
        { error: "Chunk ID and content are required" },
        { status: 400 }
      );
    }

    const cleanText = content.trim();
    const section = sectionTitle?.trim() || "§Updated Section";
    const words = cleanText.split(/\s+/).length;
    const tokenCount = Math.max(10, Math.round(words * 1.32));
    const keywords = extractKeywords(`${section} ${cleanText}`, 6);
    const { embedding, norm } = computeSemanticEmbedding(`${section} ${cleanText}`);

    const [updatedChunk] = await db
      .update(documentChunks)
      .set({
        sectionTitle: section,
        ...(pageNumber ? { pageNumber: Number(pageNumber) } : {}),
        content: cleanText,
        tokenCount,
        keywords,
        embedding,
        vectorNorm: norm,
      })
      .where(eq(documentChunks.id, Number(id)))
      .returning();

    return NextResponse.json({ chunk: updatedChunk });
  } catch (error) {
    console.error("Chunks PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update and re-embed chunk" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Chunk ID is required" },
        { status: 400 }
      );
    }

    const found = await db
      .select()
      .from(documentChunks)
      .where(eq(documentChunks.id, Number(id)));

    await db.delete(documentChunks).where(eq(documentChunks.id, Number(id)));

    if (found[0]) {
      const remaining = await db
        .select()
        .from(documentChunks)
        .where(eq(documentChunks.documentId, found[0].documentId));

      await db
        .update(documents)
        .set({ chunkCount: remaining.length })
        .where(eq(documents.id, found[0].documentId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Chunks DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete vector chunk" },
      { status: 500 }
    );
  }
}
