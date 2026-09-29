import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, qaSessions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      corpusId,
      title,
      topK = 4,
      similarityThreshold = 0.55,
      retrievalMode = "hybrid",
    } = body;

    if (!corpusId) {
      return NextResponse.json(
        { error: "corpusId is required" },
        { status: 400 }
      );
    }

    const allUsers = await db.select().from(users);
    const userId = allUsers[0]?.id ?? 1;

    const [created] = await db
      .insert(qaSessions)
      .values({
        corpusId: Number(corpusId),
        userId,
        title: title?.trim() || "New Research Q&A Thread",
        topK: Number(topK) || 4,
        similarityThreshold: Number(similarityThreshold) || 0.55,
        retrievalMode,
      })
      .returning();

    return NextResponse.json({
      session: {
        ...created,
        messages: [],
      },
    });
  } catch (error) {
    console.error("Sessions POST error:", error);
    return NextResponse.json(
      { error: "Failed to create Q&A session" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title } = body;
    if (!id || !title) {
      return NextResponse.json(
        { error: "Session ID and title are required" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(qaSessions)
      .set({ title: title.trim() })
      .where(eq(qaSessions.id, Number(id)))
      .returning();

    return NextResponse.json({ session: updated });
  } catch (error) {
    console.error("Sessions PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to rename Q&A session" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    await db.delete(qaSessions).where(eq(qaSessions.id, Number(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Sessions DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete Q&A session" },
      { status: 500 }
    );
  }
}
