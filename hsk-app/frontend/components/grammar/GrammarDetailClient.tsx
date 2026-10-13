"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import type { GrammarPoint, GrammarExample } from "@/lib/grammarDataServer";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  ChevronLeft, ChevronRight, BookOpen, PenLine,
  Shuffle, Volume2, CheckCircle, XCircle, RotateCcw,
  ExternalLink,
} from "lucide-react";
import clsx from "clsx";

// ─── Palette ─────────────────────────────────────────────────────────────────

const P = {
  text:    "#1C1408",
  muted:   "#78614A",
  faint:   "#A8956A",
  border:  "#E8D98A",
  surface: "#FFFDF0",
  purple:  "#7C3AED",
  green:   "#059669",
  red:     "#C0392B",
  blue:    "#2563EB",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = "study" | "fill" | "sort";

interface Props {
  point: GrammarPoint;
  levelNumber: number;
  initialMode: Mode;
  prevPointId: string | null;
  nextPointId: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function playTTS(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = "zh-CN";
  utt.rate = 0.85;
  window.speechSynthesis.speak(utt);
}

function localizeStructure(text: string): string {
  return text
    .replace(/Subj\./g, "Chủ ngữ")
    .replace(/Verb Phrase/g, "Cụm động từ")
    .replace(/Noun Phrase/g, "Cụm danh từ")
    .replace(/Verb/g, "Động từ")
    .replace(/Obj\./g, "Tân ngữ")
    .replace(/Adj\./g, "Tính từ")
    .replace(/Adv\./g, "Trạng từ")
    .replace(/Noun/g, "Danh từ")
    .replace(/Time/g, "Thời gian")
    .replace(/Place/g, "Địa điểm");
}

// ─── Root Component ───────────────────────────────────────────────────────────

export default function GrammarDetailClient({
  point, levelNumber, initialMode, prevPointId, nextPointId,
}: Props) {
  const [mode, setMode] = useState<Mode>(initialMode);

  const tabs: { id: Mode; label: string; short: string; icon: React.ReactNode }[] = [
    { id: "study", label: "Hiểu cấu trúc", short: "1", icon: <BookOpen size={14} /> },
    { id: "fill",  label: "Điền từ", short: "2", icon: <PenLine size={14} /> },
    { id: "sort",  label: "Tạo câu", short: "3", icon: <Shuffle size={14} /> },
  ];

  return (
    <div className="min-h-[calc(100vh-48px)] bg-[#FFFBEA] flex flex-col">
      {/* ── Header ── */}
      <div
        className="sticky top-0 z-10 border-b"
        style={{ background: "rgba(255,251,234,0.97)", borderColor: P.border }}
      >
        <div className="max-w-2xl mx-auto px-4 pt-3 pb-0">
          {/* Back + nav */}
          <div className="flex items-center justify-between mb-2">
            <Link
              href={`/grammar/${levelNumber}`}
              className="inline-flex items-center gap-1 text-sm transition-colors"
              style={{ color: P.muted }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = P.text}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = P.muted}
            >
              <ChevronLeft size={15} /> HSK {levelNumber}
            </Link>
            <div className="flex items-center gap-2">
              {prevPointId && (
                <Link
                  href={`/grammar/${levelNumber}/${prevPointId}?mode=${mode}`}
                  className="p-1.5 rounded-lg transition-all"
                  style={{ color: P.muted }}
                >
                  <ChevronLeft size={16} />
                </Link>
              )}
              {nextPointId && (
                <Link
                  href={`/grammar/${levelNumber}/${nextPointId}?mode=${mode}`}
                  className="p-1.5 rounded-lg transition-all"
                  style={{ color: P.muted }}
                >
                  <ChevronRight size={16} />
                </Link>
              )}
            </div>
          </div>

          <h1 className="text-base font-bold leading-snug mb-3 pr-4" style={{ color: P.text }}>
            {point.titleVi ?? point.title}
          </h1>

          {/* Tab bar */}
          <div className="grid grid-cols-3 gap-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setMode(t.id)}
                className={clsx(
                  "flex items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-bold rounded-t-lg transition-all border-b-2",
                  mode === t.id ? "border-[#7C3AED]" : "border-transparent"
                )}
                style={{ color: mode === t.id ? P.purple : P.muted }}
              >
                <span className="w-5 h-5 rounded-full grid place-items-center text-[10px]" style={{ background: mode === t.id ? "#EDE9FE" : "#F0E9B8" }}>{t.short}</span><span className="hidden sm:inline">{t.label}</span><span className="sm:hidden">{t.id === "study" ? "Hiểu" : t.id === "fill" ? "Điền" : "Tạo câu"}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        {mode === "study" && <StudyMode point={point} onContinue={() => setMode("fill")} />}
        {mode === "fill"  && <FillMode  point={point} />}
        {mode === "sort"  && <SortMode  point={point} />}
      </div>
    </div>
  );
}

// ─── Mode 1: Điểm ngữ pháp (Study) ──────────────────────────────────────────

function StudyMode({ point, onContinue }: { point: GrammarPoint; onContinue: () => void }) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border p-4 flex gap-3" style={{ borderColor: "#DDD6FE", background: "#F5F3FF" }}>
        <div className="w-8 h-8 rounded-lg grid place-items-center shrink-0 text-white font-black text-sm" style={{ background: P.purple }}>1</div>
        <div><p className="text-sm font-bold">Quan sát trước khi luyện</p><p className="text-xs mt-1 leading-5" style={{ color: P.muted }}>Đọc công thức, nghe từng câu mẫu rồi ẩn pinyin để tự đọc lại. Khi đã hiểu, chuyển sang bài Điền từ.</p></div>
      </div>
      {/* Structures */}
      <div className="rounded-2xl border p-4" style={{ borderColor: P.border, backgroundColor: P.surface }}>
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: P.faint }}>
          Cấu trúc
        </p>
        <div className="space-y-2">
          {point.structures.map((s, i) => (
            <div key={i} className="font-mono text-sm rounded-xl px-4 py-2.5"
              style={{ background: "rgba(124,58,237,0.08)", color: P.purple }}>
              {localizeStructure(s)}
            </div>
          ))}
        </div>

        {point.usedFor.length > 0 && <div className="flex flex-wrap gap-1.5 mt-3">{point.usedFor.map((item) => <span key={item} className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: "#FEF9C3", color: P.muted }}>{item}</span>)}</div>}

        {point.url && (
          <a href={point.url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs mt-3 transition-colors"
            style={{ color: P.muted }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = P.text}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = P.muted}
          >
            Chinese Grammar Wiki <ExternalLink size={11} />
          </a>
        )}
      </div>

      {/* Examples */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: P.faint }}>
          Ví dụ ({point.examples.length})
        </p>
        <div className="space-y-3">
          {point.examples.map((ex) => (
            <ExampleCard key={ex.id} ex={ex} />
          ))}
        </div>
      </div>
      <button onClick={onContinue} className="w-full rounded-xl py-3 font-bold text-white flex items-center justify-center gap-2" style={{ background: P.purple }}>Đã hiểu, luyện điền từ <ChevronRight size={17}/></button>
    </div>
  );
}

function ExampleCard({ ex }: { ex: GrammarExample }) {
  const [showPinyin, setShowPinyin] = useState(true);
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: P.border, backgroundColor: P.surface }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-lg font-semibold" style={{ fontFamily: "Noto Sans SC, serif", color: P.text }}>
            {ex.chinese}
          </p>
          {showPinyin && (
            <p className="text-sm mt-1" style={{ color: P.purple }}>{ex.pinyin}</p>
          )}
          <p className="text-sm mt-1.5" style={{ color: P.muted }}>{ex.translation}</p>
        </div>
        <button onClick={() => playTTS(ex.chinese)} className="flex-shrink-0 mt-1 transition-colors"
          style={{ color: P.faint }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = P.purple}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = P.faint}
        >
          <Volume2 size={16} />
        </button>
      </div>
      <button onClick={() => setShowPinyin(v => !v)} className="text-xs mt-2 transition-colors"
        style={{ color: P.faint }}>
        {showPinyin ? "Ẩn pinyin" : "Hiện pinyin"}
      </button>
    </div>
  );
}

// ─── Mode 2: Điền từ (Fill-in-the-blank) ─────────────────────────────────────

interface FillQuestion {
  example: GrammarExample;
  blankIndex: number;
  correctWord: string;
  options: string[];
}

function buildFillQuestions(examples: GrammarExample[], pool: GrammarExample[]): FillQuestion[] {
  const valid = examples.filter(ex => ex.tokens && ex.tokens.length >= 2);
  if (valid.length === 0) return [];
  const selected = shuffle(valid).slice(0, 8);

  return selected.map((ex) => {
    const words = ex.tokens;
    const candidates = words
      .map((w, i) => ({ w: w.replace(/[。，？！、：；]$/, ""), i }))
      .filter(({ w }) => w.length >= 1);

    const chosen = candidates.length > 0
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : { w: words[0]?.replace(/[。，？！、：；]$/, "") ?? "", i: 0 };

    if (!chosen.w) return null;

    // Tạo distractors — lấy từ pool toàn bộ examples của level
    const poolWords = pool
      .flatMap(e => (e.tokens ?? []).map(w => w.replace(/[。，？！、：；]$/, "").trim()))
      .filter(w => w.length > 0 && w !== chosen.w);
    const unique = Array.from(new Set(poolWords));
    // Nếu không đủ 3 distractor thật, dùng fallback cứng
    const fallbacks = ["在", "的", "了", "是", "不", "我", "你", "他", "她", "我们", "这", "那"];
    const extra = fallbacks.filter(f => f !== chosen.w && !unique.includes(f));
    const allPool = [...unique, ...extra];
    const distractors = shuffle(allPool).slice(0, 3);

    // Đảm bảo đủ 4 options
    const options = shuffle([chosen.w, ...distractors]).slice(0, 4);
    if (!options.includes(chosen.w)) options[0] = chosen.w;

    return {
      example: ex,
      blankIndex: chosen.i,
      correctWord: chosen.w,
      options: shuffle(options),
    };
  }).filter((q): q is FillQuestion => q !== null);
}

function FillMode({ point }: { point: GrammarPoint }) {
  const [questions, setQuestions] = useState<FillQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const init = useCallback(() => {
    setQuestions(buildFillQuestions(point.examples, point.examples));
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setDone(false);
  }, [point.examples]);

  useEffect(() => { init(); }, [init]);

  if (questions.length === 0) return (
    <p className="text-center py-12" style={{ color: P.muted }}>Đang tải...</p>
  );

  const q = questions[current];

  if (done) {
    return <FillDone score={score} total={questions.length} onRestart={init} levelNumber={0} pointId={point.id} />;
  }

  const handleSelect = (opt: string) => {
    if (selected) return;
    setSelected(opt);
    if (opt === q.correctWord) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (current + 1 >= questions.length) { setDone(true); return; }
    setCurrent(c => c + 1);
    setSelected(null);
  };

  const isCorrect = selected === q.correctWord;

  return (
    <div className="space-y-5">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs">
        <span style={{ color: P.muted }}>{current + 1}/{questions.length}</span>
        <span style={{ color: P.green }}>{score} đúng</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: P.border }}>
        <div className="h-full rounded-full transition-all" style={{
          width: `${(current / questions.length) * 100}%`,
          background: P.blue,
        }} />
      </div>

      {/* Question card */}
      <div className="rounded-2xl border p-5" style={{ borderColor: P.border, backgroundColor: P.surface }}>
        <p className="text-xs mb-4" style={{ color: P.faint }}>Chọn từ thích hợp để điền vào chỗ trống:</p>
        <p className="text-lg leading-relaxed mb-1" style={{ fontFamily: "Noto Sans SC, serif", color: P.text }}>
          {q.example.tokens.map((w, i) => {
            const displayW = w.replace(/[。，？！、：；]$/, "");
            const suffix = w !== displayW ? w.slice(-1) : "";
            if (i === q.blankIndex) {
              return (
                <span key={i}>
                  <span className="inline-block min-w-[3rem] text-center border-b-2 font-bold px-1 transition-colors"
                    style={{
                      borderColor: !selected ? P.blue : isCorrect ? P.green : P.red,
                      color:       !selected ? P.blue : isCorrect ? P.green : P.red,
                    }}>
                    {selected ?? "___"}
                  </span>{suffix}
                </span>
              );
            }
            return <span key={i}>{w} </span>;
          })}
        </p>

        {selected && (
          <div className="mt-3 rounded-xl px-3 py-2 text-sm flex items-center gap-2"
            style={{
              background: isCorrect ? "rgba(5,150,105,0.08)" : "rgba(192,57,43,0.08)",
              color: isCorrect ? P.green : P.red,
            }}>
            {isCorrect ? <CheckCircle size={15} /> : <XCircle size={15} />}
            {isCorrect ? "Chính xác!" : `Đáp án đúng: ${q.correctWord}`}
          </div>
        )}
        {selected && <p className="text-sm mt-3" style={{ color: P.muted }}>{q.example.translation}</p>}
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-2">
        {q.options.map((opt) => (
          <button key={opt} onClick={() => handleSelect(opt)} disabled={!!selected}
            className="py-3 px-4 rounded-xl text-sm font-medium border transition-all active:scale-[0.98] disabled:cursor-default"
            style={{
              fontFamily: "Noto Sans SC, serif",
              borderColor: !selected ? P.border
                : opt === q.correctWord ? P.green
                : opt === selected ? P.red
                : P.border,
              background: !selected ? P.surface
                : opt === q.correctWord ? "rgba(5,150,105,0.08)"
                : opt === selected ? "rgba(192,57,43,0.08)"
                : P.surface,
              color: !selected ? P.text
                : opt === q.correctWord ? P.green
                : opt === selected ? P.red
                : P.faint,
            }}
          >
            {opt}
          </button>
        ))}
      </div>

      {selected && (
        <button onClick={handleNext}
          className="w-full py-3 rounded-xl font-semibold text-white transition-all text-sm"
          style={{ background: "linear-gradient(135deg,#6C3CE1,#A78BFA)" }}>
          {current + 1 < questions.length ? "Câu tiếp →" : "Xem kết quả"}
        </button>
      )}
    </div>
  );
}

function FillDone({ score, total, onRestart, pointId }: {
  score: number; total: number; onRestart: () => void;
  levelNumber: number; pointId: string;
}) {
  const { user } = useAuth();
  const pct = Math.round((score / total) * 100);

  // Sync lên DB khi vừa hoàn thành
  useEffect(() => {
    if (user) {
      fetch("/api/progress/grammar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pointId, mode: "fill", score: pct, total }),
      }).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center py-10 text-center">
      <div className="rounded-2xl border p-8 w-full max-w-sm" style={{ borderColor: P.border, backgroundColor: P.surface }}>
        <CheckCircle size={48} className="mx-auto mb-4" style={{ color: P.blue }} />
        <h2 className="text-xl font-bold mb-1" style={{ color: P.text }}>Hoàn thành!</h2>
        <p className="text-sm mb-6" style={{ color: P.muted }}>Điền từ</p>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Stat label="Câu" value={total} />
          <Stat label="Đúng" value={score} color={P.green} />
          <Stat label="Điểm" value={`${pct}%`} color={pct >= 80 ? P.blue : P.muted} />
        </div>
        <button onClick={onRestart}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all"
          style={{ borderColor: P.border, color: P.muted, background: "#FFF3B0" }}>
          <RotateCcw size={14} /> Làm lại
        </button>
      </div>
    </div>
  );
}

// ─── Mode 3: Sắp xếp câu (Word Sort) ─────────────────────────────────────────

interface SortQuestion {
  example: GrammarExample;
  tokens: string[];
  correct: string[];
}

function buildSortQuestions(examples: GrammarExample[]): SortQuestion[] {
  const valid = examples.filter(ex => ex.tokens && ex.tokens.length >= 2);
  return shuffle(valid).slice(0, 6).map((ex) => ({
    example: ex,
    tokens: shuffle(ex.tokens),
    correct: ex.tokens,
  }));
}

function SortMode({ point }: { point: GrammarPoint }) {
  const [questions, setQuestions] = useState<SortQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [arranged, setArranged] = useState<string[]>([]);
  const [pool, setPool] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const init = useCallback(() => {
    const qs = buildSortQuestions(point.examples);
    setQuestions(qs);
    if (qs.length > 0) {
      setPool([...qs[0].tokens]);
      setArranged([]);
    }
    setCurrent(0);
    setChecked(false);
    setScore(0);
    setDone(false);
  }, [point.examples]);

  useEffect(() => { init(); }, [init]);

  if (questions.length === 0) return (
    <p className="text-center py-12" style={{ color: P.muted }}>Đang tải...</p>
  );

  const q = questions[current];
  const isCorrect = checked && JSON.stringify(arranged) === JSON.stringify(q.correct);

  if (done) return <SortDone score={score} total={questions.length} onRestart={init} pointId={point.id} />;

  const moveToArranged = (word: string, idx: number) => {
    if (checked) return;
    const newPool = [...pool]; newPool.splice(idx, 1);
    setPool(newPool); setArranged([...arranged, word]);
  };

  const moveToPool = (word: string, idx: number) => {
    if (checked) return;
    const newArr = [...arranged]; newArr.splice(idx, 1);
    setArranged(newArr); setPool([...pool, word]);
  };

  const handleCheck = () => {
    setChecked(true);
    if (JSON.stringify(arranged) === JSON.stringify(q.correct)) setScore(s => s + 1);
  };

  const handleNext = () => {
    const nextIdx = current + 1;
    if (nextIdx >= questions.length) { setDone(true); return; }
    setCurrent(nextIdx);
    setPool([...questions[nextIdx].tokens]);
    setArranged([]); setChecked(false);
  };

  return (
    <div className="space-y-5">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs">
        <span style={{ color: P.muted }}>{current + 1}/{questions.length}</span>
        <span style={{ color: P.green }}>{score} đúng</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: P.border }}>
        <div className="h-full rounded-full transition-all" style={{
          width: `${(current / questions.length) * 100}%`,
          background: P.green,
        }} />
      </div>

      {/* Instruction */}
      <div className="rounded-2xl border p-4" style={{ borderColor: P.border, backgroundColor: P.surface }}>
        <p className="text-xs mb-1" style={{ color: P.faint }}>Sắp xếp thành câu hoàn chỉnh:</p>
      </div>

      {/* Arranged zone */}
      <div>
        <p className="text-xs mb-2" style={{ color: P.faint }}>Câu của bạn:</p>
        <div className="min-h-[56px] rounded-2xl border-2 border-dashed p-3 flex flex-wrap gap-2 transition-colors"
          style={{
            borderColor: !checked ? P.border : isCorrect ? P.green : P.red,
            backgroundColor: !checked ? "#FFF8D6"
              : isCorrect ? "rgba(5,150,105,0.06)" : "rgba(192,57,43,0.06)",
          }}>
          {arranged.map((w, i) => (
            <button key={`arr-${i}-${w}`} onClick={() => moveToPool(w, i)} disabled={checked}
              className="px-3 py-1.5 rounded-xl text-sm font-medium transition-all active:scale-95"
              style={{
                fontFamily: "Noto Sans SC, serif",
                background: checked
                  ? isCorrect ? "rgba(5,150,105,0.12)" : "rgba(192,57,43,0.12)"
                  : "rgba(124,58,237,0.10)",
                color: checked
                  ? isCorrect ? P.green : P.red
                  : P.purple,
              }}>
              {w}
            </button>
          ))}
          {arranged.length === 0 && (
            <p className="text-xs self-center" style={{ color: P.faint }}>
              Nhấn từ bên dưới để thêm vào đây...
            </p>
          )}
        </div>
      </div>

      {/* Word pool */}
      <div>
        <p className="text-xs mb-2" style={{ color: P.faint }}>Từ có sẵn:</p>
        <div className="flex flex-wrap gap-2">
          {pool.map((w, i) => (
            <button key={`pool-${i}-${w}`} onClick={() => moveToArranged(w, i)} disabled={checked}
              className="px-3 py-1.5 rounded-xl text-sm font-medium transition-all active:scale-95 disabled:opacity-50"
              style={{
                fontFamily: "Noto Sans SC, serif",
                background: P.border,
                color: P.text,
              }}>
              {w}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback */}
      {checked && (
        <div className="rounded-xl px-4 py-3 text-sm"
          style={{
            background: isCorrect ? "rgba(5,150,105,0.08)" : "rgba(192,57,43,0.08)",
          }}>
          {isCorrect ? (
            <p className="flex items-center gap-2" style={{ color: P.green }}>
              <CheckCircle size={15} /> Chính xác!
            </p>
          ) : (
            <div>
              <p className="flex items-center gap-2 mb-1" style={{ color: P.red }}>
                <XCircle size={15} /> Chưa đúng.
              </p>
              <p className="text-xs" style={{ color: P.muted }}>
                Đáp án:{" "}
                <span style={{ fontFamily: "Noto Sans SC, serif", color: P.text }}>
                  {q.correct.join(" ")}
                </span>
              </p>
              <p className="text-xs mt-0.5" style={{ color: P.faint }}>{q.example.pinyin}</p>
            </div>
          )}
        </div>
      )}
      {checked && <p className="text-sm" style={{ color: P.muted }}>{q.example.translation}</p>}

      {/* Buttons */}
      {!checked ? (
        <button onClick={handleCheck} disabled={arranged.length === 0}
          className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all disabled:opacity-40"
          style={{ background: "linear-gradient(135deg,#1B9E6E,#22C55E)" }}>
          Kiểm tra
        </button>
      ) : (
        <button onClick={handleNext}
          className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all"
          style={{ background: "linear-gradient(135deg,#6C3CE1,#A78BFA)" }}>
          {current + 1 < questions.length ? "Câu tiếp →" : "Xem kết quả"}
        </button>
      )}
    </div>
  );
}

function SortDone({ score, total, onRestart, pointId }: {
  score: number; total: number; onRestart: () => void; pointId: string;
}) {
  const { user } = useAuth();
  const pct = Math.round((score / total) * 100);

  useEffect(() => {
    if (user) {
      fetch("/api/progress/grammar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pointId, mode: "sort", score: pct, total }),
      }).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center py-10 text-center">
      <div className="rounded-2xl border p-8 w-full max-w-sm" style={{ borderColor: P.border, backgroundColor: P.surface }}>
        <CheckCircle size={48} className="mx-auto mb-4" style={{ color: P.green }} />
        <h2 className="text-xl font-bold mb-1" style={{ color: P.text }}>Hoàn thành!</h2>
        <p className="text-sm mb-6" style={{ color: P.muted }}>Sắp xếp câu</p>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Stat label="Câu" value={total} />
          <Stat label="Đúng" value={score} color={P.green} />
          <Stat label="Điểm" value={`${pct}%`} color={pct >= 80 ? P.green : P.muted} />
        </div>
        <button onClick={onRestart}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all"
          style={{ borderColor: P.border, color: P.muted, background: "#FFF3B0" }}>
          <RotateCcw size={14} /> Làm lại
        </button>
      </div>
    </div>
  );
}

// ─── Shared ───────────────────────────────────────────────────────────────────

function Stat({ label, value, color = P.text }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="rounded-xl p-3" style={{ backgroundColor: "#FFF3B0" }}>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: P.faint }}>{label}</p>
    </div>
  );
}
