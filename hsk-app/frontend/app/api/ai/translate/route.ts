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

  const { original, userTranslation, direction } = await req.json() as {
    original?: string; userTranslation?: string; direction?: "zh2vi" | "vi2zh";
  };

  if (!original?.trim() || !userTranslation?.trim())
    return NextResponse.json({ error: "Thiếu câu gốc hoặc bản dịch." }, { status: 400 });
  if (!direction || !["zh2vi", "vi2zh"].includes(direction))
    return NextResponse.json({ error: "direction phải là zh2vi hoặc vi2zh." }, { status: 400 });

  try {
    const raw = await generateText(PROMPTS.translation(original, userTranslation, direction));
    
    // Strip markdown code blocks and extra text
    let cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    
    // Try to extract JSON if there's extra text before/after
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }
    
    const result = JSON.parse(cleaned);

    await prisma.aiSession.create({
      data: {
        userId: userId ?? null,
        type: "translation",
        input: userId ? original : `__ip__${ip}__${original}`,
        output: raw,
        tokens: raw.length,
      },
    }).catch(() => {});

    return NextResponse.json(result);
  } catch (err) {
    console.error("[ai/translate]", err);
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("chưa được cấu hình"))
      return NextResponse.json({ error: "GEMINI_API_KEY chưa được cấu hình." }, { status: 503 });
    return NextResponse.json({ error: "Không thể kết nối AI. Thử lại sau." }, { status: 500 });
  }
}
