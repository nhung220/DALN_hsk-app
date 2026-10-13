/**
 * Server-only: đọc grammar data từ public/data/grammar-hsk-N.json
 * Chỉ import từ Server Components / Route Handlers
 */
import path from "path";
import fs from "fs";

const DATA_DIR = path.join(process.cwd(), "public", "data");

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GrammarExample {
  id: string;
  tokens: string[];    // ["她", "在", "看", "书。"] — dùng cho game sắp xếp câu, dấu câu gắn vào từ cuối
  chinese: string;     // "她在看书。" — câu gốc đầy đủ
  pinyin: string;
  translation: string; // tiếng Anh
}

export interface GrammarPoint {
  id: string;
  title: string;
  titleVi?: string;
  structures: string[];
  usedFor: string[];
  url: string;
  examples: GrammarExample[];
}

export interface GrammarLevelData {
  level: string;
  levelNumber: number;
  totalPoints: number;
  totalExamples: number;
  points: GrammarPoint[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readJson<T>(filename: string): T {
  const filePath = path.join(DATA_DIR, filename);
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

export function fetchGrammarLevelSync(levelNumber: number): GrammarLevelData {
  return readJson<GrammarLevelData>(`grammar-hsk-${levelNumber}.json`);
}

export async function fetchGrammarLevel(levelNumber: number): Promise<GrammarLevelData> {
  return fetchGrammarLevelSync(levelNumber);
}

export async function fetchGrammarPoint(
  levelNumber: number,
  pointId: string
): Promise<GrammarPoint | null> {
  const data = fetchGrammarLevelSync(levelNumber);
  return data.points.find((p) => p.id === pointId) ?? null;
}

/** Trả tất cả points từ tất cả levels (dùng cho search / AI) */
export async function fetchAllGrammarPoints(): Promise<GrammarPoint[]> {
  const all: GrammarPoint[] = [];
  for (let i = 1; i <= 6; i++) {
    try {
      const data = fetchGrammarLevelSync(i);
      all.push(...data.points);
    } catch {
      // level không tồn tại → bỏ qua
    }
  }
  return all;
}
