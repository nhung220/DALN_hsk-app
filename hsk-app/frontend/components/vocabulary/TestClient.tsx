"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import type { Lesson, Word } from "@/types/hsk";
import {
  generateQuizOptions,
  levenshtein,
  normalizePinyin,
  markLessonCompleted,
  recordTestResult,
  PASS_THRESHOLD,
  syncLessonProgressToDB,
  syncGateResultToDB,
} from "@/lib/hskData";
import BackButton from "@/components/ui/BackButton";
import ProgressBar from "@/components/ui/ProgressBar";
import {
  ClipboardCheck, CheckCircle, XCircle, RotateCcw,
  Volume2, Lock, Trophy, AlertTriangle, ChevronRight,
} from "lucide-react";
import clsx from "clsx";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  setId: string;
  setNumber: number;
  levelNumber: number;
  lessons: Lesson[];
}

type Phase = "intro" | "testing" | "done";

interface TestQ {
  type: "mc-meaning" | "mc-hanzi" | "fill-pinyin";
  word: Word;
  options?: Word[];
  correctIndex?: number;
}

// ─── Build test: random 20 câu từ pool 3 bài ─────────────────────────────────

function buildTest(lessons: Lesson[]): TestQ[] {
  const pool: Word[] = lessons.flatMap((l) => l.words);

  // Fisher-Yates shuffle
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Lấy tối đa 20 từ làm câu hỏi
  const TARGET = 20;
  const sample = shuffled.slice(0, Math.min(TARGET, shuffled.length));

  // Xây câu hỏi: luân phiên 3 loại để cân bằng
  return sample.map((word, i) => {
    const type = i % 3;
    if (type === 0) {
      // Nhìn chữ Hán → chọn nghĩa tiếng Anh
      const opts = generateQuizOptions(word, pool, 4);
      return {
        type: "mc-meaning" as const,
        word,
        options: opts,
        correctIndex: opts.findIndex((o) => o.id === word.id),
      };
    } else if (type === 1) {
      // Nhìn nghĩa → chọn chữ Hán
      const opts = generateQuizOptions(word, pool, 4);
      return {
        type: "mc-hanzi" as const,
        word,
        options: opts,
        correctIndex: opts.findIndex((o) => o.id === word.id),
      };
    } else {
      // Điền pinyin
      return { type: "fill-pinyin" as const, word };
    }
  });
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TestClient({ setId, setNumber, levelNumber, lessons }: Props) {
  const [phase, setPhase]         = useState<Phase>("intro");
  const questions                  = useMemo(() => buildTest(lessons), [lessons]);
  const [current, setCurrent]     = useState(0);
  const [answers, setAnswers]     = useState<Record<number, { answer: string; correct: boolean }>>({});
  const [mcSelected, setMcSel]    = useState<number | null>(null);
  const [fillInput, setFillInput] = useState("");
  const [fillResult, setFillRes]  = useState<boolean | null>(null);
  const [gateResult, setGate]     = useState<{ passed: boolean; score: number } | null>(null);

  const q        = questions[current];
  const progress = (current / questions.length) * 100;

  // Tính điểm realtime
  const currentScore = useMemo(() => {
    const answered = Object.values(answers);
    if (answered.length === 0) return 0;
    const correct = answered.filter((a) => a.correct).length;
    return Math.round((correct / questions.length) * 100);
  }, [answers, questions.length]);

  const playAudio = (word: Word) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(word.simplified);
      u.lang = "zh-CN";
      u.rate = 0.85;
      window.speechSynthesis.speak(u);
    }
  };

  const advance = useCallback(() => {
    if (current + 1 >= questions.length) {
      setPhase("done");
    } else {
      setCurrent((c) => c + 1);
    }
  }, [current, questions.length]);

  const handleMCAnswer = useCallback(
    (idx: number) => {
      if (mcSelected !== null) return;
      setMcSel(idx);
      const isCorrect = idx === q.correctIndex;
      setAnswers((a) => ({ ...a, [current]: { answer: q.options![idx].simplified, correct: isCorrect } }));
      setTimeout(() => {
        setMcSel(null);
        advance();
      }, 800);
    },
    [mcSelected, q, current, advance]
  );

  const handleFillSubmit = useCallback(() => {
    if (fillResult !== null || !fillInput.trim()) return;
    const input   = normalizePinyin(fillInput.trim());
    const correct = normalizePinyin(q.word.pinyin);
    const dist    = levenshtein(input, correct);
    const isOk    = dist <= 1;
    setFillRes(isOk);
    setAnswers((a) => ({ ...a, [current]: { answer: fillInput, correct: isOk } }));
    setTimeout(() => {
      setFillRes(null);
      setFillInput("");
      advance();
    }, 1000);
  }, [fillInput, fillResult, q, current, advance]);

  // Khi phase chuyển sang "done" → tính điểm + lưu gate
  useEffect(() => {
    if (phase !== "done") return;
    const total      = Object.keys(answers).length || questions.length;
    const correct    = Object.values(answers).filter((a) => a.correct).length;
    const score      = Math.round((correct / total) * 100);
    const result     = recordTestResult(levelNumber, setNumber, score);
    lessons.forEach((l) => {
      markLessonCompleted(l.id, score);
      void syncLessonProgressToDB(l.id, true, score);
    });
    void syncGateResultToDB(`new-${levelNumber}-set-${setNumber}`, result.passed, score);
    setGate(result);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Intro ──────────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <IntroScreen
        setNumber={setNumber}
        levelNumber={levelNumber}
        lessons={lessons}
        totalQuestions={questions.length}
        onStart={() => setPhase("testing")}
      />
    );
  }

  // ── Done ───────────────────────────────────────────────────────────────────
  if (phase === "done" && gateResult !== null) {
    const total        = Object.keys(answers).length;
    const correctCount = Object.values(answers).filter((a) => a.correct).length;
    return (
      <ResultScreen
        setNumber={setNumber}
        levelNumber={levelNumber}
        total={total}
        correctCount={correctCount}
        score={gateResult.score}
        passed={gateResult.passed}
        questions={questions}
        answers={answers}
        onRetry={() => {
          setCurrent(0);
          setAnswers({});
          setGate(null);
          setPhase("testing");
        }}
      />
    );
  }

  // ── Testing ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FFFBEA" }}>

      {/* Header */}
      <div className="border-b px-4 py-3" style={{ background: "#FFF8D6", borderColor: "#E8D98A" }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <BackButton href="/vocabulary" />
            <div className="flex items-center gap-3 text-xs">
              <span style={{ color: "#A8956A" }}>HSK {levelNumber} · Nhóm {setNumber}</span>
              <span className="font-bold" style={{ color: "#1C1408" }}>{current + 1}/{questions.length}</span>
            </div>
          </div>
          <ProgressBar value={progress} color="review" height={5} />
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[11px]" style={{ color: "#A8956A" }}>
              {q.type === "mc-meaning" ? "Chọn nghĩa đúng"
               : q.type === "mc-hanzi" ? "Chọn chữ Hán đúng"
               : "Điền Pinyin"}
            </span>
            <span className="text-[11px] font-semibold"
              style={{ color: current > 0
                ? currentScore >= PASS_THRESHOLD ? "#059669" : "#C0392B"
                : "#A8956A" }}>
              {current > 0 ? `Tạm thời: ${currentScore}%` : `Cần ≥${PASS_THRESHOLD}% để qua`}
            </span>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 max-w-2xl mx-auto w-full">

        {/* Question card */}
        <div className="rounded-2xl border p-7 w-full max-w-xl text-center mb-5"
          style={{ background: "#FFF8D6", borderColor: "#E8D98A" }}>
          {q.type === "mc-meaning" && (
            <>
              <p className="text-[11px] uppercase tracking-widest mb-4" style={{ color: "#A8956A" }}>Nghĩa của từ này là gì?</p>
              <p className="hanzi font-bold mb-3"
                style={{ fontSize: "clamp(3rem,12vw,5rem)", lineHeight: 1, color: "#1C1408" }}>
                {q.word.simplified}
              </p>
              <button onClick={() => playAudio(q.word)} style={{ color: "#A8956A" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#7C3AED"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#A8956A"}>
                <Volume2 size={18} />
              </button>
            </>
          )}
          {q.type === "mc-hanzi" && (
            <>
              <p className="text-[11px] uppercase tracking-widest mb-4" style={{ color: "#A8956A" }}>Chữ Hán nào có nghĩa sau?</p>
              <p className="text-xl font-semibold mb-2" style={{ color: "#1C1408" }}>{q.word.meaningVi || q.word.meaning}</p>
              <p className="text-base" style={{ color: "#7C3AED" }}>{q.word.pinyin}</p>
            </>
          )}
          {q.type === "fill-pinyin" && (
            <>
              <p className="text-[11px] uppercase tracking-widest mb-4" style={{ color: "#A8956A" }}>Điền pinyin cho chữ sau</p>
              <p className="hanzi font-bold mb-2"
                style={{ fontSize: "clamp(3rem,12vw,5rem)", lineHeight: 1, color: "#1C1408" }}>
                {q.word.simplified}
              </p>
              <p className="text-sm mb-2" style={{ color: "#78614A" }}>{q.word.meaningVi || q.word.meaning}</p>
              <button onClick={() => playAudio(q.word)} style={{ color: "#A8956A" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#7C3AED"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#A8956A"}>
                <Volume2 size={16} />
              </button>
            </>
          )}
        </div>

        {/* MC options */}
        {(q.type === "mc-meaning" || q.type === "mc-hanzi") && q.options && (
          <div className="w-full max-w-xl grid grid-cols-1 gap-2.5">
            {q.options.map((opt, idx) => {
              const isCorrect  = idx === q.correctIndex;
              const isSelected = mcSelected === idx;
              let state: "default" | "correct" | "wrong" | "reveal" = "default";
              if (mcSelected !== null) {
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
                : { background: "#FFF8D6", borderColor: "#E8D98A", color: "#1C1408" };
              return (
                <button
                  key={opt.id}
                  onClick={() => handleMCAnswer(idx)}
                  disabled={mcSelected !== null}
                  className="w-full px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left flex items-center justify-between gap-3"
                  style={stateStyle}
                  onMouseEnter={e => { if (state === "default") (e.currentTarget as HTMLElement).style.background = "#FFF3B0"; }}
                  onMouseLeave={e => { if (state === "default") (e.currentTarget as HTMLElement).style.background = "#FFF8D6"; }}
                >
                  <span className={q.type === "mc-hanzi" ? "hanzi text-2xl" : ""}>
                    {q.type === "mc-meaning" ? (opt.meaningVi || opt.meaning) : opt.simplified}
                  </span>
                  {state === "correct" && <CheckCircle size={16} style={{ color: "#059669" }} className="flex-shrink-0" />}
                  {state === "wrong"   && <XCircle     size={16} style={{ color: "#C0392B" }} className="flex-shrink-0" />}
                  {state === "reveal"  && <CheckCircle size={16} style={{ color: "#B45309" }} className="flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Fill pinyin */}
        {q.type === "fill-pinyin" && (
          <div className="w-full max-w-xl space-y-2">
            <div className="flex rounded-xl border overflow-hidden transition-all"
              style={{ borderColor: fillResult === true ? "#059669" : fillResult === false ? "#C0392B" : "#E8D98A" }}>
              <input
                type="text"
                value={fillInput}
                onChange={e => setFillInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && fillInput.trim() && handleFillSubmit()}
                placeholder="VD: nǐ hǎo …"
                className="flex-1 px-4 py-3 text-sm outline-none"
                style={{ background: "#FFF8D6", color: "#1C1408" }}
                disabled={fillResult !== null}
                autoFocus
              />
              <button
                onClick={handleFillSubmit}
                disabled={!fillInput.trim() || fillResult !== null}
                className="px-5 text-white text-sm font-semibold transition-all disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,#7C3AED,#B45309)" }}
              >
                OK
              </button>
            </div>
            {fillResult !== null && (
              <div className="px-4 py-2 rounded-lg text-sm font-medium"
                style={fillResult
                  ? { background: "#DCFCE7", color: "#166534" }
                  : { background: "#FEE2E2", color: "#7F1D1D" }}>
                {fillResult ? "✓ Chính xác!" : `✗ Đáp án: ${q.word.pinyin}`}
              </div>
            )}
            <p className="text-[11px] text-center" style={{ color: "#A8956A" }}>
              Levenshtein · cho phép sai 1 ký tự
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Intro Screen ─────────────────────────────────────────────────────────────

function IntroScreen({
  setNumber, levelNumber, lessons, totalQuestions, onStart,
}: {
  setNumber: number; levelNumber: number; lessons: Lesson[];
  totalQuestions: number; onStart: () => void;
}) {
  const totalWords = lessons.reduce((s, l) => s + l.wordCount, 0);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FFFBEA" }}>
      <div className="border-b px-4 py-4" style={{ background: "#FFF8D6", borderColor: "#E8D98A" }}>
        <div className="max-w-xl mx-auto">
          <BackButton href="/vocabulary" />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="rounded-2xl border max-w-md w-full overflow-hidden"
          style={{ background: "#FFF8D6", borderColor: "#E8D98A" }}>

          {/* Top banner */}
          <div className="px-6 pt-6 pb-5 border-b" style={{ borderColor: "#E8D98A" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "#FEF3C7" }}>
                <ClipboardCheck size={20} style={{ color: "#B45309" }} />
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ color: "#1C1408" }}>Bài kiểm tra nhóm {setNumber}</h2>
                <p className="text-xs" style={{ color: "#A8956A" }}>HSK {levelNumber} · Bài {(setNumber - 1) * 3 + 1}–{setNumber * 3}</p>
              </div>
            </div>

            {/* Lessons list */}
            <div className="space-y-1.5">
              {lessons.map(l => (
                <div key={l.id} className="flex items-center gap-2.5 text-sm">
                  <span className="w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center flex-shrink-0"
                    style={{ background: "#FEF3C7", color: "#B45309" }}>
                    {l.lessonNumber}
                  </span>
                  <span style={{ color: "#78614A" }}>{l.title}</span>
                  <span className="text-xs ml-auto" style={{ color: "#A8956A" }}>{l.wordCount} từ</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 divide-x" style={{ borderColor: "#E8D98A" }}>
            {[
              { v: totalWords,    l: "Từ vựng",  c: "#1C1408" },
              { v: totalQuestions, l: "Câu hỏi", c: "#7C3AED" },
              { v: `${PASS_THRESHOLD}%`, l: "Điểm qua", c: "#B45309" },
            ].map(({ v, l, c }) => (
              <div key={l} className="flex flex-col items-center py-4">
                <span className="text-xl font-extrabold" style={{ color: c }}>{v}</span>
                <span className="text-[11px] mt-0.5" style={{ color: "#A8956A" }}>{l}</span>
              </div>
            ))}
          </div>

          {/* Question types */}
          <div className="px-6 pb-5 pt-2 space-y-1.5 border-t" style={{ borderColor: "#E8D98A" }}>
            <p className="text-xs mb-2 mt-2" style={{ color: "#A8956A" }}>Dạng câu hỏi</p>
            {[
              ["Trắc nghiệm", "Nhìn chữ → chọn nghĩa"],
              ["Trắc nghiệm", "Nhìn nghĩa → chọn chữ Hán"],
              ["Điền từ",     "Điền Pinyin (Levenshtein ±1)"],
            ].map(([type, desc]) => (
              <div key={desc} className="flex items-center gap-2 text-xs" style={{ color: "#78614A" }}>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#7C3AED" }} />
                <span className="font-medium" style={{ color: "#1C1408" }}>{type}</span>
                <span>·</span>
                <span>{desc}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="px-6 pb-6">
            <button
              onClick={onStart}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:brightness-110 active:scale-95 flex items-center justify-center gap-2 text-white"
              style={{ background: "linear-gradient(135deg,#B45309,#D97706)" }}
            >
              Bắt đầu kiểm tra <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Result Screen ────────────────────────────────────────────────────────────

function ResultScreen({
  setNumber, levelNumber, total, correctCount, score, passed,
  questions, answers, onRetry,
}: {
  setNumber: number; levelNumber: number; total: number;
  correctCount: number; score: number; passed: boolean;
  questions: TestQ[];
  answers: Record<number, { answer: string; correct: boolean }>;
  onRetry: () => void;
}) {
  const [showDetail, setShowDetail] = useState(false);
  const wrongCount = total - correctCount;

  return (
    <div className="min-h-screen bg-[#FFFBEA] flex flex-col">
      <div className="border-b px-4 py-4" style={{ background: "#FFFDF0", borderColor: "#E8D98A" }}>
        <div className="max-w-2xl mx-auto">
          <BackButton href="/vocabulary" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-xl mx-auto space-y-4">

          {/* ── Score hero ── */}
          <div className="rounded-2xl border overflow-hidden"
            style={{ borderColor: passed ? "#22c55e50" : "#ef444450" }}>

            {/* Top color band */}
            <div className="px-6 py-6 text-center"
              style={{ background: passed ? "linear-gradient(135deg,#052e16,#14532d)" : "linear-gradient(135deg,#2d0a0a,#450a0a)" }}>
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl font-extrabold"
                style={{ background: passed ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)",
                         color: passed ? "#4ade80" : "#f87171",
                         border: `2px solid ${passed ? "#22c55e" : "#ef4444"}` }}>
                {score}%
              </div>
              <h2 className="text-xl font-extrabold text-white mb-1">
                {passed ? "🎉 Xuất sắc! Nhóm tiếp theo đã mở" : "😔 Chưa đủ điểm qua"}
              </h2>
              <p className="text-sm" style={{ color: passed ? "rgba(134,239,172,0.8)" : "rgba(252,165,165,0.7)" }}>
                {passed
                  ? `Đạt ${score}% ≥ ${PASS_THRESHOLD}% · Nhóm ${setNumber + 1} đã được mở khóa`
                  : `Cần ≥ ${PASS_THRESHOLD}% để mở khóa nhóm ${setNumber + 1} · Bạn đạt ${score}%`}
              </p>
            </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 divide-x" style={{ background: "#FFF8D6", borderColor: "#E8D98A" }}>
            <div className="flex flex-col items-center py-4">
              <span className="text-2xl font-extrabold" style={{ color: "#1C1408" }}>{total}</span>
              <span className="text-xs mt-0.5" style={{ color: "#A8956A" }}>Tổng câu</span>
            </div>
            <div className="flex flex-col items-center py-4">
              <span className="text-2xl font-extrabold" style={{ color: "#059669" }}>{correctCount}</span>
              <span className="text-xs mt-0.5" style={{ color: "#A8956A" }}>Đúng</span>
            </div>
            <div className="flex flex-col items-center py-4">
              <span className="text-2xl font-extrabold" style={{ color: "#C0392B" }}>{wrongCount}</span>
              <span className="text-xs mt-0.5" style={{ color: "#A8956A" }}>Sai</span>
            </div>
          </div>
          </div>

          {/* ── Gate status banner ── */}
          {passed ? (
            <div className="rounded-xl border border-green-500/30 px-4 py-3 flex items-center gap-3"
              style={{ background: "rgba(34,197,94,0.08)" }}>
              <Trophy size={18} className="text-green-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-300">
                  Nhóm {setNumber + 1} đã được mở khóa!
                </p>
                <p className="text-xs text-green-400/60 mt-0.5">
                  Bài {setNumber * 3 + 1}, {setNumber * 3 + 2}, {setNumber * 3 + 3} · HSK {levelNumber}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-red-500/30 px-4 py-3 flex items-center gap-3"
              style={{ background: "rgba(239,68,68,0.08)" }}>
              <Lock size={18} className="text-red-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-300">
                  Nhóm {setNumber + 1} vẫn bị khóa
                </p>
                <p className="text-xs text-red-400/60 mt-0.5">
                  Cần thêm {PASS_THRESHOLD - score}% nữa · Ôn lại bài rồi thử lại
                </p>
              </div>
              <AlertTriangle size={15} className="text-yellow-400 ml-auto flex-shrink-0" />
            </div>
          )}

          {/* ── Action buttons ── */}
          <div className="flex gap-3">
            <button
              onClick={onRetry}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all border"
              style={{ background: "#FFF8D6", borderColor: "#E8D98A", color: "#78614A" }}
            >
              <RotateCcw size={14} /> Làm lại
            </button>
            <Link
              href="/vocabulary"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110 text-white"
              style={{ background: passed ? "linear-gradient(135deg,#16a34a,#22c55e)" : "linear-gradient(135deg,#7C3AED,#B45309)" }}
            >
              {passed ? <><Trophy size={14} /> Học tiếp</> : <><BookStudy /> Ôn lại bài</>}
            </Link>
          </div>

          {/* ── Detail toggle ── */}
          <button
            onClick={() => setShowDetail(!showDetail)}
            className="w-full text-xs py-1 transition-colors"
            style={{ color: "#A8956A" }}
          >
            {showDetail ? "▲ Ẩn chi tiết" : "▼ Xem chi tiết câu trả lời"}
          </button>

          {showDetail && (
            <div className="space-y-2 pb-6">
              {questions.map((q, i) => {
                const ans = answers[i];
                return (
                  <div key={i} className="rounded-xl border p-3.5"
                    style={ans?.correct
                      ? { background: "#F0FDF4", borderColor: "#86EFAC" }
                      : { background: "#FEF2F2", borderColor: "#FCA5A5" }}>
                    <div className="flex items-center gap-2 mb-2">
                      {ans?.correct
                        ? <CheckCircle size={13} style={{ color: "#059669" }} className="flex-shrink-0" />
                        : <XCircle     size={13} style={{ color: "#C0392B" }} className="flex-shrink-0" />
                      }
                      <span className="text-[11px]" style={{ color: "#A8956A" }}>
                        {q.type === "mc-meaning"  ? "Chọn nghĩa"
                         : q.type === "mc-hanzi"  ? "Chọn chữ Hán"
                         : "Điền Pinyin"}
                      </span>
                      {!ans?.correct && (
                        <span className="ml-auto text-[11px]" style={{ color: "#C0392B" }}>
                          Bạn: {ans?.answer || "—"}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="hanzi text-2xl font-bold" style={{ color: "#1C1408" }}>{q.word.simplified}</span>
                      <div>
                        <p className="text-xs" style={{ color: "#7C3AED" }}>{q.word.pinyin}</p>
                        <p className="text-xs" style={{ color: "#78614A" }}>{q.word.meaningVi || q.word.meaning}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// tiny icon helper
function BookStudy() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  );
}
