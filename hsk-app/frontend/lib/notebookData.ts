/**
 * Sổ tay – client-only (localStorage)
 * Lưu từ yêu thích + ghi chú cá nhân theo wordId
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NotebookEntry {
  wordId: string;       // "new-1-0"
  level: string;        // "new-1"
  simplified: string;   // chữ Hán (để hiển thị nhanh không cần fetch)
  pinyin: string;
  meaning: string;      // nghĩa ngắn
  note: string;         // ghi chú cá nhân (rỗng nếu chưa có)
  savedAt: string;      // ISO timestamp
}

export type NotebookStore = Record<string, NotebookEntry>; // key = wordId

// ─── Storage key ──────────────────────────────────────────────────────────────

const NOTEBOOK_KEY = "hsk_notebook_v1";

// ─── Load / Save ──────────────────────────────────────────────────────────────

export function loadNotebook(): NotebookStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(NOTEBOOK_KEY);
    return raw ? (JSON.parse(raw) as NotebookStore) : {};
  } catch {
    return {};
  }
}

function saveNotebook(store: NotebookStore): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(NOTEBOOK_KEY, JSON.stringify(store));
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Lưu từ vào sổ tay. Nếu đã có, cập nhật thông tin nhưng giữ ghi chú. */
export function saveWord(entry: Omit<NotebookEntry, "note" | "savedAt">): void {
  const store = loadNotebook();
  const existing = store[entry.wordId];
  store[entry.wordId] = {
    ...entry,
    note: existing?.note ?? "",
    savedAt: existing?.savedAt ?? new Date().toISOString(),
  };
  saveNotebook(store);
}

/** Xóa từ khỏi sổ tay */
export function removeWord(wordId: string): void {
  const store = loadNotebook();
  delete store[wordId];
  saveNotebook(store);
}

/** Kiểm tra từ đã được lưu chưa */
export function isWordSaved(wordId: string): boolean {
  const store = loadNotebook();
  return wordId in store;
}

/** Cập nhật ghi chú cho một từ */
export function updateNote(wordId: string, note: string): void {
  const store = loadNotebook();
  if (!store[wordId]) return;
  store[wordId] = { ...store[wordId], note };
  saveNotebook(store);
}

/** Lấy tất cả từ đã lưu dưới dạng mảng, mới nhất lên trước */
export function getNotebookList(): NotebookEntry[] {
  const store = loadNotebook();
  return Object.values(store).sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
  );
}

/** Đếm số từ đã lưu */
export function getNotebookCount(): number {
  return Object.keys(loadNotebook()).length;
}
