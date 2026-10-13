/**
 * GET  /api/progress/flashcard?lessonId=new-1-lesson-1
 *      → trả về SM-2 cards của lesson này từ DB
 *
 * POST /api/progress/flashcard
 *      body: { wordId, easeFactor, interval, repetitions, nextReview, lastReview }
 *      → upsert 1 card
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

  const lessonId = req.nextUrl.searchParams.get("lessonId");
  // lessonId format: "new-1-lesson-3"
  // wordId format:   "new-1-0", "new-1-1", ...  (level prefix + index)
  // Khi filter theo lesson, lấy tất cả cards của user rồi filter phía client,
  // hoặc lấy tất cả (API đơn giản hơn, client tự filter theo lesson nếu cần).
  // Ở đây: nếu có lessonId → trả tất cả cards của level tương ứng (startsWith "new-X-")
  // vì 1 lesson không có prefix riêng trong wordId.
  let levelPrefix: string | undefined;
  if (lessonId) {
    // "new-1-lesson-3" → prefix "new-1-"
    const m = lessonId.match(/^(new-\d+)-lesson-\d+$/);
    levelPrefix = m ? m[1] + "-" : undefined;
  }

  const cards = await prisma.flashcardCard.findMany({
    where: levelPrefix
      ? { userId, wordId: { startsWith: levelPrefix } }
      : { userId },
    select: {
      wordId: true, easeFactor: true, interval: true,
      repetitions: true, nextReview: true, lastReview: true,
    },
  });

  return NextResponse.json({ cards });
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });

  try {
    const body = await req.json() as {
      wordId: string;
      easeFactor: number;
      interval: number;
      repetitions: number;
      nextReview: string;
      lastReview: string;
    };

    const { wordId, easeFactor, interval, repetitions, nextReview, lastReview } = body;
    if (!wordId) return NextResponse.json({ error: "Thiếu wordId." }, { status: 400 });

    const card = await prisma.flashcardCard.upsert({
      where: { userId_wordId: { userId, wordId } },
      create: { userId, wordId, easeFactor, interval, repetitions, nextReview, lastReview },
      update: { easeFactor, interval, repetitions, nextReview, lastReview },
      select: { wordId: true, easeFactor: true, interval: true, repetitions: true, nextReview: true, lastReview: true },
    });

    return NextResponse.json({ card });
  } catch (err) {
    console.error("[flashcard POST]", err);
    return NextResponse.json({ error: "Lỗi server." }, { status: 500 });
  }
}
