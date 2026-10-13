"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  BookMarked, Home, ChevronRight, Trash2, Pencil,
  Check, X, Volume2, Filter, BookOpen, Search,
  ChevronDown, ChevronUp, Loader2, CloudOff, Cloud,
} from "lucide-react";
import type { Word } from "@/types/hsk";
import {
  loadNotebook, removeWord, updateNote,
  type NotebookEntry,
} from "@/lib/notebookData";
import { useAuth } from "@/components/auth/AuthProvider";

// ─── Palette ─────────────────────────────────────────────────────────────────

const P = {
  bg:          "#FFFBEA",
  surface:     "#FFF8D6",
  surfaceHover:"#FFF3B0",
  border:      "#E8D98A",
  borderLight: "#F0E9B8",
  text:        "#1C1408",
  textMuted:   "#78614A",
  textFaint:   "#A8956A",
};

// ─── Constants ────────────────────────────────────────────────────────────────

const LEVEL_COLORS: Record<string, { accent: string; bg: string; label: string }> = {
  "new-1": { accent: "#C0392B", bg: "rgba(192,57,43,0.12)", label: "HSK 1" },
  "new-2": { accent: "#2563EB", bg: "rgba(37,99,235,0.12)",  label: "HSK 2" },
  "new-3": { accent: "#7C3AED", bg: "rgba(124,58,237,0.12)", label: "HSK 3" },
  "new-4": { accent: "#059669", bg: "rgba(5,150,105,0.12)",  label: "HSK 4" },
  "new-5": { accent: "#B45309", bg: "rgba(180,83,9,0.12)",   label: "HSK 5" },
  "new-6": { accent: "#EA580C", bg: "rgba(234,88,12,0.12)",  label: "HSK 6" },
  "new-7": { accent: "#9333EA", bg: "rgba(147,51,234,0.12)", label: "HSK 7" },
};

// ─── Audio ────────────────────────────────────────────────────────────────────

function playAudio(audioUrl: string) {
  if (typeof window === "undefined") return;
  new Audio(audioUrl).play().catch(() => {});
}

// ─── NoteEditor ───────────────────────────────────────────────────────────────

function NoteEditor({
  wordId, initial, onSave, onCancel,
}: {
  wordId: string; initial: string; onSave: (note: string) => void; onCancel: () => void;
}) {
  const [text, setText] = useState(initial);
  return (
    <div className="mt-3">
      <textarea
        className="w-full rounded-xl border px-3 py-2 text-sm bg-transparent resize-none outline-none transition-all"
        style={{ borderColor: P.border, minHeight: 72, color: P.text, background: P.surfaceHover }}
        placeholder="Thêm ghi chú, ví dụ, ngữ cảnh..."
        value={text}
        onChange={e => setText(e.target.value)}
        autoFocus
        onFocus={e => (e.currentTarget.style.borderColor = "#B45309")}
        onBlur={e => (e.currentTarget.style.borderColor = P.border)}
      />
      <div className="flex gap-2 mt-1.5">
        <button
          onClick={() => onSave(text)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:brightness-110"
          style={{ background: "#B45309" }}
        >
          <Check size={12} /> Lưu
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors"
          style={{ color: P.textFaint }}
        >
          <X size={12} /> Huỷ
        </button>
      </div>
    </div>
  );
}

// ─── NotebookCard ─────────────────────────────────────────────────────────────

function NotebookCard({
  entry, detail, onRemove, onNoteChange,
}: {
  entry: NotebookEntry;
  detail: Word | null;
  onRemove: (id: string) => void;
  onNoteChange: (id: string, note: string) => void;
}) {
  const cfg = LEVEL_COLORS[entry.level] ?? LEVEL_COLORS["new-1"];
  const [expanded, setExpanded]       = useState(false);
  const [editingNote, setEditingNote] = useState(false);

  const handleSaveNote = (note: string) => {
    updateNote(entry.wordId, note);
    onNoteChange(entry.wordId, note);
    setEditingNote(false);
  };

  return (
    <div
      className="rounded-2xl border p-4 transition-all"
      style={{ background: P.surface, borderColor: P.border }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = cfg.accent}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = P.border}
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="text-4xl font-black leading-none flex-shrink-0"
            style={{ fontFamily: "'Noto Sans SC', sans-serif", color: P.text }}
          >
            {entry.simplified}
          </span>
          <div className="min-w-0">
            <p className="text-base font-semibold" style={{ color: cfg.accent }}>
              {entry.pinyin}
            </p>
            <p className="text-xs line-clamp-1 mt-0.5" style={{ color: P.textMuted }}>{entry.meaning}</p>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span
            className="text-[11px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: cfg.bg, color: cfg.accent, border: `1px solid ${cfg.accent}40` }}
          >
            {cfg.label}
          </span>
          {detail?.audioUrl && (
            <button
              onClick={() => playAudio(detail.audioUrl)}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110"
              style={{ background: `${cfg.accent}18`, color: cfg.accent }}
              title="Phát âm"
            >
              <Volume2 size={13} />
            </button>
          )}
          <button
            onClick={() => setEditingNote(v => !v)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
            style={{ color: P.textFaint }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = P.surfaceHover}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
            title="Ghi chú"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => setExpanded(v => !v)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
            style={{ color: P.textFaint }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = P.surfaceHover}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
            title={expanded ? "Thu gọn" : "Xem chi tiết"}
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          <button
            onClick={() => onRemove(entry.wordId)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
            style={{ color: P.textFaint }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = "rgba(192,57,43,0.12)";
              (e.currentTarget as HTMLElement).style.color = "#C0392B";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = P.textFaint;
            }}
            title="Xóa khỏi sổ tay"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Ghi chú */}
      {entry.note && !editingNote && (
        <div
          className="mt-2.5 px-3 py-2 rounded-xl text-xs italic border-l-2"
          style={{ background: P.surfaceHover, borderColor: cfg.accent, color: P.textMuted }}
        >
          {entry.note}
        </div>
      )}

      {editingNote && (
        <NoteEditor
          wordId={entry.wordId}
          initial={entry.note}
          onSave={handleSaveNote}
          onCancel={() => setEditingNote(false)}
        />
      )}

      {/* Chi tiết mở rộng */}
      {expanded && detail && (
        <div
          className="mt-3 pt-3 border-t space-y-2"
          style={{ borderColor: P.borderLight }}
        >
          {detail.pos.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {detail.pos.map(p => (
                <span
                  key={p.code}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-md"
                  style={{ background: P.surfaceHover, color: P.textMuted }}
                >
                  {p.label}
                </span>
              ))}
            </div>
          )}
          {detail.meaningVi && (
            <p className="text-sm font-semibold" style={{ color: P.text }}>{detail.meaningVi}</p>
          )}
          <div className="space-y-0.5">
            {detail.meanings.slice(0, 4).map((m, i) => (
              <p key={i} className="text-xs leading-relaxed" style={{ color: P.textMuted }}>
                <span className="mr-1" style={{ color: P.textFaint }}>{i + 1}.</span>{m}
              </p>
            ))}
          </div>
          {detail.radical && (
            <p className="text-[11px]" style={{ color: P.textFaint }}>
              Bộ thủ: <span style={{ fontFamily: "'Noto Sans SC', sans-serif", color: P.textMuted }}>{detail.radical}</span>
            </p>
          )}
          {detail.traditional && detail.traditional !== detail.simplified && (
            <p className="text-[11px]" style={{ color: P.textFaint }}>
              Phồn thể: <span style={{ fontFamily: "'Noto Sans SC', sans-serif", color: P.textMuted }}>{detail.traditional}</span>
            </p>
          )}
        </div>
      )}

      <p className="text-[10px] mt-2.5" style={{ color: P.textFaint }}>
        Đã lưu {new Date(entry.savedAt).toLocaleDateString("vi-VN")}
      </p>
    </div>
  );
}

// ─── Level filter button ──────────────────────────────────────────────────────

function LevelBtn({ value, label, active, accent, onClick }: {
  value: string; label: string; active: boolean; accent: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
      style={active
        ? { background: accent, color: "#fff" }
        : { background: "#FFF3B0", color: "#78614A" }}
    >
      {label}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function NotebookClient() {
  const { user }                              = useAuth();
  const [entries, setEntries]                 = useState<NotebookEntry[]>([]);
  const [details, setDetails]                 = useState<Record<string, Word>>({});
  const [levelFilter, setLevelFilter]         = useState("");
  const [searchText, setSearchText]           = useState("");
  const [loadingDetail, setLoadingDetail]     = useState(false);
  const [syncing, setSyncing]                 = useState(false);
  const [mounted, setMounted]                 = useState(false);

  useEffect(() => {
    setMounted(true);
    if (user) {
      setSyncing(true);
      fetch("/api/user/notebook", { credentials: "include" })
        .then(r => r.json())
        .then((data: { entries?: NotebookEntry[] }) => {
          if (data.entries) {
            const sorted = [...data.entries].sort(
              (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
            );
            setEntries(sorted);
          }
        })
        .catch(() => {
          const fallback = Object.values(loadNotebook()).sort(
            (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
          );
          setEntries(fallback);
        })
        .finally(() => setSyncing(false));
    } else {
      const list = Object.values(loadNotebook()).sort(
        (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
      );
      setEntries(list);
    }
  }, [user]);

  const detailsRef = useRef<Record<string, Word>>({});
  detailsRef.current = details;

  const hydrateDetails = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    const missing = ids.filter(id => !(id in detailsRef.current));
    if (missing.length === 0) return;
    setLoadingDetail(true);
    fetch("/api/notebook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wordIds: missing }),
    })
      .then(r => r.json())
      .then((data: { words: Word[] }) => {
        setDetails(prev => {
          const next = { ...prev };
          for (const w of data.words) next[w.id] = w;
          return next;
        });
      })
      .catch(() => {})
      .finally(() => setLoadingDetail(false));
  }, []);

  useEffect(() => {
    if (entries.length > 0) hydrateDetails(entries.map(e => e.wordId));
  }, [entries, hydrateDetails]);

  const handleRemove = (wordId: string) => {
    removeWord(wordId);
    setEntries(prev => prev.filter(e => e.wordId !== wordId));
    if (user) {
      fetch(`/api/user/notebook?wordId=${wordId}`, { method: "DELETE", credentials: "include" }).catch(() => {});
    }
  };

  const handleNoteChange = (wordId: string, note: string) => {
    setEntries(prev => prev.map(e => e.wordId === wordId ? { ...e, note } : e));
    if (user) {
      fetch("/api/user/notebook", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wordId, note }),
      }).catch(() => {});
    }
  };

  const filtered = entries.filter(e => {
    if (levelFilter && e.level !== levelFilter) return false;
    if (searchText) {
      const q = searchText.toLowerCase();
      return (
        e.simplified.includes(q) ||
        e.pinyin.toLowerCase().includes(q) ||
        e.meaning.toLowerCase().includes(q) ||
        e.note.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const levelCounts = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.level] = (acc[e.level] ?? 0) + 1;
    return acc;
  }, {});

  if (!mounted) return null;

  return (
    <div style={{ minHeight: "100vh", background: P.bg }}>

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#FFF3B0 0%,#FFFBEA 50%,#FFF8D6 100%)" }}
      >
        <div className="pointer-events-none absolute -top-20 right-1/4 w-72 h-72 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle,#B4530966,transparent 70%)" }} />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 mb-5 text-xs" style={{ color: P.textFaint }}>
            <Link href="/" className="flex items-center gap-1 transition-colors"
              style={{ color: P.textFaint }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = P.text}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = P.textFaint}>
              <Home size={11} /> Trang chủ
            </Link>
            <ChevronRight size={10} />
            <span className="font-medium" style={{ color: P.textMuted }}>Sổ tay</span>
          </nav>

          {/* Title + count */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold mb-1" style={{ color: P.text }}>
                Sổ tay <span style={{ color: "#2563EB" }}>của tôi</span>
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm" style={{ color: P.textMuted }}>
                  {entries.length > 0
                    ? `${entries.length} từ đã lưu · ghi chú cá nhân · ôn tập nhanh`
                    : "Chưa có từ nào. Tra từ và nhấn ★ để lưu vào đây."}
                </p>
                {user ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(37,99,235,0.12)", color: "#2563EB" }}>
                    <Cloud size={10} /> Đồng bộ DB
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{ background: P.surfaceHover, color: P.textMuted }}>
                    <CloudOff size={10} /> Chỉ máy này ·{" "}
                    <Link href="/login" className="underline" style={{ color: "#2563EB" }}>Đăng nhập</Link>{" "}
                    để lưu cloud
                  </span>
                )}
              </div>
            </div>
            {entries.length > 0 && (
              <div
                className="flex-shrink-0 rounded-2xl border px-4 py-2.5 text-center"
                style={{ background: P.surface, borderColor: P.border }}
              >
                <p className="text-2xl font-extrabold leading-none" style={{ color: "#2563EB" }}>{entries.length}</p>
                <p className="text-[10px] mt-0.5" style={{ color: P.textFaint }}>từ đã lưu</p>
              </div>
            )}
          </div>

          {entries.length > 0 && (
            <>
              {/* Search */}
              <div
                className="flex items-center gap-2 rounded-xl border px-3 py-2 mb-3 transition-all"
                style={{ background: P.surface, borderColor: P.border }}
                onFocusCapture={e => (e.currentTarget.style.borderColor = "#B45309")}
                onBlurCapture={e => (e.currentTarget.style.borderColor = P.border)}
              >
                <Search size={15} style={{ color: P.textFaint }} className="flex-shrink-0" />
                <input
                  type="text"
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  placeholder="Tìm trong sổ tay..."
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: P.text, fontFamily: "'Noto Sans SC', Inter, sans-serif" }}
                />
                {searchText && (
                  <button onClick={() => setSearchText("")} style={{ color: P.textFaint }}>
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Level filter */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1 text-xs" style={{ color: P.textFaint }}>
                  <Filter size={11} /> Lọc:
                </span>
                <LevelBtn
                  value="" label={`Tất cả (${entries.length})`}
                  active={levelFilter === ""} accent="#2563EB"
                  onClick={() => setLevelFilter("")}
                />
                {Object.entries(LEVEL_COLORS)
                  .filter(([k]) => levelCounts[k])
                  .map(([k, cfg]) => (
                    <LevelBtn
                      key={k} value={k}
                      label={`${cfg.label} (${levelCounts[k]})`}
                      active={levelFilter === k} accent={cfg.accent}
                      onClick={() => setLevelFilter(levelFilter === k ? "" : k)}
                    />
                  ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ══ CONTENT ══════════════════════════════════════════════════════════ */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">

        {(loadingDetail || syncing) && (
          <div className="flex items-center gap-2 text-xs mb-4" style={{ color: P.textFaint }}>
            <Loader2 size={13} className="animate-spin" />
            {syncing ? "Đang tải từ server..." : "Đang tải chi tiết từ..."}
          </div>
        )}

        {/* Empty state */}
        {entries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
              style={{ background: "rgba(37,99,235,0.1)" }}
            >
              <BookMarked size={36} style={{ color: "#2563EB" }} />
            </div>
            <p className="text-base mb-2 font-semibold" style={{ color: P.textMuted }}>Sổ tay trống</p>
            <p className="text-sm mb-6 max-w-xs leading-relaxed" style={{ color: P.textFaint }}>
              Khi tra từ hoặc học bài, nhấn nút ★ để lưu từ vào đây. Bạn cũng có thể thêm ghi chú cá nhân.
            </p>
            <div className="flex gap-3">
              <Link
                href="/search"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110"
                style={{ background: "linear-gradient(135deg,#2563EB,#7C3AED)" }}
              >
                <Search size={15} /> Tra từ ngay
              </Link>
              <Link
                href="/vocabulary"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all"
                style={{ borderColor: P.border, color: P.textMuted, background: P.surface }}
              >
                <BookOpen size={15} /> Học từ vựng
              </Link>
            </div>
          </div>
        )}

        {entries.length > 0 && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm" style={{ color: P.textMuted }}>Không có từ nào khớp với bộ lọc.</p>
            <button
              onClick={() => { setLevelFilter(""); setSearchText(""); }}
              className="mt-3 text-xs underline transition-colors"
              style={{ color: "#2563EB" }}
            >
              Xóa bộ lọc
            </button>
          </div>
        )}

        {filtered.length > 0 && (levelFilter || searchText) && (
          <p className="text-xs mb-4" style={{ color: P.textFaint }}>
            Hiển thị <span className="font-semibold" style={{ color: P.textMuted }}>{filtered.length}</span> / {entries.length} từ
          </p>
        )}

        {filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map(entry => (
              <NotebookCard
                key={entry.wordId}
                entry={entry}
                detail={details[entry.wordId] ?? null}
                onRemove={handleRemove}
                onNoteChange={handleNoteChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
