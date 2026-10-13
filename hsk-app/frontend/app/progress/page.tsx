"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { loadLessonProgress, loadProgress, loadGateStore, localDateKey } from "@/lib/hskData";
import { useAuth } from "@/components/auth/AuthProvider";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { BarChart2, BookOpen, Zap, Trophy, Home } from "lucide-react";

const P = {
  bg:        "#FFFBEA",
  surface:   "#FFF8D6",
  surfaceH:  "#FFF3B0",
  border:    "#E8D98A",
  text:      "#1C1408",
  muted:     "#78614A",
  faint:     "#A8956A",
};

const LEVELS = [1,2,3,4,5,6,7];
const LESSONS_PER_LEVEL = 15;

const LEVEL_COLOR: Record<number, string> = {
  1:"#C0392B", 2:"#2563EB", 3:"#7C3AED",
  4:"#059669", 5:"#B45309", 6:"#EA580C", 7:"#9333EA",
};

export default function ProgressPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [lessonData, setLessonData] = useState<Record<string, { completed: number; total: number }>>({});
  const [totalCards, setTotalCards] = useState(0);
  const [dueToday, setDueToday]     = useState(0);
  const [totalLessons, setTotalLessons] = useState(0);
  const [totalGates, setTotalGates]    = useState(0);

  useEffect(() => {
    setMounted(true);

    if (user) {
      // Đọc từ DB khi đã đăng nhập
      Promise.all([
        fetch("/api/progress/lesson", { credentials: "include" }).then(r => r.ok ? r.json() : null),
        fetch("/api/progress/gate",   { credentials: "include" }).then(r => r.ok ? r.json() : null),
        fetch(`/api/review?date=${localDateKey()}`, { credentials: "include" }).then(r => r.ok ? r.json() : null),
      ]).then(([lessonRes, gateRes, reviewRes]) => {
        const byLevel: Record<string, { completed: number; total: number }> = {};

        for (const lvl of LEVELS) {
          byLevel[lvl] = { completed: 0, total: LESSONS_PER_LEVEL };
        }

        if (lessonRes?.lessons) {
          const lessons: { lessonId: string; completed: boolean }[] = lessonRes.lessons;
          let done = 0;
          for (const l of lessons) {
            if (l.completed) {
              done++;
              const m = l.lessonId.match(/^new-(\d+)-lesson-\d+$/);
              if (m) {
                const lvl = parseInt(m[1]);
                if (byLevel[lvl]) byLevel[lvl].completed++;
              }
            }
          }
          setTotalLessons(done);
        }

        if (gateRes?.gates) {
          setTotalGates((gateRes.gates as { passed: boolean }[]).filter(g => g.passed).length);
        }

        if (reviewRes) {
          setTotalCards(reviewRes.totalCards ?? 0);
          setDueToday(reviewRes.dueCount ?? 0);
        }

        setLessonData(byLevel);
      }).catch(console.error);
    } else {
      // Fallback localStorage khi chưa đăng nhập
      const lp   = loadLessonProgress();
      const sm2  = loadProgress();
      const gate = loadGateStore();
      const today = localDateKey();

      const byLevel: Record<string, { completed: number; total: number }> = {};
      for (const lvl of LEVELS) {
        let completed = 0;
        for (let i = 1; i <= LESSONS_PER_LEVEL; i++) {
          if (lp[`new-${lvl}-lesson-${i}`]?.completed) completed++;
        }
        byLevel[lvl] = { completed, total: LESSONS_PER_LEVEL };
      }
      setLessonData(byLevel);

      const allLessons = Object.values(lp).filter(l => l.completed).length;
      setTotalLessons(allLessons);

      const cards = Object.values(sm2);
      setTotalCards(cards.length);
      setDueToday(cards.filter(c => c.nextReview <= today).length);
      setTotalGates(Object.values(gate).filter(g => g.passed).length);
    }
  }, [user]);

  if (!mounted) return null;

  return (
    <ProtectedRoute>
      <div className="min-h-screen" style={{ background: P.bg }}>
      {/* Header */}
      <div className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#FFF3B0,#FFFBEA,#FFF8D6)" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <nav className="flex items-center gap-1.5 mb-5 text-xs" style={{ color: P.faint }}>
            <Link href="/" className="flex items-center gap-1 hover:text-[#1C1408] transition-colors">
              <Home size={11} /> Trang chủ
            </Link>
            <span>/</span>
            <span style={{ color: P.muted }}>Tiến độ</span>
          </nav>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#B45309,#D97706)" }}>
              <BarChart2 size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold" style={{ color: P.text }}>Tiến độ học</h1>
              <p className="text-sm" style={{ color: P.muted }}>Thống kê toàn bộ quá trình học của bạn</p>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: <BookOpen size={18}/>, label: "Bài hoàn thành", value: totalLessons, color: "#B45309" },
              { icon: <Zap size={18}/>,      label: "Đang ôn SM-2",    value: totalCards,   color: "#7C3AED" },
              { icon: <BarChart2 size={18}/>, label: "Cần ôn hôm nay", value: dueToday,     color: dueToday > 0 ? "#C0392B" : "#059669" },
              { icon: <Trophy size={18}/>,   label: "Kiểm tra đạt",    value: totalGates,   color: "#059669" },
            ].map(s => (
              <div key={s.label} className="rounded-2xl border p-4"
                style={{ background: P.surface, borderColor: P.border }}>
                <div className="flex items-center gap-2 mb-2" style={{ color: s.color }}>{s.icon}</div>
                <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs mt-0.5" style={{ color: P.faint }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Per-level progress */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h2 className="text-lg font-bold mb-4" style={{ color: P.text }}>Tiến độ từng cấp độ</h2>
        <div className="space-y-3">
          {LEVELS.map(lvl => {
            const d = lessonData[lvl] ?? { completed: 0, total: LESSONS_PER_LEVEL };
            const pct = d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0;
            const color = LEVEL_COLOR[lvl];
            return (
              <div key={lvl} className="rounded-2xl border p-4"
                style={{ background: P.surface, borderColor: P.border }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-extrabold text-white"
                      style={{ background: color }}>
                      {lvl}
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: P.text }}>HSK {lvl}</p>
                      <p className="text-xs" style={{ color: P.faint }}>{d.completed}/{d.total} bài</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold" style={{ color: pct > 0 ? color : P.faint }}>{pct}%</span>
                    <Link href="/vocabulary"
                      className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all hover:brightness-95"
                      style={{ background: `${color}18`, color }}>
                      Học tiếp
                    </Link>
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: P.surfaceH }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA nếu chưa học gì */}
        {totalLessons === 0 && (
          <div className="text-center mt-10">
            <p className="text-sm mb-4" style={{ color: P.muted }}>
              Bạn chưa hoàn thành bài học nào. Bắt đầu từ HSK 1 nhé!
            </p>
            <Link href="/vocabulary"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white hover:brightness-110 transition-all"
              style={{ background: "linear-gradient(135deg,#B45309,#D97706)" }}>
              <BookOpen size={16}/> Bắt đầu học
            </Link>
          </div>
        )}

        {/* Ôn tập nếu có từ cần ôn */}
        {dueToday > 0 && (
          <div className="mt-6 rounded-2xl border p-5 flex items-center justify-between gap-4"
            style={{ background: "rgba(192,57,43,0.06)", borderColor: "rgba(192,57,43,0.3)" }}>
            <div>
              <p className="font-bold text-sm" style={{ color: "#C0392B" }}>
                {dueToday} từ cần ôn hôm nay!
              </p>
              <p className="text-xs mt-0.5" style={{ color: P.muted }}>
                Ôn tập ngay để duy trì trí nhớ dài hạn.
              </p>
            </div>
            <Link href="/review"
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white hover:brightness-110 transition-all"
              style={{ background: "linear-gradient(135deg,#C0392B,#E74C3C)" }}>
              <Zap size={14}/> Ôn ngay
            </Link>
          </div>
        )}
      </div>
    </div>
    </ProtectedRoute>
  );
}
