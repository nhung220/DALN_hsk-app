"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Lesson, Word } from "@/types/hsk";
import type { GameMode, QuizQuestion } from "@/types/hsk";
import { generateQuizOptions, markLessonCompleted, syncLessonProgressToDB } from "@/lib/hskData";
import ProgressBar from "@/components/ui/ProgressBar";
import { Timer, Trophy, RotateCcw, Volume2, CheckCircle, XCircle, Home } from "lucide-react";
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
type GamePhase = "select" | "playing" | "done";

const MODE_CONFIG: Record<GameMode, { label: string; desc: string; emoji: string }> = {
  meaning: { label: "Nghĩa từ",   desc: "Nhìn chữ Hán → chọn nghĩa đúng", emoji: "📖" },
  pinyin:  { label: "Pinyin",     desc: "Nhìn chữ Hán → chọn pinyin đúng", emoji: "🔤" },
  hanzi:   { label: "Chữ Hán",   desc: "Nhìn nghĩa → chọn chữ Hán đúng",  emoji: "汉" },
};

function buildQuestions(words: Word[], mode: GameMode): QuizQuestion[] {
  return words.map(word => {
    const options = generateQuizOptions(word, words, 4);
    return { word, options, correctIndex: options.findIndex(o => o.id === word.id), mode };
  });
}

export default function GameClient({ lesson }: Props) {
  const [phase, setPhase]       = useState<GamePhase>("select");
  const [mode, setMode]         = useState<GameMode>("meaning");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent]   = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correct, setCorrect]   = useState(0);
  const [wrong, setWrong]       = useState(0);
  const [startTime, setStartTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (phase === "playing") {
      timerRef.current = setInterval(() => { /* force re-render for timer */ }, 500);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const startGame = (selectedMode: GameMode) => {
    setMode(selectedMode);
    const qs = buildQuestions(lesson.words, selectedMode);
    for (let i = qs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [qs[i], qs[j]] = [qs[j], qs[i]];
    }
    setQuestions(qs);
    setCurrent(0); setSelected(null); setCorrect(0); setWrong(0);
    setStartTime(Date.now());
    setPhase("playing");
  };

  const handleAnswer = useCallback((idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    const q    = questions[current];
    const isOk = idx === q.correctIndex;
    if (isOk) setCorrect(c => c + 1); else setWrong(w => w + 1);

    setTimeout(() => {
      setSelected(null);
      if (current + 1 >= questions.length) {
        const score = Math.round(((isOk ? correct + 1 : correct) / questions.length) * 100);
        markLessonCompleted(lesson.id, score);
        void syncLessonProgressToDB(lesson.id, true, score);
        setPhase("done");
      } else {
        setCurrent(c => c + 1);
      }
    }, 1000);
  }, [selected, questions, current, correct, lesson.id]);

  const playAudio = (word: Word) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(word.simplified);
      utt.lang = "zh-CN"; utt.rate = 0.85;
      window.speechSynthesis.speak(utt);
    }
  };

  if (phase === "select") return <ModeSelect lesson={lesson} onStart={startGame} />;

  if (phase === "done") {
    const score = Math.round((correct / questions.length) * 100);
    return (
      <DoneScreen
        lesson={lesson}
        total={questions.length} correct={correct} wrong={wrong} score={score}
        timeTaken={Math.round((Date.now() - startTime) / 1000)}
        mode={mode}
        onRestart={() => startGame(mode)}
        onChangeMode={() => setPhase("select")}
      />
    );
  }

  const q           = questions[current];
  const progressVal = questions.length > 0 ? (current / questions.length) * 100 : 0;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: P.bg }}>
      {/* Header */}
      <div className="border-b px-4 py-4" style={{ background: P.surface, borderColor: P.border }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <nav className="flex items-center gap-1.5 text-xs" style={{ color: P.textFaint }}>
              <Link href="/" className="flex items-center gap-1 hover:underline"><Home size={11} /></Link>
              <span>/</span>
              <Link href="/vocabulary" className="hover:underline">Từ vựng</Link>
              <span>/</span>
              <Link href={`/vocabulary/lesson/${lesson.id}`} className="hover:underline">{lesson.title}</Link>
              <span>/</span>
              <span style={{ color: P.textMuted }}>Game</span>
            </nav>
            <div className="flex items-center gap-4 text-sm font-semibold">
              <span style={{ color: "#059669" }}>✓ {correct}</span>
              <span style={{ color: "#C0392B" }}>✗ {wrong}</span>
              <span className="flex items-center gap-1" style={{ color: P.textFaint }}>
                <Timer size={13} />
                {Math.round((Date.now() - startTime) / 1000)}s
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs mb-2" style={{ color: P.textFaint }}>
            <span>Câu {current + 1}/{questions.length}</span>
            <span>{MODE_CONFIG[mode].label}</span>
          </div>
          <ProgressBar value={progressVal} color="primary" height={5} />
        </div>
      </div>

      {/* Question + Options */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 max-w-2xl mx-auto w-full">
        {/* Question card */}
        <div className="rounded-2xl border p-8 w-full max-w-xl text-center"
          style={{ background: P.surface, borderColor: P.border }}>
          {q.mode === "meaning" || q.mode === "pinyin" ? (
            <>
              <p className="text-xs mb-3" style={{ color: P.textFaint }}>
                {q.mode === "meaning" ? "Nghĩa của từ này là gì?" : "Pinyin của từ này là gì?"}
              </p>
              <p className="hanzi font-bold mb-3"
                style={{ fontSize: "clamp(3.5rem,12vw,5rem)", lineHeight: 1, color: P.text }}>
                {q.word.simplified}
              </p>
              <button
                onClick={() => playAudio(q.word)}
                className="transition-colors" style={{ color: P.textFaint }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#7C3AED"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = P.textFaint}
              >
                <Volume2 size={20} />
              </button>
            </>
          ) : (
            <>
              <p className="text-xs mb-3" style={{ color: P.textFaint }}>Chữ Hán nào có nghĩa là:</p>
              <p className="text-xl font-semibold" style={{ color: P.text }}>{q.word.meaningVi || q.word.meaning}</p>
              <p className="text-sm mt-1" style={{ color: P.textMuted }}>{q.word.pinyin}</p>
            </>
          )}
        </div>

        {/* Options */}
        <div className="w-full max-w-xl mt-5 grid grid-cols-1 gap-3">
          {q.options.map((opt, idx) => {
            const isCorrect  = idx === q.correctIndex;
            const isSelected = selected === idx;
            let state: "default" | "correct" | "wrong" | "reveal" = "default";
            if (selected !== null) {
              if (isSelected && isCorrect)  state = "correct";
              else if (isSelected)          state = "wrong";
              else if (isCorrect)           state = "reveal";
            }

            const stateStyle = state === "correct"
              ? { background: "#DCFCE7", borderColor: "#059669", color: "#166534" }
              : state === "wrong"
              ? { background: "#FEE2E2", borderColor: "#C0392B", color: "#7F1D1D" }
              : state === "reveal"
              ? { background: "#FEF9C3", borderColor: "#B45309", color: "#92400E" }
              : { background: P.surface, borderColor: P.border, color: P.text };

            return (
              <button
                key={opt.id}
                onClick={() => handleAnswer(idx)}
                disabled={selected !== null}
                className="w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all"
                style={stateStyle}
                onMouseEnter={e => { if (state === "default") (e.currentTarget as HTMLElement).style.background = P.surfaceH; }}
                onMouseLeave={e => { if (state === "default") (e.currentTarget as HTMLElement).style.background = P.surface; }}
              >
                <div className="flex items-center justify-between">
                  <OptionLabel opt={opt} mode={q.mode} />
                  {state === "correct" && <CheckCircle size={16} style={{ color: "#059669" }} className="flex-shrink-0" />}
                  {state === "wrong"   && <XCircle    size={16} style={{ color: "#C0392B" }} className="flex-shrink-0" />}
                  {state === "reveal"  && <CheckCircle size={16} style={{ color: "#B45309" }} className="flex-shrink-0" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── OptionLabel ──────────────────────────────────────────────────────────────
function OptionLabel({ opt, mode }: { opt: Word; mode: GameMode }) {
  if (mode === "meaning") return <span className="leading-relaxed">{opt.meaningVi || opt.meaning}</span>;
  if (mode === "pinyin")  return <span className="font-mono">{opt.pinyin}</span>;
  return <span className="hanzi text-2xl">{opt.simplified}</span>;
}

// ─── ModeSelect ───────────────────────────────────────────────────────────────
function ModeSelect({ lesson, onStart }: { lesson: Lesson; onStart: (m: GameMode) => void }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: P.bg }}>
      <div className="border-b px-4 py-4" style={{ background: P.surface, borderColor: P.border }}>
        <div className="max-w-2xl mx-auto">
          <nav className="flex items-center gap-1.5 mb-3 text-xs" style={{ color: P.textFaint }}>
            <Link href="/" className="flex items-center gap-1 hover:underline"><Home size={11} /> Trang chủ</Link>
            <span>/</span>
            <Link href="/vocabulary" className="hover:underline">Từ vựng</Link>
            <span>/</span>
            <Link href={`/vocabulary/lesson/${lesson.id}`} className="hover:underline">{lesson.title}</Link>
          </nav>
          <h1 className="text-xl font-bold" style={{ color: P.text }}>Game từ vựng · {lesson.title}</h1>
          <p className="text-sm mt-0.5" style={{ color: P.textMuted }}>Quiz, Pinyin, Chữ Hán · 4 lựa chọn</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 py-8">
        <p className="text-sm mb-6" style={{ color: P.textMuted }}>Chọn chế độ chơi:</p>
        <div className="grid grid-cols-1 gap-4">
          {(Object.entries(MODE_CONFIG) as [GameMode, typeof MODE_CONFIG["meaning"]][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => onStart(key)}
              className="rounded-2xl border p-5 text-left transition-all"
              style={{ background: P.surface, borderColor: P.border }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = P.surfaceH; (e.currentTarget as HTMLElement).style.borderColor = "#B45309"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = P.surface; (e.currentTarget as HTMLElement).style.borderColor = P.border; }}
            >
              <div className="flex items-center gap-4">
                <span className="hanzi text-3xl">{cfg.emoji}</span>
                <div>
                  <p className="font-semibold" style={{ color: P.text }}>{cfg.label}</p>
                  <p className="text-sm mt-0.5" style={{ color: P.textMuted }}>{cfg.desc}</p>
                </div>
                <span className="ml-auto" style={{ color: P.textFaint }}>→</span>
              </div>
            </button>
          ))}
        </div>
        <p className="text-xs mt-6 text-center" style={{ color: P.textFaint }}>
          {lesson.words.length} câu hỏi · 4 lựa chọn
        </p>
      </div>
    </div>
  );
}

// ─── DoneScreen ───────────────────────────────────────────────────────────────
function DoneScreen({
  lesson, total, correct, wrong, score, timeTaken, mode, onRestart, onChangeMode,
}: {
  lesson: Lesson; total: number; correct: number; wrong: number; score: number;
  timeTaken: number; mode: GameMode; onRestart: () => void; onChangeMode: () => void;
}) {
  const grade = score >= 90 ? "Xuất sắc! 🏆" : score >= 70 ? "Tốt! 👍" : score >= 50 ? "Khá 😊" : "Cần cố gắng hơn 💪";

  return (
    <div className="min-h-[calc(100vh-48px)] flex flex-col items-center justify-center p-6"
      style={{ background: P.bg }}>
      <div className="rounded-2xl border p-8 max-w-sm w-full text-center"
        style={{ background: P.surface, borderColor: P.border }}>
        <Trophy size={48} className="mx-auto mb-3" style={{ color: "#D97706" }} />
        <h2 className="text-2xl font-bold mb-1" style={{ color: P.text }}>{grade}</h2>
        <p className="text-sm mb-6" style={{ color: P.textMuted }}>{lesson.title} · {MODE_CONFIG[mode].label}</p>

        <div className="grid grid-cols-2 gap-3 mb-3">
          {[
            { v: `${score}%`,    l: "Điểm",    c: score >= 80 ? "#7C3AED" : score >= 60 ? "#B45309" : "#C0392B" },
            { v: `${timeTaken}s`, l: "Thời gian", c: P.text },
            { v: correct,        l: `Đúng/${total}`, c: "#059669" },
            { v: wrong,          l: "Sai",      c: "#C0392B" },
          ].map(s => (
            <div key={s.l} className="rounded-xl p-3" style={{ background: P.surfaceH }}>
              <p className="text-2xl font-bold" style={{ color: s.c }}>{s.v}</p>
              <p className="text-xs mt-0.5" style={{ color: P.textFaint }}>{s.l}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2 mt-4">
          <button
            onClick={onRestart}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110"
            style={{ background: "linear-gradient(135deg,#B45309,#D97706)" }}
          >
            <RotateCcw size={14} /> Chơi lại
          </button>
          <button
            onClick={onChangeMode}
            className="w-full py-2.5 rounded-xl text-sm font-medium border transition-all"
            style={{ borderColor: P.border, color: P.textMuted, background: P.surfaceH }}
          >
            Đổi chế độ
          </button>
        </div>
      </div>
    </div>
  );
}
