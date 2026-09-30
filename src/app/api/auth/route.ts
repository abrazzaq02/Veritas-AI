import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    await ensureSeeded();
    const emailParam = req.nextUrl.searchParams.get("email");
    const allUsers = await db.select().from(users);

    const activeUser = emailParam
      ? allUsers.find((u) => u.email.toLowerCase() === emailParam.toLowerCase()) ||
        allUsers[0]
      : allUsers[0];

    return NextResponse.json({
      user: activeUser
        ? {
            id: activeUser.id,
            name: activeUser.name,
            email: activeUser.email,
            studentId: activeUser.studentId,
            major: activeUser.major,
            university: activeUser.university,
            avatarColor: activeUser.avatarColor,
            role: (activeUser.role as "student" | "faculty" | "admin") || "student",
          }
        : null,
      availableAccounts: allUsers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        studentId: u.studentId,
        major: u.major,
        university: u.university,
        avatarColor: u.avatarColor,
        role: (u.role as "student" | "faculty" | "admin") || "student",
      })),
    });
  } catch (error) {
    console.error("Auth GET error:", error);
    return NextResponse.json(
      { error: "Failed to load student session" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureSeeded();
    const body = await req.json();
    const {
      action,
      email,
      password,
      name,
      major,
      university,
      role,
      newPassword,
    } = body;

    if (action === "register") {
      if (!email || !name) {
        return NextResponse.json(
          { error: "Name and academic email are required." },
          { status: 400 }
        );
      }

      const cleanEmail = email.trim().toLowerCase();
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, cleanEmail));

      if (existing.length > 0) {
        return NextResponse.json(
          { error: "An account with this email already exists." },
          { status: 400 }
        );
      }

      const allowedRoles = ["student", "faculty", "admin"] as const;
      const safeRole = allowedRoles.includes(role) ? role : "student";
      const randomId = Math.floor(1000 + Math.random() * 9000);
      const [newUser] = await db
        .insert(users)
        .values({
          name: name.trim(),
          email: cleanEmail,
          passwordHash: password || "scholar2026",
          studentId:
            safeRole === "faculty"
              ? `FAC-2026-${randomId}`
              : safeRole === "admin"
                ? `ADM-2026-${randomId}`
                : `STU-2026-${randomId}`,
          major: major?.trim() || "Interdisciplinary Research",
          university:
            university?.trim() || "Columbia Archival Research Institute",
          avatarColor: safeRole === "admin" ? "#7C3AED" : "#059669",
          role: safeRole,
        })
        .returning();

      return NextResponse.json({
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          studentId: newUser.studentId,
          major: newUser.major,
          university: newUser.university,
          avatarColor: newUser.avatarColor,
          role: (newUser.role as "student" | "faculty" | "admin") || "student",
        },
      });
    }

    if (action === "reset") {
      const cleanEmail = (email || "").trim().toLowerCase();
      const nextPassword = (newPassword || password || "").trim();

      if (!cleanEmail || !nextPassword) {
        return NextResponse.json(
          { error: "Email and a new password are required." },
          { status: 400 }
        );
      }

      const found = await db
        .select()
        .from(users)
        .where(eq(users.email, cleanEmail));

      if (found.length === 0) {
        return NextResponse.json(
          { error: "No scholar account found for that email address." },
          { status: 404 }
        );
      }

      const [updated] = await db
        .update(users)
        .set({ passwordHash: nextPassword })
        .where(eq(users.email, cleanEmail))
        .returning();

      return NextResponse.json({
        user: {
          id: updated.id,
          name: updated.name,
          email: updated.email,
          studentId: updated.studentId,
          major: updated.major,
          university: updated.university,
          avatarColor: updated.avatarColor,
          role: (updated.role as "student" | "faculty" | "admin") || "student",
        },
      });
    }

    // Login action
    const found = await db
      .select()
      .from(users)
      .where(eq(users.email, (email || "").trim().toLowerCase()));

    if (found.length === 0) {
      return NextResponse.json(
        { error: "No scholar account found for that email address." },
        { status: 401 }
      );
    }

    const user = found[0];
    if (password && user.passwordHash !== password && password !== "scholar2026") {
      return NextResponse.json(
        { error: "Invalid credentials. (Hint: demo password is 'scholar2026')" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        major: user.major,
        university: user.university,
        avatarColor: user.avatarColor,
        role: (user.role as "student" | "faculty" | "admin") || "student",
      },
    });
  } catch (error) {
    console.error("Auth POST error:", error);
    return NextResponse.json(
      { error: "Authentication request failed" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, major, university, studentId } = body;
    if (!id) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const [updated] = await db
      .update(users)
      .set({
        ...(name ? { name: name.trim() } : {}),
        ...(major ? { major: major.trim() } : {}),
        ...(university ? { university: university.trim() } : {}),
        ...(studentId ? { studentId: studentId.trim() } : {}),
      })
      .where(eq(users.id, Number(id)))
      .returning();

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("Auth PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update student profile" },
      { status: 500 }
    );
  }
}
