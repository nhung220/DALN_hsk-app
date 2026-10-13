/**
 * POST /api/ai/examples
 * Body: { hanzi, level }
 * → Tạo 3 câu ví dụ tự nhiên cho từ
 */
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateText, PROMPTS } from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAILY_LIMIT = parseInt(process.env.AI_DAILY_LIMIT ?? "20");

async function checkRateLimit(userId: string): Promise<boolean> {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const count = await prisma.aiSession.count({ where: { userId, createdAt: { gte: today } } });
  return count < DAILY_LIMIT;
}

export async function POST(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });

  const { hanzi, level } = await req.json() as { hanzi?: string; level?: string };
  if (!hanzi?.trim()) return NextResponse.json({ error: "Thiếu chữ Hán." }, { status: 400 });

  const allowed = await checkRateLimit(userId);
  if (!allowed) {
    return NextResponse.json({ error: `Đã đạt giới hạn ${DAILY_LIMIT} lượt AI/ngày.` }, { status: 429 });
  }

  try {
    const raw = await generateText(PROMPTS.makeExamples(hanzi, level ?? "new-1"));
    const result = JSON.parse(raw.replace(/```json|```/g, "").trim());

    await prisma.aiSession.create({
      data: { userId, type: "examples", input: hanzi, output: raw, tokens: raw.length },
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[ai/examples]", err);
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("chưa được cấu hình")) {
      return NextResponse.json({ error: "GEMINI_API_KEY chưa được cấu hình." }, { status: 503 });
    }
    return NextResponse.json({ error: "Không thể kết nối AI. Thử lại sau." }, { status: 500 });
  }
}
