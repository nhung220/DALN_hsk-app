/**
 * GET    /api/user/notebook               → lấy tất cả notebook entries của user
 * POST   /api/user/notebook               → thêm/cập nhật 1 entry
 * PATCH  /api/user/notebook               → cập nhật ghi chú (note) cho 1 entry
 * DELETE /api/user/notebook?wordId=...    → xóa 1 entry
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

  const rows = await prisma.notebookEntry.findMany({
    where: { userId },
    orderBy: { savedAt: "desc" },
    select: {
      wordId: true,
      level: true,
      simplified: true,
      pinyin: true,
      meaning: true,
      note: true,
      savedAt: true,
    },
  });

  // Map savedAt thành ISO string để khớp NotebookEntry type
  const entries = rows.map(r => ({
    ...r,
    savedAt: r.savedAt.toISOString(),
  }));

  return NextResponse.json({ entries });
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });

  try {
    const body = await req.json() as {
      wordId: string;
      level: string;
      simplified: string;
      pinyin: string;
      meaning: string;
      note?: string;
    };

    if (!body.wordId) return NextResponse.json({ error: "Thiếu wordId." }, { status: 400 });

    const row = await prisma.notebookEntry.upsert({
      where: { userId_wordId: { userId, wordId: body.wordId } },
      create: {
        userId,
        wordId:     body.wordId,
        level:      body.level,
        simplified: body.simplified,
        pinyin:     body.pinyin,
        meaning:    body.meaning,
        note:       body.note ?? "",
      },
      update: {
        level:      body.level,
        simplified: body.simplified,
        pinyin:     body.pinyin,
        meaning:    body.meaning,
        // note không cập nhật ở đây để tránh ghi đè ghi chú cũ
      },
    });

    return NextResponse.json({ entry: { ...row, savedAt: row.savedAt.toISOString() } });
  } catch (err) {
    console.error("[user/notebook POST]", err);
    return NextResponse.json({ error: "Lỗi server." }, { status: 500 });
  }
}

// ── PATCH ─────────────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });

  try {
    const body = await req.json() as { wordId: string; note: string };

    if (!body.wordId) return NextResponse.json({ error: "Thiếu wordId." }, { status: 400 });

    await prisma.notebookEntry.updateMany({
      where: { userId, wordId: body.wordId },
      data: { note: body.note ?? "" },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[user/notebook PATCH]", err);
    return NextResponse.json({ error: "Lỗi server." }, { status: 500 });
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });

  const wordId = req.nextUrl.searchParams.get("wordId");
  if (!wordId) return NextResponse.json({ error: "Thiếu wordId." }, { status: 400 });

  await prisma.notebookEntry.deleteMany({
    where: { userId, wordId },
  });

  return NextResponse.json({ ok: true });
}
