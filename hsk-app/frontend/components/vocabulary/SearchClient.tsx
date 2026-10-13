"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Search, X, Volume2, Home, ChevronRight,
  Filter, Loader2, BookOpen, AlertCircle, Star,
} from "lucide-react";
import type { Word } from "@/types/hsk";
import { saveWord, removeWord, isWordSaved } from "@/lib/notebookData";
import { useAuth } from "@/components/auth/AuthProvider";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg:        "#FFFBEA",
  surface:   "#FFFDF0",
  border:    "#E8D98A",
  borderHov: "#D4B96A",
  text:      "#1C1408",
  textSub:   "#78614A",
  textMuted: "#A08060",
  primary:   "#B45309",
  primaryBg: "#FEF3C7",
};

// ─── Constants ────────────────────────────────────────────────────────────────
const LEVEL_COLORS: Record<string, { accent: string; bg: string; label: string }> = {
  "new-1": { accent: "#2563EB", bg: "#EFF6FF",  label: "HSK 1" },
  "new-2": { accent: "#0EA5E9", bg: "#F0F9FF",  label: "HSK 2" },
  "new-3": { accent: "#7C3AED", bg: "#F5F3FF",  label: "HSK 3" },
  "new-4": { accent: "#16A34A", bg: "#F0FDF4",  label: "HSK 4" },
  "new-5": { accent: "#B45309", bg: "#FFFBEB",  label: "HSK 5" },
  "new-6": { accent: "#EA580C", bg: "#FFF7ED",  label: "HSK 6" },
  "new-7": { accent: "#DC2626", bg: "#FEF2F2",  label: "HSK 7" },
};

const POS_LABELS: Record<string, string> = {
  n: "danh từ", v: "động từ", adj: "tính từ", adv: "trạng từ",
  prep: "giới từ", conj: "liên từ", u: "trợ từ", num: "số từ",
  m: "lượng từ", pron: "đại từ", inter: "thán từ", prop: "danh từ riêng",
};

// ─── Audio helper ─────────────────────────────────────────────────────────────
function playAudio(audioUrl: string) {
  if (typeof window === "undefined") return;
  const audio = new Audio(audioUrl);
  audio.play().catch(() => {});
}

// ─── SaveButton ───────────────────────────────────────────────────────────────
function SaveButton({ word }: { word: Word }) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  useEffect(() => { setSaved(isWordSaved(word.id)); }, [word.id]);

  const toggle = () => {
    if (saved) {
      removeWord(word.id);
      setSaved(false);
      if (user) {
        fetch(`/api/user/notebook?wordId=${encodeURIComponent(word.id)}`, {
          method: "DELETE", credentials: "include",
        }).catch(() => {});
      }
    } else {
      const entry = { wordId: word.id, level: word.level, simplified: word.simplified, pinyin: word.pinyin, meaning: word.meaning };
      saveWord(entry);
      setSaved(true);
      if (user) {
        fetch("/api/user/notebook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(entry),
        }).catch(() => {});
      }
    }
  };

  return (
    <button onClick={toggle} title={saved ? "Bỏ lưu" : "Lưu vào sổ tay"}
      className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110 flex-shrink-0"
      style={saved
        ? { background: "#FEF3C7", color: "#B45309" }
        : { background: "#F5E9C0", color: "#A08060" }}>
      <Star size={14} fill={saved ? "#B45309" : "none"} />
    </button>
  );
}

// ─── WordCard ─────────────────────────────────────────────────────────────────
function WordCard({ word }: { word: Word }) {
  const cfg = LEVEL_COLORS[word.level] ?? LEVEL_COLORS["new-1"];

  return (
    <div className="rounded-2xl border p-4 sm:p-5 transition-all hover:scale-[1.01] hover:shadow-md"
      style={{ background: C.surface, borderColor: C.border }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = cfg.accent + "80";
        (e.currentTarget as HTMLElement).style.background  = cfg.bg;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = C.border;
        (e.currentTarget as HTMLElement).style.background  = C.surface;
      }}>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-4xl sm:text-5xl font-black leading-none flex-shrink-0"
            style={{ fontFamily: "'Noto Sans SC', sans-serif", color: C.text }}>
            {word.simplified}
          </span>
          <div className="min-w-0">
            <p className="text-lg font-semibold" style={{ color: cfg.accent }}>{word.pinyin}</p>
            {word.traditional && word.traditional !== word.simplified && (
              <p className="text-xs mt-0.5" style={{ color: C.textMuted }}>
                Phồn thể: <span style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>{word.traditional}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
            style={{ background: cfg.bg, color: cfg.accent, border: `1px solid ${cfg.accent}40` }}>
            {cfg.label}
          </span>
          {word.audioUrl && (
            <button onClick={() => playAudio(word.audioUrl)}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110"
              style={{ background: cfg.bg, color: cfg.accent }} title="Phát âm">
              <Volume2 size={14} />
            </button>
          )}
          <SaveButton word={word} />
        </div>
      </div>

      {/* POS tags */}
      {word.pos.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {word.pos.map((p) => (
            <span key={p.code} className="text-[10px] font-medium px-2 py-0.5 rounded-md"
              style={{ background: "#F5E9C0", color: C.textSub }}>
              {POS_LABELS[p.code] ?? p.label}
            </span>
          ))}
        </div>
      )}

      {/* Nghĩa Việt */}
      {word.meaningVi && (
        <p className="text-sm font-semibold mb-1" style={{ color: C.text }}>{word.meaningVi}</p>
      )}

      {/* Nghĩa Anh */}
      <div className="space-y-0.5">
        {word.meanings.slice(0, 3).map((m, i) => (
          <p key={i} className="text-xs leading-relaxed" style={{ color: C.textSub }}>
            {word.meanings.length > 1 && <span className="mr-1" style={{ color: C.textMuted }}>{i + 1}.</span>}
            {m}
          </p>
        ))}
        {word.meanings.length > 3 && (
          <p className="text-[11px] italic" style={{ color: C.textMuted }}>+{word.meanings.length - 3} nghĩa khác</p>
        )}
      </div>

      {/* Bộ thủ */}
      {word.radical && (
        <div className="mt-3 pt-3 border-t flex items-center gap-3" style={{ borderColor: C.border }}>
          <span className="text-[11px]" style={{ color: C.textMuted }}>Bộ thủ:</span>
          <span className="text-base font-bold"
            style={{ fontFamily: "'Noto Sans SC', sans-serif", color: C.textSub }}>
            {word.radical}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Level filter button ──────────────────────────────────────────────────────
function LevelBtn({ value, label, active, accent, bg, onClick }:
  { value: string; label: string; active: boolean; accent: string; bg: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all border"
      style={active
        ? { background: accent, color: "#fff", borderColor: accent }
        : { background: C.surface, color: C.textSub, borderColor: C.border }}>
      {label}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SearchClient({ initialQuery = "" }: { initialQuery?: string }) {
  const [query,       setQuery]       = useState(initialQuery);
  const [levelFilter, setLevelFilter] = useState("");
  const [results,     setResults]     = useState<Word[]>([]);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [searched,    setSearched]    = useState(false);

  const inputRef    = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string, level: string) => {
    if (!q.trim()) { setResults([]); setTotal(0); setSearched(false); return; }
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ q });
      if (level) params.set("level", level.replace("new-", ""));
      const res  = await fetch(`/api/search?${params}`);
      if (!res.ok) throw new Error("Lỗi máy chủ");
      const data = await res.json() as { results: Word[]; total: number };
      setResults(data.results); setTotal(data.total); setSearched(true);
    } catch { setError("Không thể kết nối. Vui lòng thử lại."); }
    finally   { setLoading(false); }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { doSearch(query, levelFilter); }, 280);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, levelFilter, doSearch]);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { if (initialQuery) doSearch(initialQuery, ""); }, []); // eslint-disable-line

  const clearQuery = () => {
    setQuery(""); setResults([]); setTotal(0); setSearched(false);
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.bg }}>

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <div style={{ background: "linear-gradient(135deg,#FFF8D0 0%,#FFF3A0 50%,#FFEDB0 100%)" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 mb-5 text-xs" style={{ color: C.textMuted }}>
            <Link href="/" className="flex items-center gap-1 hover:opacity-70 transition-opacity">
              <Home size={11} /> Trang chủ
            </Link>
            <ChevronRight size={10} />
            <span className="font-medium" style={{ color: C.text }}>Tra từ</span>
          </nav>

          {/* Title */}
          <div className="mb-5">
            <h1 className="text-2xl sm:text-3xl font-extrabold mb-1" style={{ color: C.text }}>
              Tra từ <span style={{ color: C.primary }}>HSK 3.0</span>
            </h1>
            <p className="text-sm" style={{ color: C.textSub }}>
              Tìm theo chữ Hán, pinyin hoặc nghĩa. Toàn bộ 10.900+ từ HSK 1–7.
            </p>
          </div>

          {/* Search box */}
          <div className="flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all shadow-sm"
            style={{ background: "#FFFDF0", borderColor: C.border }}
            onFocusCapture={e => {
              (e.currentTarget as HTMLElement).style.borderColor = C.primary;
              (e.currentTarget as HTMLElement).style.boxShadow  = `0 0 0 3px ${C.primary}22`;
            }}
            onBlurCapture={e => {
              (e.currentTarget as HTMLElement).style.borderColor = C.border;
              (e.currentTarget as HTMLElement).style.boxShadow  = "0 1px 2px rgba(0,0,0,0.05)";
            }}>
            {loading
              ? <Loader2 size={18} className="animate-spin flex-shrink-0" style={{ color: C.primary }} />
              : <Search size={18} className="flex-shrink-0" style={{ color: C.textMuted }} />}

            <input ref={inputRef} type="text" value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ví dụ: 你好, nihao, xin chào..."
              className="flex-1 bg-transparent outline-none text-base"
              style={{ color: C.text, fontFamily: "'Noto Sans SC', Inter, sans-serif" }}
              autoComplete="off" spellCheck={false} />

            {query && (
              <button onClick={clearQuery}
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all"
                style={{ color: C.textMuted, background: "#F5E9C0" }}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Level filters */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="flex items-center gap-1 text-xs mr-1" style={{ color: C.textMuted }}>
              <Filter size={11} /> Lọc cấp:
            </span>
            <LevelBtn value="" label="Tất cả" active={levelFilter === ""}
              accent={C.primary} bg={C.primaryBg}
              onClick={() => setLevelFilter("")} />
            {Object.entries(LEVEL_COLORS).map(([key, cfg]) => (
              <LevelBtn key={key} value={key} label={cfg.label}
                active={levelFilter === key} accent={cfg.accent} bg={cfg.bg}
                onClick={() => setLevelFilter(levelFilter === key ? "" : key)} />
            ))}
          </div>
        </div>
      </div>

      {/* ══ RESULTS ══════════════════════════════════════════════════════════ */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-600 mb-4">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {/* Count bar */}
        {searched && !loading && !error && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm" style={{ color: C.textSub }}>
              {total === 0
                ? `Không tìm thấy kết quả cho "${query}"`
                : <>Tìm thấy <span className="font-semibold" style={{ color: C.text }}>{total}</span> từ
                    {total > results.length && <> · hiển thị <span className="font-semibold" style={{ color: C.text }}>{results.length}</span></>}
                  </>}
            </p>
            {total > 0 && levelFilter && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: LEVEL_COLORS[levelFilter]?.bg, color: LEVEL_COLORS[levelFilter]?.accent }}>
                {LEVEL_COLORS[levelFilter]?.label}
              </span>
            )}
          </div>
        )}

        {/* Empty state */}
        {!searched && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: C.primaryBg }}>
              <BookOpen size={28} style={{ color: C.primary }} />
            </div>
            <p className="text-sm mb-1" style={{ color: C.textSub }}>Nhập từ để tra cứu</p>
            <p className="text-xs" style={{ color: C.textMuted }}>
              Hỗ trợ chữ Hán giản thể, <span style={{ color: C.primary }}>phồn thể</span>, pinyin và nghĩa tiếng Việt / tiếng Anh
            </p>
          </div>
        )}

        {/* No results */}
        {searched && !loading && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "#FEF2F2" }}>
              <Search size={28} style={{ color: "#DC2626" }} />
            </div>
            <p className="text-sm mb-1" style={{ color: C.textSub }}>Không tìm thấy "{query}"</p>
            <p className="text-xs" style={{ color: C.textMuted }}>Thử tìm bằng chữ Hán, pinyin hoặc nghĩa khác</p>
          </div>
        )}

        {/* Results grid */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {results.map((word) => <WordCard key={word.id} word={word} />)}
          </div>
        )}

        {/* More hint */}
        {total > results.length && (
          <p className="text-center text-xs mt-6" style={{ color: C.textMuted }}>
            Chỉ hiển thị {results.length}/{total} kết quả. Hãy nhập chi tiết hơn để thu hẹp kết quả.
          </p>
        )}
      </div>
    </div>
  );
}
