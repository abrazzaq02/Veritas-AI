import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { savedNotes } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      corpusId,
      chunkId,
      documentTitle,
      question,
      answer,
      citationRef,
      masteryStatus,
    } = body;

    if (!corpusId || !question || !answer) {
      return NextResponse.json(
        { error: "corpusId, question, and answer are required." },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(savedNotes)
      .values({
        corpusId: Number(corpusId),
        chunkId: chunkId ? Number(chunkId) : null,
        documentTitle: documentTitle || "Course Corpus Citation",
        question: question.trim(),
        answer: answer.trim(),
        citationRef: citationRef || "Retrieved Vector Passage",
        masteryStatus: masteryStatus || "reviewing",
      })
      .returning();

    return NextResponse.json({ note: created });
  } catch (error) {
    console.error("Notes POST error:", error);
    return NextResponse.json(
      { error: "Failed to save study note" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, question, answer, masteryStatus, citationRef } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Note ID is required" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(savedNotes)
      .set({
        ...(question ? { question: question.trim() } : {}),
        ...(answer ? { answer: answer.trim() } : {}),
        ...(masteryStatus ? { masteryStatus } : {}),
        ...(citationRef ? { citationRef: citationRef.trim() } : {}),
      })
      .where(eq(savedNotes.id, Number(id)))
      .returning();

    return NextResponse.json({ note: updated });
  } catch (error) {
    console.error("Notes PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update study note" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Note ID is required" },
        { status: 400 }
      );
    }

    await db.delete(savedNotes).where(eq(savedNotes.id, Number(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notes DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete study note" },
      { status: 500 }
    );
  }
}
