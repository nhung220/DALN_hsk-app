/**
 * GET  /api/progress/gate          → tất cả gate results của user
 * POST /api/progress/gate
 *      body: { setId, passed, score }
 *      → upsert, không rút lại "passed" nếu đã đạt
 */
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });

  const rows = await prisma.gateResult.findMany({
    where: { userId },
    select: { setId: true, passed: true, score: true, attempts: true, lastAttemptAt: true },
  });

  return NextResponse.json({ gates: rows });
}

export async function POST(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });

  try {
    const body = await req.json() as { setId: string; passed: boolean; score: number };
    if (!body.setId) return NextResponse.json({ error: "Thiếu setId." }, { status: 400 });

    const existing = await prisma.gateResult.findUnique({
      where: { userId_setId: { userId, setId: body.setId } },
    });

    const row = await prisma.gateResult.upsert({
      where: { userId_setId: { userId, setId: body.setId } },
      create: { userId, setId: body.setId, passed: body.passed, score: body.score, attempts: 1 },
      update: {
        passed: body.passed || (existing?.passed ?? false), // không rút lại
        score: Math.max(body.score, existing?.score ?? 0),
        attempts: { increment: 1 },
        lastAttemptAt: new Date(),
      },
      select: { setId: true, passed: true, score: true, attempts: true },
    });

    return NextResponse.json({ gate: row });
  } catch (err) {
    console.error("[gate POST]", err);
    return NextResponse.json({ error: "Lỗi server." }, { status: 500 });
  }
}
