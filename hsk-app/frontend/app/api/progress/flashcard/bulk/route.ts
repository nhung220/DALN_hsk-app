/**
 * POST /api/progress/flashcard/bulk
 * body: { cards: SM2Card[] }
 * → nhập các thẻ chưa có; giữ lịch ôn trên DB khi đồng bộ cache cũ
 */
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SM2CardBody {
  wordId: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: string;
  lastReview: string;
}

export async function POST(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });

  try {
    const body = await req.json() as { cards: SM2CardBody[] };
    if (!Array.isArray(body.cards) || body.cards.length === 0) {
      return NextResponse.json({ error: "Không có cards." }, { status: 400 });
    }

    // Import/init must never reset an existing schedule, even if another device
    // creates the card between our GET and POST. Reviews use the single-card API.
    const result = await prisma.flashcardCard.createMany({
      data: body.cards.map(({ wordId, easeFactor, interval, repetitions, nextReview, lastReview }) =>
        ({ userId, wordId, easeFactor, interval, repetitions, nextReview, lastReview })),
      skipDuplicates: true,
    });
    return NextResponse.json({ ok: true, saved: result.count });
  } catch (err) {
    console.error("[flashcard/bulk]", err);
    return NextResponse.json({ error: "Lỗi server." }, { status: 500 });
  }
}
