/**
 * Client-safe utilities only (no Node.js built-ins)
 * Server-side data fetching → import from "@/lib/hskDataServer"
 */
import type { Word } from "@/types/hsk";
import { localDateKey, addDateKeyDays } from "./dateKey";
export { localDateKey } from "./dateKey";

// ─── SM-2 Algorithm ──────────────────────────────────────────────────────────

export interface SM2Card {
  wordId: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: string;
  lastReview: string;
}

export type SM2Quality = 0 | 1 | 2 | 3 | 4 | 5;

export function sm2Update(card: SM2Card, quality: SM2Quality): SM2Card {
  const today = localDateKey();
  let { easeFactor, interval, repetitions } = card;

  if (quality >= 3) {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
  } else {
    interval = 1;
    repetitions = 0;
  }

  easeFactor = Math.max(
    1.3,
    easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  );

  return {
    wordId: card.wordId,
    easeFactor: Math.round(easeFactor * 100) / 100,
    interval,
    repetitions,
    nextReview: addDateKeyDays(today, interval),
    lastReview: today,
  };
}

export function createNewCard(wordId: string): SM2Card {
  const today = localDateKey();
  return {
    wordId,
    easeFactor: 2.5,
    interval: 1,
    repetitions: 0,
    nextReview: today, // review ngay hôm nay lần đầu
    lastReview: today,
  };
}

// ─── Levenshtein distance ─────────────────────────────────────────────────────

export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

export function normalizePinyin(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "");
}

// ─── Quiz generator ───────────────────────────────────────────────────────────

export function generateQuizOptions(correct: Word, pool: Word[], count = 4): Word[] {
  const others = pool.filter((w) => w.id !== correct.id);
  for (let i = others.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [others[i], others[j]] = [others[j], others[i]];
  }
  const all = [...others.slice(0, count - 1), correct];
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all;
}

// ─── LocalStorage helpers (client-only) ──────────────────────────────────────

const PROGRESS_KEY = "hsk_progress";

export function loadProgress(): Record<string, SM2Card> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveProgress(cards: Record<string, SM2Card>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(cards));
}

const LESSON_PROGRESS_KEY = "hsk_lesson_progress";

export interface LessonProgressEntry {
  completed: boolean;
  score?: number;
  completedAt?: string;
}

export function loadLessonProgress(): Record<string, LessonProgressEntry> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LESSON_PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveLessonProgress(progress: Record<string, LessonProgressEntry>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LESSON_PROGRESS_KEY, JSON.stringify(progress));
}

export function markLessonCompleted(lessonId: string, score: number): void {
  const progress = loadLessonProgress();
  progress[lessonId] = {
    completed: true,
    score,
    completedAt: new Date().toISOString(),
  };
  saveLessonProgress(progress);
}

// ─── Gate / Unlock system ─────────────────────────────────────────────────────
//
// Logic: mỗi level chia thành "set" gồm 3 bài (set-1: bài 1-3, set-2: bài 4-6, …)
// Set 1 luôn mở khoá sẵn. Các set sau chỉ mở khi kiểm tra set trước đạt ≥ 80%.
//
// Key: "hsk_gate_v1"
// Value: { "new-1-set-1": { passed: true, score: 92, at: "..." }, ... }

const GATE_KEY = "hsk_gate_v1";
const PASS_THRESHOLD = 80; // %

export interface GateEntry {
  passed: boolean;
  score: number;
  attempts: number;
  lastAttemptAt: string;
}

export type GateStore = Record<string, GateEntry>;

export function loadGateStore(): GateStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(GATE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveGateStore(store: GateStore): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(GATE_KEY, JSON.stringify(store));
}

/** setId format: "new-{level}-set-{setNum}" */
export function getSetId(level: number, setNum: number): string {
  return `new-${level}-set-${setNum}`;
}

export function getSetForLesson(lessonNum: number): number {
  return Math.ceil(lessonNum / 3);
}

/**
 * Bài học thuộc set nào → set đó có được mở khóa không?
 * Set 1 của mỗi level luôn mở. Set N mở khi set N-1 đã passed.
 */
export function isLessonUnlocked(level: number, lessonNum: number, store = loadGateStore()): boolean {
  const setNum = getSetForLesson(lessonNum);
  if (setNum === 1) return true; // set đầu luôn mở
  const prevSetId = getSetId(level, setNum - 1);
  return store[prevSetId]?.passed === true;
}

/** Kiểm tra một set có được mở không (dùng để hiển thị nút kiểm tra) */
export function isSetUnlocked(level: number, setNum: number, store = loadGateStore()): boolean {
  if (setNum === 1) return true;
  const prevSetId = getSetId(level, setNum - 1);
  return store[prevSetId]?.passed === true;
}

/** Lưu kết quả kiểm tra; trả về { passed, score } */
export function recordTestResult(
  level: number,
  setNum: number,
  score: number
): { passed: boolean; score: number } {
  const store = loadGateStore();
  const setId = getSetId(level, setNum);
  const existing = store[setId];
  const passed = score >= PASS_THRESHOLD;
  store[setId] = {
    passed: passed || existing?.passed === true, // không rút lại nếu đã pass trước đó
    score: Math.max(score, existing?.score ?? 0),
    attempts: (existing?.attempts ?? 0) + 1,
    lastAttemptAt: new Date().toISOString(),
  };
  saveGateStore(store);
  return { passed, score };
}

/** Lấy entry của một set */
export function getGateEntry(level: number, setNum: number, store = loadGateStore()): GateEntry | null {
  return store[getSetId(level, setNum)] ?? null;
}

export { PASS_THRESHOLD };

// ─── Sync tiến độ lên DB (fire-and-forget, client-only) ──────────────────────

/**
 * Gọi sau khi markLessonCompleted để đồng bộ lên DB nếu đã đăng nhập.
 * Fire-and-forget — không block UI.
 */
export async function syncLessonProgressToDB(
  lessonId: string,
  completed: boolean,
  score: number
): Promise<void> {
  try {
    await fetch("/api/progress/lesson", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ lessonId, completed, score }),
    });
  } catch { /* offline — localStorage đã lưu, sẽ sync sau */ }
}

/**
 * Gọi sau khi recordTestResult để đồng bộ gate result lên DB.
 */
export async function syncGateResultToDB(
  setId: string,
  passed: boolean,
  score: number
): Promise<void> {
  try {
    await fetch("/api/progress/gate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ setId, passed, score }),
    });
  } catch { /* offline */ }
}
