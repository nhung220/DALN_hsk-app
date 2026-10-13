/**
 * Server-only data access layer (Node.js fs)
 * PERF: in-memory cache — đọc mỗi file 1 lần duy nhất trong suốt lifetime của process.
 * readFileSync vẫn dùng lần đầu (nhanh hơn async khi cold-start vì không context-switch),
 * nhưng từ lần 2 trở đi trả về từ cache ngay lập tức.
 */
import type { LevelData, LevelMeta, Lesson, Word } from "@/types/hsk";
import path from "path";
import fs from "fs";

const DATA_DIR = path.join(process.cwd(), "public", "data");

// ─── Module-level cache (sống suốt vòng đời process / hot-reload) ─────────────
const jsonCache = new Map<string, unknown>();

function readJson<T>(filename: string): T {
  if (jsonCache.has(filename)) return jsonCache.get(filename) as T;
  const filePath = path.join(DATA_DIR, filename);
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw) as T;
    jsonCache.set(filename, parsed);
    return parsed;
  } catch (e) {
    throw new Error(`[hskDataServer] Cannot read "${filename}": ${e}`);
  }
}

export function fetchLevelsSync(): LevelMeta[] {
  return readJson<LevelMeta[]>("levels.json");
}

export function fetchLevelDataSync(levelNumber: number): LevelData {
  return readJson<LevelData>(`hsk-new-${levelNumber}.json`);
}

export function fetchSearchIndexSync(): Word[] {
  return readJson<Word[]>("search-index.json");
}

export async function fetchLevels(): Promise<LevelMeta[]> {
  return fetchLevelsSync();
}

export async function fetchLevelData(levelNumber: number): Promise<LevelData> {
  return fetchLevelDataSync(levelNumber);
}

export async function fetchLesson(lessonId: string): Promise<Lesson | null> {
  const match = lessonId.match(/^new-(\d+)-lesson-(\d+)$/);
  if (!match) return null;
  const data = fetchLevelDataSync(parseInt(match[1]));
  return data.lessons.find((l) => l.id === lessonId) ?? null;
}

export async function fetchAllLessonsForLevel(levelNumber: number): Promise<Lesson[]> {
  return fetchLevelDataSync(levelNumber).lessons;
}

// ─── Word map cache (wordId → Word) ───────────────────────────────────────────
// Dùng trong review/page.tsx thay vì đọc lại từng level riêng lẻ

const wordMapCache = new Map<number, Map<string, import("@/types/hsk").Word>>();

export function getWordMap(levelNumber: number): Map<string, import("@/types/hsk").Word> {
  if (wordMapCache.has(levelNumber)) return wordMapCache.get(levelNumber)!;
  const data = fetchLevelDataSync(levelNumber);
  const map = new Map<string, import("@/types/hsk").Word>();
  for (const lesson of data.lessons) for (const word of lesson.words) map.set(word.id, word);
  wordMapCache.set(levelNumber, map);
  return map;
}
