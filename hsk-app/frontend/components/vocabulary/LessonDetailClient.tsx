"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import type { Lesson, Word } from "@/types/hsk";
import BackButton from "@/components/ui/BackButton";
import Badge from "@/components/ui/Badge";
import { isLessonUnlocked, getSetForLesson, PASS_THRESHOLD, loadGateStore, type GateEntry } from "@/lib/hskData";
import { saveWord, removeWord, isWordSaved } from "@/lib/notebookData";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  Volume2, ChevronLeft, ChevronRight, Zap, PenTool, Gamepad2,
  Lock, ClipboardCheck, Star, Home,
} from "lucide-react";
import clsx from "clsx";

// ─── Palette (light / warm-yellow theme) ─────────────────────────────────────
const P = {
  bg:          "#FFFBEA",
  surface:     "#FFF8D6",
  surfaceH:    "#FFF3B0",
  border:      "#E8D98A",
  borderLight: "#F0E9B8",
  text:        "#1C1408",
  textMuted:   "#78614A",
  textFaint:   "#A8956A",
};

interface Props {
  lesson: Lesson;
}

// ─── Tone color ───────────────────────────────────────────────────────────────
function getToneStyle(pinyin: string): string {
  if (/[āēīōūǖ]/.test(pinyin)) return "#C0392B";
  if (/[áéíóúǘ]/.test(pinyin)) return "#B45309";
  if (/[ǎěǐǒǔǚ]/.test(pinyin)) return "#059669";
  if (/[àèìòùǜ]/.test(pinyin)) return "#2563EB";
  return P.textFaint;
}

export default function LessonDetailClient({ lesson }: Props) {
  const { user, loading: authLoading } = useAuth();
  const [activeWord, setActiveWord] = useState<Word | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "study">("grid");
  const [studyIndex, setStudyIndex] = useState(0);
  const [revealMeaning, setRevealMeaning] = useState(false);
  // Dùng null = "chưa biết" để tránh flicker — check sau khi mount
  const [locked, setLocked] = useState<boolean | null>(null);

  const match    = lesson.id.match(/^new-(\d+)-lesson-(\d+)$/);
  const levelNum  = match ? parseInt(match[1]) : 1;
  const lessonNum = match ? parseInt(match[2]) : 1;
  const setNum    = getSetForLesson(lessonNum);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    setLocked(null);
    async function loadAccess() {
      let store = loadGateStore();
      if (user) {
        try {
          const response = await fetch("/api/progress/gate", { credentials: "include" });
          if (!response.ok) throw new Error("Cannot load gate progress");
          const data = await response.json() as { gates: Array<GateEntry & { setId: string }> };
          store = Object.fromEntries(data.gates.map(({ setId, ...entry }) => [setId, entry]));
        } catch { /* use the cached gates while offline */ }
      }
      if (!cancelled) setLocked(!isLessonUnlocked(levelNum, lessonNum, store));
    }
    void loadAccess();
    return () => { cancelled = true; };
  }, [levelNum, lessonNum, user, authLoading]);

  // ── Hooks phải khai báo TRƯỚC mọi conditional return ─────────────────────
  const handleStudyNext = useCallback(() => {
    setRevealMeaning(false);
    setStudyIndex(i => (i + 1) % lesson.words.length);
  }, [lesson.words.length]);

  const handleStudyPrev = useCallback(() => {
    setRevealMeaning(false);
    setStudyIndex(i => (i - 1 + lesson.words.length) % lesson.words.length);
  }, [lesson.words.length]);

  const playAudio = useCallback((word: Word) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(word.simplified);
      utt.lang = "zh-CN"; utt.rate = 0.85;
      window.speechSynthesis.speak(utt);
    }
  }, []);

  // ── Tự động phát audio khi chuyển sang từ mới trong study mode ───────────
  useEffect(() => {
    if (viewMode === "study" && lesson.words[studyIndex]) {
      // Delay nhỏ để tránh phát ngay khi đổi viewMode
      const t = setTimeout(() => playAudio(lesson.words[studyIndex]), 300);
      return () => clearTimeout(t);
    }
  }, [studyIndex, viewMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Chưa biết trạng thái lock (chờ mount) ────────────────────────────────
  if (locked === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: P.bg }}>
        <div className="text-sm animate-pulse" style={{ color: P.textMuted }}>Đang tải...</div>
      </div>
    );
  }

  // ── Gate screen ───────────────────────────────────────────────────────────
  if (locked) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: P.bg }}>
        <div className="border-b px-4 py-4" style={{ background: P.surface, borderColor: P.border }}>
          <div className="max-w-2xl mx-auto">
            <BackButton href="/vocabulary" />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="rounded-2xl border max-w-sm w-full text-center p-8"
            style={{ background: P.surface, borderColor: P.border }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: P.surfaceH }}>
              <Lock size={28} style={{ color: P.textFaint }} />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: P.text }}>
              Bài {lessonNum} đang bị khóa
            </h2>
            <p className="text-sm mb-6 leading-relaxed" style={{ color: P.textMuted }}>
              Hoàn thành bài kiểm tra nhóm {setNum - 1} với điểm ≥{PASS_THRESHOLD}%
              để mở khóa nhóm {setNum} (bài {(setNum - 1) * 3 + 1}–{setNum * 3}).
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href={`/vocabulary/test/new-${levelNum}-set-${setNum - 1}`}
                className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all hover:brightness-110"
                style={{ background: "linear-gradient(135deg,#B45309,#D97706)", color: "#fff" }}
              >
                <ClipboardCheck size={15} /> Làm bài kiểm tra nhóm {setNum - 1}
              </Link>
              <Link
                href="/vocabulary"
                className="py-2.5 rounded-xl text-sm transition-colors"
                style={{ color: P.textMuted, border: `1px solid ${P.border}` }}
              >
                ← Quay lại danh sách
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: P.bg }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="border-b px-4 py-4" style={{ background: P.surface, borderColor: P.border }}>
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 mb-3 text-xs" style={{ color: P.textFaint }}>
            <Link href="/" className="flex items-center gap-1 hover:underline">
              <Home size={11} /> Trang chủ
            </Link>
            <span>/</span>
            <Link href="/vocabulary" className="hover:underline">Từ vựng</Link>
            <span>/</span>
            <span style={{ color: P.textMuted }}>{lesson.title}</span>
          </nav>

          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold" style={{ color: P.text }}>{lesson.title}</h1>
              <p className="text-sm mt-0.5" style={{ color: P.textMuted }}>
                {lesson.description} · Level {lesson.level.replace("new-", "HSK ")}
              </p>
            </div>
            {/* Quick nav */}
            <div className="flex gap-2 flex-wrap">
              <Link
                href={`/vocabulary/flashcard/${lesson.id}`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:brightness-95"
                style={{ background: "#EDE9FF", color: "#6C3CE1" }}
              >
                <Zap size={14} /> Flashcard
              </Link>
              <Link
                href={`/vocabulary/writing/${lesson.id}`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all border"
                style={{ background: P.surfaceH, borderColor: P.border, color: P.textMuted }}
              >
                <PenTool size={14} /> Viết
              </Link>
              <Link
                href={`/vocabulary/game/${lesson.id}`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all border"
                style={{ background: P.surfaceH, borderColor: P.border, color: P.textMuted }}
              >
                <Gamepad2 size={14} /> Game
              </Link>
            </div>
          </div>

          {/* View mode toggle */}
          <div className="flex gap-2 mt-4">
            {(["grid", "study"] as const).map(m => (
              <button
                key={m}
                onClick={() => { setViewMode(m); setStudyIndex(0); setRevealMeaning(false); }}
                className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={viewMode === m
                  ? { background: "#B45309", color: "#fff" }
                  : { background: P.surfaceH, color: P.textMuted }}
              >
                {m === "grid" ? "Danh sách" : "Học từng từ"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {lesson.words.map((word, idx) => (
              <WordRow
                key={word.id}
                word={word}
                index={idx + 1}
                isActive={activeWord?.id === word.id}
                onSelect={() => setActiveWord(activeWord?.id === word.id ? null : word)}
                onPlay={() => playAudio(word)}
              />
            ))}
          </div>
        ) : (
          <StudyMode
            word={lesson.words[studyIndex]}
            index={studyIndex}
            total={lesson.words.length}
            revealed={revealMeaning}
            onReveal={() => setRevealMeaning(true)}
            onPrev={handleStudyPrev}
            onNext={handleStudyNext}
            onPlay={playAudio}
          />
        )}
      </div>
    </div>
  );
}

// ─── WordSaveBtn ──────────────────────────────────────────────────────────────
function WordSaveBtn({ word }: { word: Word }) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  useEffect(() => { setSaved(isWordSaved(word.id)); }, [word.id]);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
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
    <button
      onClick={toggle}
      title={saved ? "Bỏ lưu" : "Lưu vào sổ tay"}
      className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110"
      style={saved
        ? { background: "rgba(251,191,36,0.22)", color: "#FBBF24" }
        : { background: P.surfaceH, color: P.textFaint }}
    >
      <Star size={13} fill={saved ? "#FBBF24" : "none"} />
    </button>
  );
}

// ─── WordRow ──────────────────────────────────────────────────────────────────
function WordRow({
  word, index, isActive, onSelect, onPlay,
}: {
  word: Word; index: number; isActive: boolean; onSelect: () => void; onPlay: () => void;
}) {
  return (
    <div
      className="rounded-xl border p-3 cursor-pointer transition-all"
      style={{
        background:   isActive ? P.surfaceH : P.surface,
        borderColor:  isActive ? "#B45309" : P.border,
        boxShadow:    isActive ? "0 0 0 1px #B4530930" : "none",
      }}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        <span className="text-xs w-5 flex-shrink-0 mt-1" style={{ color: P.textFaint }}>{index}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="hanzi text-2xl font-bold" style={{ color: P.text }}>
              {word.simplified}
            </span>
            {word.traditional && word.traditional !== word.simplified && (
              <span className="hanzi text-base" style={{ color: P.textFaint }}>
                {word.traditional}
              </span>
            )}
            <div className="ml-auto flex items-center gap-1.5">
              <button
                onClick={e => { e.stopPropagation(); onPlay(); }}
                className="transition-colors"
                style={{ color: P.textFaint }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#7C3AED"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = P.textFaint}
              >
                <Volume2 size={15} />
              </button>
              <WordSaveBtn word={word} />
            </div>
          </div>

          <p className="text-sm font-medium" style={{ color: getToneStyle(word.pinyin) }}>
            {word.pinyin}
          </p>
          <p className="text-sm mt-0.5 line-clamp-1" style={{ color: P.textMuted }}>
            {word.meaningVi || word.meaning}
          </p>

          {/* Expanded */}
          {isActive && (
            <div className="mt-3 space-y-1.5 border-t pt-2.5" style={{ borderColor: P.borderLight }}>
              {word.meanings.slice(0, 4).map((m, i) => (
                <p key={i} className="text-sm" style={{ color: P.textMuted }}>
                  <span style={{ color: P.textFaint, marginRight: 4 }}>{i + 1}.</span>
                  {m}
                </p>
              ))}
              {word.pos?.length > 0 && (
                <div className="flex gap-1 flex-wrap mt-1.5">
                  {word.pos.map(p => (
                    <Badge key={p.code} variant="primary" size="sm">{p.code} · {p.label}</Badge>
                  ))}
                </div>
              )}
              {word.classifiers?.length > 0 && (
                <p className="text-xs" style={{ color: P.textFaint }}>
                  Lượng từ: <span className="hanzi">{word.classifiers.join("、")}</span>
                </p>
              )}
              {word.radical && (
                <p className="text-xs" style={{ color: P.textFaint }}>
                  Bộ thủ: <span className="hanzi font-bold text-sm" style={{ color: P.text }}>{word.radical}</span>
                  {" "}· Tần suất: #{word.frequency}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── StudyMode ────────────────────────────────────────────────────────────────
function StudyMode({
  word, index, total, revealed, onReveal, onPrev, onNext, onPlay,
}: {
  word: Word; index: number; total: number; revealed: boolean;
  onReveal: () => void; onPrev: () => void; onNext: () => void; onPlay: (w: Word) => void;
}) {
  return (
    <div className="flex flex-col items-center">
      <p className="text-sm mb-4" style={{ color: P.textFaint }}>{index + 1} / {total}</p>

      <div className="w-full max-w-lg rounded-2xl border p-10 text-center"
        style={{ background: P.surface, borderColor: P.border }}>

        {/* POS badges */}
        {word.pos?.length > 0 && (
          <div className="flex justify-center gap-2 mb-3">
            {word.pos.slice(0, 2).map(p => (
              <Badge key={p.code} variant="primary">{p.code}</Badge>
            ))}
          </div>
        )}

        {/* Hanzi */}
        <p className="hanzi font-bold mb-3"
          style={{ fontSize: "clamp(4rem,15vw,5.5rem)", lineHeight: 1, color: P.text }}>
          {word.simplified}
        </p>
        {word.traditional && word.traditional !== word.simplified && (
          <p className="hanzi text-2xl mb-1" style={{ color: P.textFaint }}>{word.traditional}</p>
        )}

        {/* Pinyin */}
        <p className="text-xl font-semibold mb-4" style={{ color: getToneStyle(word.pinyin) }}>
          {word.pinyin}
        </p>

        {/* Audio + Save */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <button
            onClick={() => onPlay(word)}
            className="transition-colors"
            style={{ color: P.textFaint }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#7C3AED"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = P.textFaint}
          >
            <Volume2 size={22} />
          </button>
          <WordSaveBtn word={word} />
        </div>

        {/* Meaning */}
        {!revealed ? (
          <button
            onClick={onReveal}
            className="px-6 py-2.5 rounded-xl text-sm border border-dashed transition-all"
            style={{ borderColor: P.border, color: P.textFaint }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#B45309"; (e.currentTarget as HTMLElement).style.color = "#B45309"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = P.border; (e.currentTarget as HTMLElement).style.color = P.textFaint; }}
          >
            Xem nghĩa
          </button>
        ) : (
          <div>
            {word.meaningVi && (
              <p className="font-bold text-base mb-3" style={{ color: P.text }}>{word.meaningVi}</p>
            )}
            <div className="space-y-1 mb-3">
              {word.meanings.slice(0, 3).map((m, i) => (
                <p key={i} className="text-sm" style={{ color: P.textMuted }}>
                  {i === 0 && <span style={{ color: "#7C3AED", marginRight: 4 }}>▸</span>}
                  {m}
                </p>
              ))}
            </div>
            {word.classifiers?.length > 0 && (
              <p className="text-xs" style={{ color: P.textFaint }}>
                量: <span className="hanzi">{word.classifiers.join("、")}</span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-4 mt-6">
        <button
          onClick={onPrev}
          className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm transition-all"
          style={{ background: P.surfaceH, color: P.textMuted }}
        >
          <ChevronLeft size={16} /> Trước
        </button>
        <button
          onClick={onNext}
          className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all hover:brightness-110"
          style={{ background: "linear-gradient(135deg,#B45309,#D97706)" }}
        >
          Tiếp <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
