/**
 * GET  /api/review/history?days=90   → lịch sử phiên ôn tập
 * POST /api/review/history            → lưu 1 phiên ôn tập
 *      body: { date, totalCards, correctCards, score, durationSec }
 */
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addDateKeyDays, isDateKey, localDateKey } from "@/lib/dateKey";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });

  const requestedDays = Number(req.nextUrl.searchParams.get("days") ?? "90");
  const days = Number.isInteger(requestedDays) && requestedDays > 0 ? Math.min(365, requestedDays) : 90;
  const requestedDate = req.nextUrl.searchParams.get("date");
  const today = isDateKey(requestedDate) ? requestedDate : localDateKey();
  const sinceDate = addDateKeyDays(today, -days);

  const sessions = await prisma.reviewSession.findMany({
    where: { userId, date: { gte: sinceDate, lte: today } },
    orderBy: { date: "asc" },
    select: { date: true, totalCards: true, correctCards: true, score: true, durationSec: true, createdAt: true },
  });

  // Tổng hợp theo ngày (nhiều phiên/ngày → gộp lại)
  const byDate = new Map<string, { totalCards: number; correctCards: number; sessions: number; durationSec: number }>();
  for (const s of sessions) {
    const existing = byDate.get(s.date) ?? { totalCards: 0, correctCards: 0, sessions: 0, durationSec: 0 };
    byDate.set(s.date, {
      totalCards:   existing.totalCards   + s.totalCards,
      correctCards: existing.correctCards + s.correctCards,
      sessions:     existing.sessions     + 1,
      durationSec:  existing.durationSec  + s.durationSec,
    });
  }

  const daily = Array.from(byDate.entries()).map(([date, v]) => ({
    date,
    totalCards:   v.totalCards,
    correctCards: v.correctCards,
    sessions:     v.sessions,
    durationSec:  v.durationSec,
    score: v.totalCards > 0 ? Math.round((v.correctCards / v.totalCards) * 100) : 0,
  }));

  // Tính streak liên tiếp
  const dateSet  = new Set(daily.map(d => d.date));
  let streak = 0;
  let currentDate = today;
  while (dateSet.has(currentDate)) {
    streak++;
    currentDate = addDateKeyDays(currentDate, -1);
  }

  // Tổng thống kê
  const totalSessions  = sessions.length;
  const totalCards     = daily.reduce((a, d) => a + d.totalCards, 0);
  const totalCorrect   = daily.reduce((a, d) => a + d.correctCards, 0);
  const avgScore       = totalCards > 0 ? Math.round((totalCorrect / totalCards) * 100) : 0;
  const activeDays     = daily.length;

  // Lấy tất cả flashcard cards để tính tổng từ đang ôn
  const allCards       = await prisma.flashcardCard.count({ where: { userId } });
  const dueToday       = await prisma.flashcardCard.count({ where: { userId, nextReview: { lte: today } } });

  return NextResponse.json({
    daily,
    stats: { streak, totalSessions, totalCards, avgScore, activeDays, allCards, dueToday },
  });
}

// ── POST ──────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });

  try {
    const body = await req.json() as {
      date: string;
      totalCards: number;
      correctCards: number;
      score: number;
      durationSec?: number;
    };

    if (!body.date || body.totalCards == null) {
      return NextResponse.json({ error: "Thiếu dữ liệu." }, { status: 400 });
    }

    const session = await prisma.reviewSession.create({
      data: {
        userId,
        date:         body.date,
        totalCards:   body.totalCards,
        correctCards: body.correctCards,
        score:        body.score,
        durationSec:  body.durationSec ?? 0,
      },
    });

    return NextResponse.json({ session });
  } catch (err) {
    console.error("[review/history POST]", err);
    return NextResponse.json({ error: "Lỗi server." }, { status: 500 });
  }
}
