import { NextRequest, NextResponse } from "next/server";
import { generateText, PROMPTS } from "@/lib/gemini";
import { getUserIdFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAILY_LIMIT = parseInt(process.env.AI_DAILY_LIMIT ?? "20");

export async function POST(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  // Kiểm tra rate limit cho cả guest (theo IP) và user đã đăng nhập (theo userId)
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (userId) {
    const count = await prisma.aiSession.count({
      where: { userId, createdAt: { gte: today } },
    });
    if (count >= DAILY_LIMIT) {
      return NextResponse.json(
        { error: `Đã đạt giới hạn ${DAILY_LIMIT} lượt AI/ngày.` },
        { status: 429 }
      );
    }
  } else {
    const count = await prisma.aiSession.count({
      where: { input: { startsWith: `__ip__${ip}` }, createdAt: { gte: today } },
    });
    if (count >= DAILY_LIMIT) {
      return NextResponse.json(
        { error: `Đã đạt giới hạn ${DAILY_LIMIT} lượt AI/ngày. Đăng nhập để tiếp tục.` },
        { status: 429 }
      );
    }
  }

  const { sentence } = await req.json() as { sentence?: string };
  if (!sentence?.trim())
    return NextResponse.json({ error: "Vui lòng nhập câu cần chấm." }, { status: 400 });
  if (sentence.length > 500)
    return NextResponse.json({ error: "Câu quá dài (tối đa 500 ký tự)." }, { status: 400 });

  try {
    const raw = await generateText(PROMPTS.grammar(sentence));
    
    // Strip markdown code blocks and extra text
    let cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    
    // Try to extract JSON if there's extra text before/after
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }
    
    const result = JSON.parse(cleaned);

    // Ghi log session (dùng userId hoặc IP placeholder)
    await prisma.aiSession.create({
      data: {
        userId: userId ?? null,
        type: "grammar",
        input: userId ? sentence : `__ip__${ip}__${sentence}`,
        output: raw,
        tokens: raw.length,
      },
    }).catch(() => {/* không block nếu ghi log lỗi */});

    return NextResponse.json(result);
  } catch (err) {
    console.error("[ai/grammar]", err);
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("chưa được cấu hình"))
      return NextResponse.json({ error: "GEMINI_API_KEY chưa được cấu hình." }, { status: 503 });
    return NextResponse.json({ error: "Không thể kết nối AI. Thử lại sau." }, { status: 500 });
  }
}
