/**
 * GET  /api/progress/lesson          → tất cả lesson progress của user
 * POST /api/progress/lesson          → upsert 1 lesson progress
 *      body: { lessonId, completed, score }
 */
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });

  const rows = await prisma.lessonProgress.findMany({
    where: { userId },
    select: { lessonId: true, completed: true, score: true, completedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ lessons: rows });
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });

  try {
    const body = await req.json() as {
      lessonId: string;
      completed: boolean;
      score?: number;
    };

    if (!body.lessonId) return NextResponse.json({ error: "Thiếu lessonId." }, { status: 400 });

    // Lấy record hiện tại để giữ score tốt hơn và không rút lại completed
    const existing = await prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId: body.lessonId } },
    });

    const row = await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId: body.lessonId } },
      create: {
        userId,
        lessonId: body.lessonId,
        completed: body.completed,
        score: body.score,
        completedAt: body.completed ? new Date() : null,
      },
      update: {
        // Không rút lại "completed" nếu đã hoàn thành trước đó
        completed: body.completed || (existing?.completed ?? false),
        // Chỉ cập nhật score nếu tốt hơn điểm cũ
        ...(body.score !== undefined && {
          score: Math.max(body.score, existing?.score ?? 0),
        }),
        // Chỉ set completedAt lần đầu hoàn thành
        ...(body.completed && !existing?.completed && { completedAt: new Date() }),
      },
      select: { lessonId: true, completed: true, score: true, completedAt: true },
    });

    return NextResponse.json({ lesson: row });
  } catch (err) {
    console.error("[lesson progress POST]", err);
    return NextResponse.json({ error: "Lỗi server." }, { status: 500 });
  }
}
