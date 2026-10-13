/**
 * POST /api/notebook
 * Body: { wordIds: string[] }
 * Response: { words: Word[] }
 *
 * Resolve word details từ public/data JSON files (server-side).
 * Dùng trong NotebookClient để hiển thị chi tiết (pos, meanings, radical…)
 */
import { NextRequest, NextResponse } from "next/server";
import { fetchLevelDataSync } from "@/lib/hskDataServer";
import type { Word } from "@/types/hsk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { wordIds?: string[] };
    const wordIds = body.wordIds;

    if (!Array.isArray(wordIds) || wordIds.length === 0) {
      return NextResponse.json({ words: [] });
    }

    // Group wordIds by level để tránh load trùng file
    const byLevel = new Map<number, string[]>();
    for (const id of wordIds) {
      const m = id.match(/^new-(\d+)-/);
      if (!m) continue;
      const lvl = parseInt(m[1]);
      if (!byLevel.has(lvl)) byLevel.set(lvl, []);
      byLevel.get(lvl)!.push(id);
    }

    // Resolve words
    const result: Word[] = [];
    for (const [lvl, ids] of byLevel) {
      try {
        const data = fetchLevelDataSync(lvl);
        const wordMap = new Map<string, Word>();
        for (const lesson of data.lessons) {
          for (const w of lesson.words) wordMap.set(w.id, w);
        }
        for (const id of ids) {
          const w = wordMap.get(id);
          if (w) result.push(w);
        }
      } catch {
        // level file không tồn tại — bỏ qua
      }
    }

    return NextResponse.json({ words: result });
  } catch (err) {
    console.error("[notebook POST]", err);
    return NextResponse.json({ words: [] });
  }
}
