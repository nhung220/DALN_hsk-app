"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Lesson, Word } from "@/types/hsk";
import BackButton from "@/components/ui/BackButton";
import ProgressBar from "@/components/ui/ProgressBar";
import { markLessonCompleted, syncLessonProgressToDB } from "@/lib/hskData";
import { ChevronLeft, ChevronRight, RotateCcw, Eye, EyeOff, CheckCircle, Home } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

// ─── Palette ─────────────────────────────────────────────────────────────────
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

interface Props { lesson: Lesson; }
type WritingMode = "practice" | "quiz";

// ─── Tone color ───────────────────────────────────────────────────────────────
function getToneStyle(pinyin: string): string {
  if (/[āēīōūǖ]/.test(pinyin)) return "#C0392B";
  if (/[áéíóúǘ]/.test(pinyin)) return "#B45309";
  if (/[ǎěǐǒǔǚ]/.test(pinyin)) return "#059669";
  if (/[àèìòùǜ]/.test(pinyin)) return "#2563EB";
  return P.textFaint;
}

export default function WritingClient({ lesson }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode]               = useState<WritingMode>("practice");
  const [showHint, setShowHint]       = useState(false);
  const [quizResult, setQuizResult]   = useState<boolean | null>(null);
  const [completed, setCompleted]     = useState<Set<number>>(new Set());

  const currentWord = lesson.words[currentIndex];
  const progress    = (completed.size / lesson.words.length) * 100;

  const handleNext = useCallback(() => {
    setShowHint(false); setQuizResult(null);
    if (currentIndex + 1 < lesson.words.length) setCurrentIndex(i => i + 1);
  }, [currentIndex, lesson.words.length]);

  const handlePrev = useCallback(() => {
    setShowHint(false); setQuizResult(null);
    if (currentIndex > 0) setCurrentIndex(i => i - 1);
  }, [currentIndex]);

  const handleComplete = useCallback(() => {
    setCompleted(s => {
      const next = new Set(s).add(currentIndex);
      if (next.size === lesson.words.length) {
        markLessonCompleted(lesson.id, 100);
        void syncLessonProgressToDB(lesson.id, true, 100);
      }
      return next;
    });
    setTimeout(handleNext, 800);
  }, [currentIndex, handleNext, lesson.id, lesson.words.length]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: P.bg }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="border-b px-4 py-4" style={{ background: P.surface, borderColor: P.border }}>
        <div className="max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 mb-3 text-xs" style={{ color: P.textFaint }}>
            <Link href="/" className="flex items-center gap-1 hover:underline">
              <Home size={11} /> Trang chủ
            </Link>
            <span>/</span>
            <Link href="/vocabulary" className="hover:underline">Từ vựng</Link>
            <span>/</span>
            <Link href={`/vocabulary/lesson/${lesson.id}`} className="hover:underline">
              {lesson.title}
            </Link>
            <span>/</span>
            <span style={{ color: P.textMuted }}>Luyện viết</span>
          </nav>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold" style={{ color: P.text }}>
                Luyện viết · {lesson.title}
              </h1>
              <p className="text-xs mt-0.5" style={{ color: P.textMuted }}>
                Viết theo thứ tự nét · Hanzi Writer
              </p>
            </div>
            <span className="text-sm font-medium" style={{ color: P.textFaint }}>
              {completed.size}/{lesson.words.length}
            </span>
          </div>
          <div className="mt-3">
            <ProgressBar value={progress} color="review" height={5} />
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
        {/* Word selector strip */}
        <div className="flex gap-1.5 mb-6 overflow-x-auto pb-2">
          {lesson.words.map((w, i) => (
            <button
              key={w.id}
              onClick={() => { setCurrentIndex(i); setShowHint(false); setQuizResult(null); }}
              className="hanzi flex-shrink-0 w-10 h-10 rounded-lg text-sm font-bold transition-all"
              style={i === currentIndex
                ? { background: "#B45309", color: "#fff" }
                : completed.has(i)
                ? { background: "#DCFCE7", color: "#059669" }
                : { background: P.surfaceH, color: P.textMuted }}
            >
              {w.simplified.charAt(0)}
            </button>
          ))}
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-6">
          {(["practice", "quiz"] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setQuizResult(null); setShowHint(false); }}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={mode === m
                ? { background: "#B45309", color: "#fff" }
                : { background: P.surfaceH, color: P.textMuted }}
            >
              {m === "practice" ? "Tập viết" : "Kiểm tra nét"}
            </button>
          ))}
        </div>

        {/* Main writing area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: info panel */}
          <div className="rounded-2xl border p-6" style={{ background: P.surface, borderColor: P.border }}>
            <div className="text-center mb-4">
              <p className="hanzi font-bold mb-2"
                style={{ fontSize: "clamp(3.5rem,12vw,5rem)", lineHeight: 1, color: P.text }}>
                {currentWord.simplified}
              </p>
              {currentWord.traditional && currentWord.traditional !== currentWord.simplified && (
                <p className="hanzi text-2xl" style={{ color: P.textFaint }}>
                  {currentWord.traditional}
                </p>
              )}
              <p className="font-semibold mt-2" style={{ color: getToneStyle(currentWord.pinyin) }}>
                {currentWord.pinyin}
              </p>
              <p className="text-sm mt-1 line-clamp-2" style={{ color: P.textMuted }}>
                {currentWord.meaningVi || currentWord.meaning}
              </p>
            </div>

            {/* Radical info */}
            {currentWord.radical && (
              <div className="rounded-xl p-3 text-center mb-4" style={{ background: P.surfaceH }}>
                <p className="text-xs mb-1" style={{ color: P.textFaint }}>Bộ thủ (Radical)</p>
                <p className="hanzi text-3xl font-bold" style={{ color: "#B45309" }}>
                  {currentWord.radical}
                </p>
              </div>
            )}

            {/* Stroke hint toggle */}
            <button
              onClick={() => setShowHint(!showHint)}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition-all border"
              style={{ background: P.surfaceH, borderColor: P.border, color: P.textMuted }}
            >
              {showHint ? <EyeOff size={14} /> : <Eye size={14} />}
              {showHint ? "Ẩn gợi ý" : "Xem gợi ý thứ tự nét"}
            </button>
          </div>

          {/* Right: Hanzi Writer canvas */}
          <HanziWriterPanel
            word={currentWord}
            mode={mode}
            showHint={showHint}
            onComplete={handleComplete}
            quizResult={quizResult}
            setQuizResult={setQuizResult}
          />
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all disabled:opacity-30"
            style={{ background: P.surfaceH, color: P.textMuted }}
          >
            <ChevronLeft size={16} /> Trước
          </button>

          <div className="flex items-center gap-3">
            {completed.has(currentIndex) && (
              <span className="flex items-center gap-1 text-sm" style={{ color: "#059669" }}>
                <CheckCircle size={16} /> Đã viết xong
              </span>
            )}
          </div>

          <button
            onClick={handleNext}
            disabled={currentIndex === lesson.words.length - 1}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-30 hover:brightness-110"
            style={{ background: "linear-gradient(135deg,#B45309,#D97706)" }}
          >
            Tiếp <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── HanziWriterPanel ─────────────────────────────────────────────────────────
interface HanziPanelProps {
  word: Word; mode: WritingMode; showHint: boolean;
  onComplete: () => void; quizResult: boolean | null; setQuizResult: (r: boolean | null) => void;
}

function HanziWriterPanel({ word, mode, showHint, onComplete, quizResult, setQuizResult }: HanziPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const writerRef    = useRef<unknown>(null);
  const [writerReady, setWriterReady] = useState(false);

  const startQuiz = useCallback((writer: any) => {
    setQuizResult(null);
    writer.quiz({
      onMistake: () => {},
      onCorrectStroke: () => {},
      onComplete: (summary: any) => {
        const ok = summary.totalMistakes < 3;
        setQuizResult(ok);
        if (ok) onComplete();
      },
    });
  }, [onComplete, setQuizResult]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    setWriterReady(false);

    import("hanzi-writer").then(mod => {
      if (cancelled || !containerRef.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const HanziWriter = (mod.default ?? mod) as any;
      containerRef.current.innerHTML = "";
      const char = word.simplified.charAt(0);
      try {
        const writer = HanziWriter.create(containerRef.current, char, {
          width: 260, height: 260, padding: 10,
          showOutline: true,
          strokeColor:     "#B45309",
          outlineColor:    "#E8D98A",
          drawingColor:    "#1C1408",
          drawingWidth:    4,
          showCharacter:   showHint,
          strokeAnimationSpeed: 1,
          delayBetweenStrokes: 200,
          radicalColor:    "#059669",
          // light background for the canvas
          strokeFadeDuration: 400,
        });
        writerRef.current = writer;
        setWriterReady(true);

        // Mỗi chế độ bắt đầu ngay, không bắt người học nhấn thêm một nút.
        if (mode === "practice") writer.animateCharacter();
        else startQuiz(writer);
      } catch { /* char data not found */ }
    }).catch(() => {});

    return () => {
      cancelled = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (writerRef.current as any)?.cancelQuiz?.();
    };
  }, [word.simplified, showHint, mode, startQuiz]);

  const handleAnimate = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (writerRef.current as any)?.animateCharacter?.();
  };

  const handleStartQuiz = () => {
    if (!writerRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    startQuiz(writerRef.current as any);
  };

  const handleReset = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = writerRef.current as any;
    w?.cancelQuiz?.();
    w?.hideCharacter?.();
    setQuizResult(null);
    if (mode === "practice") w?.animateCharacter?.();
    else if (w) startQuiz(w);
  };

  return (
    <div className="rounded-2xl border p-6 flex flex-col items-center" style={{ background: P.surface, borderColor: P.border }}>
      {/* Grid overlay */}
      <div className="relative">
        <svg width={280} height={280} className="absolute opacity-10" style={{ left: -10, top: -10, pointerEvents: "none" }}>
          <line x1="140" y1="0"   x2="140" y2="280" stroke={P.textFaint} strokeWidth="1" strokeDasharray="4,4" />
          <line x1="0"   y1="140" x2="280" y2="140" stroke={P.textFaint} strokeWidth="1" strokeDasharray="4,4" />
          <rect x="0"    y="0"    width="280"        height="280" fill="none" stroke={P.textFaint} strokeWidth="1" />
        </svg>
        <div ref={containerRef} style={{ width: 260, height: 260 }} />
      </div>

      {/* Quiz result */}
      {quizResult !== null && (
        <div
          className="mt-3 px-4 py-2 rounded-lg text-sm font-medium"
          style={quizResult
            ? { background: "#DCFCE7", color: "#059669" }
            : { background: "#FEE2E2", color: "#C0392B" }}
        >
          {quizResult ? "✓ Xuất sắc! Thứ tự nét đúng" : "✗ Thứ tự nét chưa đúng, thử lại"}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 mt-4 flex-wrap justify-center">
        {writerReady ? (
          <>
            <button
              onClick={handleAnimate}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:brightness-95"
              style={{ background: "#EDE9FF", color: "#6C3CE1" }}
            >
              Xem thứ tự nét
            </button>
            {mode === "quiz" && (
              <button
                onClick={handleStartQuiz}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:brightness-95"
                style={{ background: "#DCFCE7", color: "#059669" }}
              >
                Tự viết
              </button>
            )}
            <button
              onClick={handleReset}
              className="px-3 py-2 rounded-lg text-sm transition-all border"
              style={{ background: P.surfaceH, borderColor: P.border, color: P.textMuted }}
            >
              <RotateCcw size={14} />
            </button>
          </>
        ) : (
          <p className="text-sm animate-pulse" style={{ color: P.textFaint }}>Đang tải dữ liệu chữ...</p>
        )}
      </div>
      <p className="text-xs mt-3 text-center" style={{ color: P.textFaint }}>
        Powered by Hanzi Writer · Khớp nét chữ
      </p>
    </div>
  );
}
