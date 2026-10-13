import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODULES = new Set(["topic", "reading", "dialogue", "exam"]);

export async function GET(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  const progress = await prisma.moduleProgress.findMany({
    where: { userId },
    select: { module: true, itemId: true, completed: true, bestScore: true, attempts: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ progress });
}

export async function POST(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  try {
    const body = await req.json() as { module?: string; itemId?: string; completed?: boolean; score?: number; countAttempt?: boolean };
    if (!body.module || !MODULES.has(body.module) || !body.itemId || body.itemId.length > 160) {
      return NextResponse.json({ error: "Dữ liệu tiến độ không hợp lệ." }, { status: 400 });
    }
    const score = body.score === undefined ? undefined : Math.max(0, Math.min(100, Math.round(body.score)));
    const key = { userId_module_itemId: { userId, module: body.module, itemId: body.itemId } };
    const existing = await prisma.moduleProgress.findUnique({ where: key });
    const completed = Boolean(body.completed) || Boolean(existing?.completed);
    const row = await prisma.moduleProgress.upsert({
      where: key,
      create: { userId, module: body.module, itemId: body.itemId, completed: Boolean(body.completed), bestScore: score, attempts: body.countAttempt ? 1 : 0, completedAt: body.completed ? new Date() : null },
      update: {
        completed,
        ...(score !== undefined && { bestScore: Math.max(score, existing?.bestScore ?? 0) }),
        ...(body.countAttempt && { attempts: { increment: 1 } }),
        ...(body.completed && !existing?.completed && { completedAt: new Date() }),
      },
      select: { module: true, itemId: true, completed: true, bestScore: true, attempts: true },
    });
    return NextResponse.json({ progress: row });
  } catch (error) {
    console.error("[module progress POST]", error);
    return NextResponse.json({ error: "Lỗi server." }, { status: 500 });
  }
}
