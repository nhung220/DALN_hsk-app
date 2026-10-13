/**
 * GET  /api/progress/grammar              → lấy grammar progress của user
 * POST /api/progress/grammar
 *      body: { pointId, mode, score, total }
 *      → upsert, giữ bestScore cao nhất
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

  const rows = await prisma.grammarProgress.findMany({
    where: { userId },
    select: { pointId: true, mode: true, bestScore: true, attempts: true, lastAttemptAt: true },
    orderBy: { lastAttemptAt: "desc" },
  });

  return NextResponse.json({ progress: rows });
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });

  try {
    const body = await req.json() as {
      pointId: string;
      mode: "fill" | "sort";
      score: number;   // 0–100
      total: number;
    };

    if (!body.pointId || !body.mode) {
      return NextResponse.json({ error: "Thiếu pointId hoặc mode." }, { status: 400 });
    }

    const clampedScore = Math.min(100, Math.max(0, Math.round(body.score)));

    const existing = await prisma.grammarProgress.findUnique({
      where: { userId_pointId_mode: { userId, pointId: body.pointId, mode: body.mode } },
    });

    const row = await prisma.grammarProgress.upsert({
      where: { userId_pointId_mode: { userId, pointId: body.pointId, mode: body.mode } },
      create: {
        userId,
        pointId:   body.pointId,
        mode:      body.mode,
        bestScore: clampedScore,
        attempts:  1,
      },
      update: {
        bestScore:     Math.max(clampedScore, existing?.bestScore ?? 0),
        attempts:      { increment: 1 },
        lastAttemptAt: new Date(),
      },
      select: { pointId: true, mode: true, bestScore: true, attempts: true },
    });

    return NextResponse.json({ progress: row });
  } catch (err) {
    console.error("[grammar progress POST]", err);
    return NextResponse.json({ error: "Lỗi server." }, { status: 500 });
  }
}
