"use client";

import { useState, useEffect, useCallback } from "react";
import type { Lesson, Word } from "@/types/hsk";
import type { SM2Card, SM2Quality } from "@/lib/hskData";
import {
  sm2Update, createNewCard, loadProgress, saveProgress,
  markLessonCompleted, syncLessonProgressToDB, localDateKey,
} from "@/lib/hskData";
import ProgressBar from "@/components/ui/ProgressBar";
import { Volume2, RotateCcw, CheckCircle, Home } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";

// ─── Palette ─────────────────────────────────────────────────────────────────
const P = {
  bg:          "#FFFBEA",
  surface:     "#FFF8D6",
  surfaceH:    "#FFF3B0",
  border:      "#E8D98A",
  text:        "#1C1408",
  textMuted:   "#78614A",
  textFaint:   "#A8956A",
};

interface Props { lesson: Lesson; }
type SessionState = "studying" | "done";

// ─── Tone color ───────────────────────────────────────────────────────────────
function getToneStyle(pinyin: string): string {
  if (/[āēīōūǖ]/.test(pinyin)) return "#C0392B";
  if (/[áéíóúǘ]/.test(pinyin)) return "#B45309";
  if (/[ǎěǐǒǔǚ]/.test(pinyin)) return "#059669";
  if (/[àèìòùǜ]/.test(pinyin)) return "#2563EB";
  return P.textFaint;
}

async function syncCardToDB(card: SM2Card) {
  try {
    await fetch("/api/progress/flashcard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(card),
    });
  } catch { /* offline */ }
}

export default function FlashcardClient({ lesson }: Props) {
  const { user, loading: authLoading } = useAuth();
  const [cards, setCards]           = useState<Record<string, SM2Card>>({});
  const [queue, setQueue]           = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped]       = useState(false);
  const [sessionState, setSessionState] = useState<SessionState>("studying");
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0 });
  const [loaded, setLoaded]             = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    setLoaded(false);
    setLoadError(false);
    async function load() {
      try {
        let saved = loadProgress();
        const loadCloud = async () => {
          const response = await fetch("/api/progress/flashcard", { credentials: "include" });
          if (!response.ok) throw new Error("Cannot load flashcard progress");
          const data = await response.json() as { cards: SM2Card[] };
          return Object.fromEntries(data.cards.map(card => [card.wordId, card]));
        };
        if (user) saved = await loadCloud();
        if (cancelled) return;

        const newOnly = lesson.words.filter(word => !saved[word.id]).map(word => createNewCard(word.id));
        if (user && newOnly.length > 0) {
          const response = await fetch("/api/progress/flashcard/bulk", {
            method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
            body: JSON.stringify({ cards: newOnly }),
          });
          if (!response.ok) throw new Error("Cannot initialize flashcards");
          // Read back the winning DB state if another device initialized a card.
          saved = await loadCloud();
        } else {
          for (const card of newOnly) saved[card.wordId] = card;
        }
        if (cancelled) return;
        saveProgress(saved);
        setCards(saved);
        const today = localDateKey();
        setQueue(lesson.words.filter(word => saved[word.id]?.nextReview <= today));
        setCurrentIndex(0);
        setFlipped(false);
        setSessionState("studying");
        setSessionStats({ reviewed: 0, correct: 0 });
        setLoaded(true);
      } catch {
        if (!cancelled) setLoadError(true);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [lesson.words, user, authLoading, retry]);

  const currentWord = queue[currentIndex];

  const playAudio = (word: Word) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(word.simplified);
      utt.lang = "zh-CN"; utt.rate = 0.85;
      window.speechSynthesis.speak(utt);
    }
  };

  useEffect(() => {
    if (!currentWord || sessionState !== "studying") return;
    const timer = window.setTimeout(() => playAudio(currentWord), 150);
    return () => {
      window.clearTimeout(timer);
      window.speechSynthesis?.cancel();
    };
  }, [currentWord, sessionState]);

  const handleRate = useCallback((quality: SM2Quality) => {
    if (!currentWord) return;
    const existing = cards[currentWord.id] ?? createNewCard(currentWord.id);
    const updated  = sm2Update(existing, quality);
    const newCards = { ...cards, [currentWord.id]: updated };
    setCards(newCards);
    saveProgress(newCards);
    if (user) void syncCardToDB(updated);

    const isCorrect = quality >= 3;
    setSessionStats(s => ({ reviewed: s.reviewed + 1, correct: s.correct + (isCorrect ? 1 : 0) }));
    setFlipped(false);

    const alreadyQueued = queue.slice(currentIndex + 1).some(word => word.id === currentWord.id);
    const shouldRepeat = !isCorrect && !alreadyQueued;
    if (shouldRepeat) setQueue(currentQueue => [...currentQueue, currentWord]);

    if (currentIndex + 1 >= queue.length + (shouldRepeat ? 1 : 0)) {
      const correct = sessionStats.correct + (isCorrect ? 1 : 0);
      const score = Math.round((correct / queue.length) * 100);
      markLessonCompleted(lesson.id, score);
      void syncLessonProgressToDB(lesson.id, true, score);
      setSessionState("done");
    } else {
      setCurrentIndex(i => i + 1);
    }
  }, [currentWord, cards, currentIndex, queue, sessionStats, lesson.id, user]);

  const handleRestart = () => {
    setQueue([...lesson.words]);
    setCurrentIndex(0);
    setFlipped(false);
    setSessionState("studying");
    setSessionStats({ reviewed: 0, correct: 0 });
  };

  const progress = queue.length > 0 ? (currentIndex / queue.length) * 100 : 0;

  if (loadError) {
    return <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: P.bg }}>
      <p>Không thể tải tiến độ ôn tập. Vui lòng kiểm tra kết nối và thử lại.</p>
      <button onClick={() => setRetry(value => value + 1)} className="rounded-xl px-4 py-2 text-white" style={{ background: "#7C3AED" }}>Thử lại</button>
    </div>;
  }

  if (!loaded) return <div className="min-h-screen flex items-center justify-center" style={{ background: P.bg }}>Đang tải...</div>;

  if (sessionState === "done") {
    const score = Math.round((sessionStats.correct / queue.length) * 100);
    return (
      <DoneScreen
        lesson={lesson}
        reviewed={queue.length}
        correct={sessionStats.correct}
        score={score}
        onRestart={handleRestart}
      />
    );
  }

  if (loaded && !currentWord) {
    return (
      <div className="min-h-[calc(100vh-48px)] flex items-center justify-center px-4" style={{ background: P.bg }}>
        <div className="max-w-sm w-full rounded-2xl border p-7 text-center" style={{ background: P.surface, borderColor: P.border }}>
          <CheckCircle size={42} className="mx-auto mb-3" style={{ color: "#059669" }} />
          <h2 className="text-xl font-bold" style={{ color: P.text }}>Chưa đến lịch ôn</h2>
          <p className="my-3 text-sm" style={{ color: P.textMuted }}>Các từ trong bài này đã được lên lịch cho ngày tiếp theo.</p>
          <Link href="/review" className="inline-flex rounded-xl px-4 py-2.5 text-sm font-semibold text-white" style={{ background: "#7C3AED" }}>Xem lịch ôn tập</Link>
        </div>
      </div>
    );
  }

  if (!currentWord) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: P.bg }}>
        <p className="text-sm animate-pulse" style={{ color: P.textMuted }}>Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: P.bg }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="border-b px-4 py-4" style={{ background: P.surface, borderColor: P.border }}>
        <div className="max-w-2xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 mb-3 text-xs" style={{ color: P.textFaint }}>
            <Link href="/" className="flex items-center gap-1 hover:underline"><Home size={11} /> Trang chủ</Link>
            <span>/</span>
            <Link href="/vocabulary" className="hover:underline">Từ vựng</Link>
            <span>/</span>
            <Link href={`/vocabulary/lesson/${lesson.id}`} className="hover:underline">{lesson.title}</Link>
            <span>/</span>
            <span style={{ color: P.textMuted }}>Flashcard</span>
          </nav>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold" style={{ color: P.text }}>Flashcard · {lesson.title}</h1>
              <p className="text-xs mt-0.5" style={{ color: P.textMuted }}>Thuật toán SM-2 · lập lịch ôn tập tối ưu</p>
            </div>
            <span className="text-sm font-medium" style={{ color: P.textFaint }}>
              {currentIndex + 1}/{queue.length}
            </span>
          </div>
          <div className="mt-3">
            <ProgressBar value={progress} color="primary" height={5} />
          </div>
        </div>
      </div>

      {/* ── Card ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div
          className="w-full max-w-md cursor-pointer select-none"
          style={{ perspective: "1200px", height: 340 }}
          onClick={() => setFlipped(f => !f)}
        >
          <div style={{
            position: "relative", width: "100%", height: "100%",
            transformStyle: "preserve-3d",
            transition: "transform 0.5s cubic-bezier(0.4,0.2,0.2,1)",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}>
            {/* Front */}
            <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
              <div className="rounded-2xl border w-full h-full flex flex-col items-center justify-center p-8"
                style={{ borderColor: P.border, backgroundColor: P.surface }}>
                <p className="text-xs mb-5 tracking-widest uppercase" style={{ color: P.textFaint }}>Chữ Hán</p>
                <p className="hanzi font-bold mb-4"
                  style={{ fontSize: "clamp(4rem,15vw,6rem)", lineHeight: 1, color: P.text }}>
                  {currentWord.simplified}
                </p>
                <button
                  onClick={e => { e.stopPropagation(); playAudio(currentWord); }}
                  className="mb-4 transition-colors" style={{ color: P.textFaint }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#7C3AED"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = P.textFaint}
                >
                  <Volume2 size={22} />
                </button>
                <p className="text-sm" style={{ color: P.textFaint }}>↕ Nhấn để lật</p>
              </div>
            </div>

            {/* Back */}
            <div style={{
              position: "absolute", inset: 0,
              backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}>
              <div className="rounded-2xl border w-full h-full flex flex-col items-center justify-center p-8"
                style={{ borderColor: "#B45309", backgroundColor: P.surfaceH }}>
                <p className="hanzi text-5xl font-bold mb-1" style={{ color: P.text }}>
                  {currentWord.simplified}
                </p>
                {currentWord.traditional && currentWord.traditional !== currentWord.simplified && (
                  <p className="hanzi text-xl mb-1" style={{ color: P.textFaint }}>
                    {currentWord.traditional}
                  </p>
                )}
                <p className="text-xl font-semibold mb-4" style={{ color: getToneStyle(currentWord.pinyin) }}>
                  {currentWord.pinyin}
                </p>
                <div className="text-center space-y-1.5 max-w-xs w-full">
                  {currentWord.meaningVi && (
                    <p className="font-bold text-base mb-2" style={{ color: P.text }}>{currentWord.meaningVi}</p>
                  )}
                  {currentWord.meanings.slice(0, 3).map((m, i) => (
                    <p key={i} className="text-sm leading-relaxed" style={{ color: P.textMuted }}>
                      {i === 0 && <span style={{ color: "#7C3AED", marginRight: 4 }}>▸</span>}
                      {m}
                    </p>
                  ))}
                </div>
                {currentWord.classifiers?.length > 0 && (
                  <p className="text-xs mt-3" style={{ color: P.textFaint }}>
                    量词: <span className="hanzi">{currentWord.classifiers.join("、")}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rating buttons — 2 nút đơn giản */}
        {flipped ? (
          <div className="mt-6 w-full max-w-md flex gap-3">
            <button
              onClick={e => { e.stopPropagation(); handleRate(0); }}
              className="flex-1 py-4 rounded-2xl font-bold text-base text-white transition-all active:scale-95 hover:brightness-110"
              style={{ background: "linear-gradient(135deg,#EF4444,#DC2626)" }}
            >
              Không nhớ
            </button>
            <button
              onClick={e => { e.stopPropagation(); handleRate(5); }}
              className="flex-1 py-4 rounded-2xl font-bold text-base text-white transition-all active:scale-95 hover:brightness-110"
              style={{ background: "linear-gradient(135deg,#22C55E,#16A34A)" }}
            >
              Nhớ rồi ✓
            </button>
          </div>
        ) : (
          <button
            onClick={() => setFlipped(true)}
            className="mt-6 px-8 py-3 rounded-xl font-semibold text-white transition-all active:scale-95 hover:brightness-110"
            style={{ background: "linear-gradient(135deg,#7C3AED,#B45309)" }}
          >
            Lật thẻ
          </button>
        )}
      </div>
    </div>
  );
}

// ─── DoneScreen ───────────────────────────────────────────────────────────────
function DoneScreen({ lesson, reviewed, correct, score, onRestart }: {
  lesson: Lesson; reviewed: number; correct: number; score: number; onRestart: () => void;
}) {
  return (
    <div className="min-h-[calc(100vh-48px)] flex flex-col items-center justify-center p-6"
      style={{ background: P.bg }}>
      <div className="rounded-2xl border p-8 max-w-sm w-full text-center"
        style={{ background: P.surface, borderColor: P.border }}>
        <CheckCircle size={48} className="mx-auto mb-4" style={{ color: "#059669" }} />
        <h2 className="text-2xl font-bold mb-1" style={{ color: P.text }}>Xong rồi!</h2>
        <p className="text-sm mb-6" style={{ color: P.textMuted }}>{lesson.title}</p>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { v: reviewed,    l: "Thẻ ôn", c: P.text },
            { v: correct,     l: "Đúng",   c: "#059669" },
            { v: `${score}%`, l: "Điểm",   c: score >= 80 ? "#7C3AED" : score >= 60 ? "#B45309" : "#C0392B" },
          ].map(s => (
            <div key={s.l} className="rounded-xl p-3" style={{ background: P.surfaceH }}>
              <p className="text-2xl font-bold" style={{ color: s.c }}>{s.v}</p>
              <p className="text-xs mt-0.5" style={{ color: P.textFaint }}>{s.l}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <button
            onClick={onRestart}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all"
            style={{ borderColor: P.border, color: P.textMuted, background: P.surfaceH }}
          >
            <RotateCcw size={14} /> Học lại
          </button>
          <Link
            href={`/vocabulary/game/${lesson.id}`}
            className="w-full flex items-center justify-center py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110"
            style={{ background: "linear-gradient(135deg,#B45309,#D97706)" }}
          >
            Thử Game →
          </Link>
        </div>
      </div>
    </div>
  );
}
