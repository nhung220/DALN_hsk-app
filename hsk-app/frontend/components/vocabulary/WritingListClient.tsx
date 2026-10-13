"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { LevelMeta } from "@/types/hsk";
import { loadLessonProgress, type LessonProgressEntry } from "@/lib/hskData";
import { PenTool, CheckCircle, Lock } from "lucide-react";

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

const LEVEL_COLOR: Record<number, string> = {
  1:"#C0392B", 2:"#2563EB", 3:"#7C3AED",
  4:"#059669", 5:"#B45309", 6:"#EA580C", 7:"#9333EA",
};
const LEVEL_BADGE: Record<number, string> = {
  1:"Cơ bản", 2:"Cơ bản", 3:"Trung cấp",
  4:"Trung cấp", 5:"Cao cấp", 6:"Cao cấp", 7:"Thành thạo",
};

interface Props { levels: LevelMeta[] }

export default function WritingListClient({ levels }: Props) {
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [progress, setProgress] = useState<Record<string, LessonProgressEntry>>({});

  useEffect(() => {
    setProgress(loadLessonProgress());
    const onFocus = () => setProgress(loadLessonProgress());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const currentLevel = levels.find(l => l.levelNumber === selectedLevel) ?? levels[0];
  const color = LEVEL_COLOR[selectedLevel] ?? "#B45309";
  const totalLessons = currentLevel?.totalLessons ?? 15;

  return (
    <div className="min-h-screen" style={{ background: P.bg }}>

      {/* ── Hero ── */}
      <div className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#FFF3B0 0%,#FFFBEA 50%,#FFF8D6 100%)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#9333EA,#B45309)" }}>
              <PenTool size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold" style={{ color: P.text }}>Luyện viết Hán tự</h1>
              <p className="text-sm" style={{ color: P.textMuted }}>
                Luyện viết đúng thứ tự nét · Tra nét · Tự kiểm tra
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Level tabs ── */}
        <div className="flex flex-wrap gap-2 mb-8">
          {levels.map(lv => {
            const c = LEVEL_COLOR[lv.levelNumber] ?? "#B45309";
            const done = Array.from({ length: lv.totalLessons }, (_, i) =>
              progress[`new-${lv.levelNumber}-lesson-${i + 1}`]?.completed ? 1 : 0
            ).reduce((a: number, b: number) => a + b, 0);
            const active = selectedLevel === lv.levelNumber;
            return (
              <button key={lv.levelNumber}
                onClick={() => setSelectedLevel(lv.levelNumber)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={active
                  ? { background: c, color: "#fff", boxShadow: `0 0 0 2px ${c}55` }
                  : { background: P.surface, color: P.textMuted, border: `1px solid ${P.border}` }}>
                <span className="font-extrabold">HSK {lv.levelNumber}</span>
                <span className="text-xs opacity-70">{done}/{lv.totalLessons}</span>
              </button>
            );
          })}
        </div>

        {/* ── Level header ── */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base font-extrabold text-white"
            style={{ background: color }}>
            {selectedLevel}
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: P.text }}>
              HSK {selectedLevel} — Luyện viết
            </h2>
            <p className="text-xs" style={{ color: P.textMuted }}>
              {LEVEL_BADGE[selectedLevel]} · {totalLessons} bài
            </p>
          </div>
        </div>

        {/* ── Lesson grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: totalLessons }, (_, i) => {
            const lessonNum = i + 1;
            const lessonId  = `new-${selectedLevel}-lesson-${lessonNum}`;
            const done      = progress[lessonId]?.completed ?? false;
            const score     = progress[lessonId]?.score;

            return (
              <Link key={lessonId}
                href={`/vocabulary/writing/${lessonId}`}
                className="group rounded-2xl border p-4 transition-all hover:shadow-md hover:scale-[1.01]"
                style={{
                  background:  done ? `${color}0C` : P.surface,
                  borderColor: done ? `${color}50` : P.border,
                }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    {/* Số thứ tự */}
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                      style={{
                        background: done ? color : P.surfaceHover,
                        color:      done ? "#fff" : P.textMuted,
                      }}>
                      {done ? <CheckCircle size={14} /> : lessonNum}
                    </span>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: P.text }}>
                        Bài {lessonNum}
                      </p>
                      <p className="text-xs" style={{ color: P.textFaint }}>
                        {currentLevel?.wordsPerLesson ?? 20} từ
                      </p>
                    </div>
                  </div>

                  {done && score !== undefined && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${color}18`, color }}>
                      {score}%
                    </span>
                  )}
                </div>

                {/* CTA */}
                <div
                  className="w-full py-2 rounded-xl text-xs font-semibold text-center transition-all group-hover:brightness-95"
                  style={{
                    background: done ? `${color}20` : P.surfaceHover,
                    color:      done ? color : P.textMuted,
                  }}>
                  {done ? "✓ Luyện lại" : "Bắt đầu luyện viết"}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
