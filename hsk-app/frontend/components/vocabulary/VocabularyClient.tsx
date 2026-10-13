"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { LevelMeta } from "@/types/hsk";
import {
  loadLessonProgress, type LessonProgressEntry,
  loadGateStore, type GateStore,
  isSetUnlocked, getGateEntry,
  PASS_THRESHOLD,
} from "@/lib/hskData";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  Zap, BarChart2, Clock, Volume2, BookOpen,
  ClipboardCheck, Flame, PenTool, Gamepad2, Home,
  Lock, Trophy, AlertTriangle, Search,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  levels: LevelMeta[];
}

// ─── Level config ─────────────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<number, {
  accent: string;
  bg: string;
  border: string;
  badge: string;
  badgeBg: string;
  label: string;
  desc: string;
}> = {
  1: {
    accent: "#C0392B",
    bg: "linear-gradient(135deg,#FDECEA 0%,#FFF3F0 100%)",
    border: "rgba(192,57,43,0.25)",
    badge: "Cơ bản",
    badgeBg: "rgba(192,57,43,0.12)",
    label: "HSK 1",
    desc: "Xây nền giao tiếp cơ bản với 15 từ mỗi bài, nhịp học chậm và rõ.",
  },
  2: {
    accent: "#2563EB",
    bg: "linear-gradient(135deg,#EEF4FF 0%,#F5F0FF 100%)",
    border: "rgba(37,99,235,0.25)",
    badge: "Cơ bản",
    badgeBg: "rgba(37,99,235,0.12)",
    label: "HSK 2",
    desc: "Mở rộng vốn từ thông dụng với nhịp 15 từ mỗi bài, bám sát HSK 3.0.",
  },
  3: {
    accent: "#7C3AED",
    bg: "linear-gradient(135deg,#F5F0FF 0%,#FAF0FF 100%)",
    border: "rgba(124,58,237,0.25)",
    badge: "Trung cấp",
    badgeBg: "rgba(124,58,237,0.12)",
    label: "HSK 3",
    desc: "Đi vào trung cấp, gom từ theo nhịp 15 từ mỗi bài để luyện sâu hơn.",
  },
  4: {
    accent: "#059669",
    bg: "linear-gradient(135deg,#ECFDF5 0%,#F0FDF4 100%)",
    border: "rgba(5,150,105,0.25)",
    badge: "Trung cấp",
    badgeBg: "rgba(5,150,105,0.12)",
    label: "HSK 4",
    desc: "Nâng cao khả năng diễn đạt với từ vựng học thuật và tình huống thực tế.",
  },
  5: {
    accent: "#B45309",
    bg: "linear-gradient(135deg,#FFFBEA 0%,#FFF8D6 100%)",
    border: "rgba(180,83,9,0.25)",
    badge: "Cao cấp",
    badgeBg: "rgba(180,83,9,0.12)",
    label: "HSK 5",
    desc: "Thành thạo từ vựng chuyên ngành, luyện đọc văn bản phức tạp.",
  },
  6: {
    accent: "#EA580C",
    bg: "linear-gradient(135deg,#FFF7ED 0%,#FFEDD5 100%)",
    border: "rgba(234,88,12,0.25)",
    badge: "Cao cấp",
    badgeBg: "rgba(234,88,12,0.12)",
    label: "HSK 6",
    desc: "Chinh phục từ vựng cấp độ báo chí, văn học và phân tích ngôn ngữ.",
  },
  7: {
    accent: "#9333EA",
    bg: "linear-gradient(135deg,#FAF5FF 0%,#F5F0FF 100%)",
    border: "rgba(147,51,234,0.25)",
    badge: "Thành thạo",
    badgeBg: "rgba(147,51,234,0.12)",
    label: "HSK 7",
    desc: "Đỉnh cao năng lực, từ vựng hàn lâm và chuyên sâu theo lĩnh vực.",
  },
};

// Màu palette vàng nhạt dùng chung
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

// ─── Main component ───────────────────────────────────────────────────────────

export default function VocabularyClient({ levels }: Props) {
  const { user } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [progress, setProgress]   = useState<Record<string, LessonProgressEntry>>({});
  const [gateStore, setGateStore] = useState<GateStore>({});
  const lessonsRef = useRef<HTMLDivElement>(null);

  // Load progress: từ DB nếu đã đăng nhập, từ localStorage nếu chưa
  const loadProgress = async () => {
    if (user) {
      try {
        const [lessonRes, gateRes] = await Promise.all([
          fetch("/api/progress/lesson", { credentials: "include" }),
          fetch("/api/progress/gate",   { credentials: "include" }),
        ]);
        if (lessonRes.ok) {
          const data = await lessonRes.json() as { lessons: { lessonId: string; completed: boolean; score: number | null; completedAt: string | null }[] };
          const map: Record<string, LessonProgressEntry> = {};
          for (const l of data.lessons) map[l.lessonId] = { completed: l.completed, score: l.score ?? undefined };
          setProgress(map);
        }
        if (gateRes.ok) {
          const data = await gateRes.json() as { gates: { setId: string; passed: boolean; score: number; attempts: number; lastAttemptAt: string }[] };
          const map: GateStore = {};
          for (const g of data.gates) map[g.setId] = {
            passed: g.passed,
            score: g.score,
            attempts: g.attempts,
            lastAttemptAt: g.lastAttemptAt,
          };
          setGateStore(map);
        }
      } catch {
        // fallback localStorage
        setProgress(loadLessonProgress());
        setGateStore(loadGateStore());
      }
    } else {
      setProgress(loadLessonProgress());
      setGateStore(loadGateStore());
    }
  };

  useEffect(() => {
    loadProgress();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onFocus = () => { loadProgress(); };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalLessons = levels.reduce((a, lv) => a + lv.totalLessons, 0);
  const totalWords   = levels.reduce((a, lv) => a + lv.totalLessons * lv.wordsPerLesson, 0);

  const currentLevel = levels.find((l) => l.levelNumber === selectedLevel) ?? levels[0];
  const cfg = LEVEL_CONFIG[selectedLevel ?? 1] ?? LEVEL_CONFIG[1];

  const handleSelectLevel = (n: number) => {
    setSelectedLevel(n);
    setTimeout(() => {
      lessonsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const handleBackToLevels = () => {
    setSelectedLevel(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Chưa chọn cấp: hiển thị hero + grid cấp độ ──────────────────────────
  if (selectedLevel === null) {
    return (
      <div style={{ minHeight: "100vh", background: P.bg }}>

        {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
        <div
          className="relative overflow-hidden"
          style={{ background: "linear-gradient(135deg,#FFF8D6 0%,#FFFBEA 50%,#FFF3B0 100%)" }}
        >
          {/* Decorative glow */}
          <div className="pointer-events-none absolute -top-32 -left-16 w-96 h-96 rounded-full opacity-30"
            style={{ background: "radial-gradient(circle,#F59E0B55,transparent 70%)" }} />
          <div className="pointer-events-none absolute top-0 right-1/4 w-72 h-72 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle,#B4530922,transparent 70%)" }} />

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            {/* ── Back to Home ── */}
            <div className="mb-4">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
                style={{ color: P.textFaint }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = P.text}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = P.textFaint}
              >
                <Home size={13} />
                Trang chủ
              </Link>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-start gap-6">

              {/* ── Left ── */}
              <div className="flex-1 min-w-0">
                <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mb-4 text-xs font-semibold"
                  style={{ background: "rgba(180,83,9,0.12)", color: "#B45309", border: "1px solid rgba(180,83,9,0.25)" }}>
                  <Flame size={11} /> HSK 3.0 · Lesson mới
                </div>

                <h1 className="text-3xl sm:text-4xl font-extrabold mb-3 leading-tight" style={{ color: P.text }}>
                  Từ Vựng <span style={{ color: "#C0392B" }}>HSK 3.0</span>
                </h1>

                <p className="text-sm sm:text-base leading-relaxed max-w-lg mb-5" style={{ color: P.textMuted }}>
                  Toàn bộ HSK 1 → HSK 7-9 chia nhỏ thành lesson ngắn 15–20 từ. Giữ nguyên
                  audio, flashcard và các dạng bài tập thực hành tương tác trực quan.
                </p>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleSelectLevel(1)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110 active:scale-95"
                    style={{ background: "linear-gradient(135deg,#C0392B,#E74C3C)" }}
                  >
                    <Flame size={15} /> Bắt đầu từ HSK 1
                  </button>
                  <Link
                    href="/search"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border"
                    style={{ color: P.textMuted, borderColor: P.border, background: P.surface }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = P.text; (e.currentTarget as HTMLElement).style.background = P.surfaceHover; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = P.textMuted; (e.currentTarget as HTMLElement).style.background = P.surface; }}
                  >
                    <Search size={15} /> Tra từ điển
                  </Link>
                </div>
              </div>

              {/* ── Right: stats card ── */}
              <div className="lg:w-[340px] flex-shrink-0 rounded-2xl border p-5"
                style={{ background: P.surface, borderColor: P.border }}>
                <div className="flex items-center justify-around border-b pb-4 mb-4"
                  style={{ borderColor: P.borderLight }}>
                  <StatCell value={String(levels.length)} label="Cấp độ"  color={P.text} />
                  <StatCell value={String(totalLessons)}   label="Bài học" color="#C0392B" />
                  <StatCell
                    value={totalWords >= 1000 ? `${(totalWords / 1000).toFixed(1).replace(".0", "")}k+` : `${totalWords}+`}
                    label="Từ vựng" color="#B45309"
                  />
                </div>
                <ul className="space-y-2.5">
                  <FeatureLine icon={<Zap     size={14} style={{ color: "#B45309" }} />} text="Flashcard, chọn nghĩa, luyện nghe" />
                  <FeatureLine icon={<BarChart2 size={14} style={{ color: "#2563EB" }} />} text="Theo dõi tiến độ từng level" />
                  <FeatureLine icon={<Clock   size={14} style={{ color: "#059669" }} />} text="Lesson ngắn, học nhanh, ôn đều" />
                  <FeatureLine icon={<Volume2 size={14} style={{ color: "#7C3AED" }} />} text="Audio & ghi chú đầy đủ" />
                  <li>
                    <Link href="/notebook" className="flex items-center gap-2.5 text-sm transition-colors" style={{ color: P.textMuted }}>
                      <span className="flex-shrink-0"><Search size={14} style={{ color: "#B45309" }} /></span>
                      Sổ tay · lưu từ & ghi chú cá nhân
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* ══ LEVEL GRID ════════════════════════════════════════════════════════ */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold" style={{ color: P.text }}>Chọn cấp độ</h2>
            <span className="text-xs font-semibold border px-3 py-1.5 rounded-lg"
              style={{ color: P.textMuted, borderColor: P.border, background: P.surface }}>
              {levels.length} cấp độ
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            {levels.map((lv) => {
              const c = LEVEL_CONFIG[lv.levelNumber] ?? LEVEL_CONFIG[1];
              const done = Array.from({ length: lv.totalLessons }, (_, i) => {
                const id = `new-${lv.levelNumber}-lesson-${i + 1}`;
                return progress[id]?.completed ? 1 : 0;
              }).reduce((a: number, b: number) => a + b, 0);
              const pct = lv.totalLessons > 0 ? Math.round((done / lv.totalLessons) * 100) : 0;

              return (
                <button
                  key={lv.levelNumber}
                  onClick={() => handleSelectLevel(lv.levelNumber)}
                  className="relative rounded-2xl border p-4 text-left cursor-pointer transition-all duration-200 hover:scale-[1.03]"
                  style={{
                    background: P.surface,
                    borderColor: P.border,
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = c.bg;
                    (e.currentTarget as HTMLElement).style.borderColor = c.accent;
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 1px ${c.accent}55, 0 4px 20px ${c.accent}22`;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = P.surface;
                    (e.currentTarget as HTMLElement).style.borderColor = P.border;
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-extrabold mb-2"
                    style={{ background: c.accent, color: "#fff" }}>
                    {lv.levelNumber}
                  </div>
                  <p className="text-sm font-bold mb-0.5" style={{ color: P.text }}>HSK {lv.levelNumber}</p>
                  <p className="text-[10px] mb-2" style={{ color: c.accent }}>{c.badge}</p>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: P.borderLight }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: c.accent }} />
                  </div>
                  <p className="text-[10px] mt-1" style={{ color: P.textFaint }}>{done}/{lv.totalLessons} bài</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Đã chọn cấp: chỉ hiển thị bài học ───────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: P.bg }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Breadcrumb / back */}
        <div className="flex items-center gap-2 mb-6 text-sm">
          <Link href="/" className="flex items-center gap-1 transition-colors" style={{ color: P.textFaint }}>
            <Home size={13} /> Trang chủ
          </Link>
          <span style={{ color: P.border }}>/</span>
          <button onClick={handleBackToLevels} className="transition-colors" style={{ color: P.textFaint }}>
            Chọn cấp độ
          </button>
          <span style={{ color: P.border }}>/</span>
          <span style={{ color: cfg.accent }} className="font-semibold">HSK {selectedLevel}</span>
        </div>

        {/* Level header */}
        <div ref={lessonsRef} className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-extrabold"
              style={{ background: cfg.accent, color: "#fff" }}>
              {selectedLevel}
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: P.text }}>HSK {selectedLevel}</h2>
              <p className="text-xs" style={{ color: P.textMuted }}>{cfg.badge} · {currentLevel?.totalLessons ?? 0} bài học</p>
            </div>
          </div>
          <LevelProgressBadge
            completed={Array.from({ length: currentLevel?.totalLessons ?? 0 }, (_, i) => {
              const id = `new-${selectedLevel}-lesson-${i + 1}`;
              return progress[id]?.completed ? 1 : 0;
            }).reduce((a: number, b: number) => a + b, 0)}
            total={currentLevel?.totalLessons ?? 0}
            accent={cfg.accent}
          />
        </div>

        {/* Lessons */}
        <LessonGrid
          level={selectedLevel}
          totalLessons={currentLevel?.totalLessons ?? 15}
          progress={progress}
          gateStore={gateStore}
          accent={cfg.accent}
        />
      </div>
    </div>
  );
}

// ─── StatCell ─────────────────────────────────────────────────────────────────

function StatCell({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-2xl sm:text-3xl font-extrabold leading-none" style={{ color }}>{value}</span>
      <span className="text-[11px] mt-0.5" style={{ color: P.textFaint }}>{label}</span>
    </div>
  );
}

// ─── FeatureLine ──────────────────────────────────────────────────────────────

function FeatureLine({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <li className="flex items-center gap-2.5 text-sm" style={{ color: P.textMuted }}>
      <span className="flex-shrink-0">{icon}</span>
      {text}
    </li>
  );
}

// ─── LevelProgressBadge ───────────────────────────────────────────────────────

function LevelProgressBadge({ completed, total, accent }: { completed: number; total: number; accent: string }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2.5">
      <div className="text-right">
        <p className="text-xs font-semibold" style={{ color: pct > 0 ? accent : P.textFaint }}>
          {pct}%
        </p>
        <p className="text-[10px]" style={{ color: P.textFaint }}>{completed}/{total} bài xong</p>
      </div>
      <svg width="36" height="36" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="15" fill="none" stroke={P.borderLight} strokeWidth="3" />
        <circle
          cx="18" cy="18" r="15" fill="none"
          stroke={pct > 0 ? accent : P.borderLight}
          strokeWidth="3"
          strokeDasharray={`${(pct / 100) * 94.2} 94.2`}
          strokeLinecap="round"
          transform="rotate(-90 18 18)"
        />
        <text x="18" y="22" textAnchor="middle" fill={P.text} fontSize="9" fontWeight="700">{pct}%</text>
      </svg>
    </div>
  );
}

// ─── LessonGrid ───────────────────────────────────────────────────────────────

function LessonGrid({
  level, totalLessons, progress, gateStore, accent,
}: {
  level: number;
  totalLessons: number;
  progress: Record<string, LessonProgressEntry>;
  gateStore: GateStore;
  accent: string;
}) {
  return (
    <div className="space-y-6">
      {Array.from(
        { length: Math.ceil(totalLessons / 3) },
        (_, gi) => {
          const setNum  = gi + 1;
          const start   = gi * 3 + 1;
          const end     = Math.min(start + 2, totalLessons);
          const unlocked = isSetUnlocked(level, setNum, gateStore);
          const gate     = getGateEntry(level, setNum, gateStore);

          return (
            <SetGroup
              key={setNum}
              setNum={setNum}
              level={level}
              start={start}
              end={end}
              unlocked={unlocked}
              gate={gate}
              progress={progress}
              gateStore={gateStore}
              accent={accent}
            />
          );
        }
      )}
    </div>
  );
}

// ─── SetGroup ─────────────────────────────────────────────────────────────────

function SetGroup({
  setNum, level, start, end, unlocked, gate, progress, accent,
}: {
  setNum: number;
  level: number;
  start: number;
  end: number;
  unlocked: boolean;
  gate: import("@/lib/hskData").GateEntry | null;
  progress: Record<string, LessonProgressEntry>;
  gateStore: GateStore;
  accent: string;
}) {
  const testSetId  = `new-${level}-set-${setNum}`;
  const passed     = gate?.passed === true;
  const attempted  = gate !== null;

  const lessonsInSet = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  const allStudied   = lessonsInSet.every((n) => progress[`new-${level}-lesson-${n}`]?.completed);

  return (
    <div className={`rounded-2xl border transition-all ${!unlocked ? "opacity-60" : ""}`}
      style={{
        borderColor: passed ? `${accent}50` : unlocked ? P.border : P.borderLight,
        background:  passed ? `${accent}08` : P.surface,
      }}>

      {/* Set header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          {!unlocked ? (
            <Lock size={14} style={{ color: P.textFaint }} />
          ) : passed ? (
            <Trophy size={14} style={{ color: accent }} />
          ) : (
            <div className="w-3.5 h-3.5 rounded-full border-2"
              style={{ borderColor: `${accent}60` }} />
          )}
          <span className="text-sm font-semibold" style={{ color: P.textMuted }}>
            Nhóm {setNum} · Bài {start}–{end}
          </span>
          {passed && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: `${accent}25`, color: accent }}>
              ✓ {gate?.score}%
            </span>
          )}
          {attempted && !passed && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{ background: "rgba(192,57,43,0.12)", color: "#C0392B" }}>
              <AlertTriangle size={9} /> {gate?.score}% — chưa qua
            </span>
          )}
        </div>

        {!unlocked && (
          <span className="text-xs flex items-center gap-1" style={{ color: P.textFaint }}>
            <Lock size={11} /> Hoàn thành kiểm tra nhóm {setNum - 1} để mở
          </span>
        )}
      </div>

      {/* Lesson cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 px-4 pb-4">
        {lessonsInSet.map((lessonNum) => {
          const lessonId = `new-${level}-lesson-${lessonNum}`;
          const done     = progress[lessonId]?.completed ?? false;
          const score    = progress[lessonId]?.score;
          const locked   = !unlocked;

          return (
            <LessonCard
              key={lessonId}
              lessonId={lessonId}
              lessonNum={lessonNum}
              level={level}
              completed={done}
              score={score}
              locked={locked}
              accent={accent}
            />
          );
        })}
      </div>

      {/* Test gate bar */}
      <TestGateBar
        level={level}
        setNum={setNum}
        setId={testSetId}
        unlocked={unlocked}
        passed={passed}
        attempted={attempted}
        gateScore={gate?.score}
        gateAttempts={gate?.attempts}
        allStudied={allStudied}
        accent={accent}
      />
    </div>
  );
}

// ─── TestGateBar ──────────────────────────────────────────────────────────────

function TestGateBar({
  level, setNum, setId, unlocked, passed, attempted,
  gateScore, gateAttempts, allStudied, accent,
}: {
  level: number;
  setNum: number;
  setId: string;
  unlocked: boolean;
  passed: boolean;
  attempted: boolean;
  gateScore?: number;
  gateAttempts?: number;
  allStudied: boolean;
  accent: string;
}) {
  const href = `/vocabulary/test/${setId}`;

  return (
    <div className="border-t px-4 py-3 flex items-center justify-between flex-wrap gap-3"
      style={{ borderColor: P.borderLight }}>

      <div className="flex items-center gap-2 text-xs" style={{ color: P.textFaint }}>
        <ClipboardCheck size={13} />
        <span>Bài kiểm tra nhóm {setNum}</span>
        <span style={{ color: P.border }}>·</span>
        <span>Cần ≥{PASS_THRESHOLD}% để mở nhóm {setNum + 1}</span>
        {gateAttempts && gateAttempts > 0 && (
          <>
            <span style={{ color: P.border }}>·</span>
            <span>{gateAttempts} lần thử</span>
          </>
        )}
      </div>

      {!unlocked ? (
        <div className="flex items-center gap-1.5 text-xs" style={{ color: P.textFaint }}>
          <Lock size={12} /> Chưa mở
        </div>
      ) : passed ? (
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold flex items-center gap-1" style={{ color: accent }}>
            <Trophy size={12} /> Đã qua · {gateScore}%
          </span>
          <Link href={href} className="text-xs underline underline-offset-2 transition-colors" style={{ color: P.textFaint }}>
            Làm lại
          </Link>
        </div>
      ) : (
        <Link href={href}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all"
          style={{
            background: allStudied
              ? attempted
                ? "linear-gradient(135deg,#C0392B,#E74C3C)"
                : `linear-gradient(135deg,${accent},${accent}cc)`
              : P.surfaceHover,
            color: allStudied ? "#fff" : P.textMuted,
          }}>
          <ClipboardCheck size={13} />
          {attempted ? "Thử lại kiểm tra" : allStudied ? "Làm bài kiểm tra" : "Học xong → Kiểm tra"}
        </Link>
      )}
    </div>
  );
}

// ─── ActionBtn ────────────────────────────────────────────────────────────────

function ActionBtn({
  href, icon, label, primary, locked, accent,
}: {
  href: string; icon: React.ReactNode; label: string;
  primary?: boolean; locked: boolean; accent: string;
}) {
  if (locked) {
    return (
      <div className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium cursor-not-allowed"
        style={{ background: P.borderLight, color: P.textFaint }}>
        <Lock size={11} /> {label}
      </div>
    );
  }
  return (
    <Link
      href={href}
      className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all"
      style={primary
        ? { background: `${accent}18`, color: accent }
        : { background: P.borderLight, color: P.textMuted }}
      onMouseEnter={e => {
        if (primary) {
          (e.currentTarget as HTMLElement).style.background = accent;
          (e.currentTarget as HTMLElement).style.color = "#fff";
        } else {
          (e.currentTarget as HTMLElement).style.color = P.text;
          (e.currentTarget as HTMLElement).style.background = P.surfaceHover;
        }
      }}
      onMouseLeave={e => {
        if (primary) {
          (e.currentTarget as HTMLElement).style.background = `${accent}18`;
          (e.currentTarget as HTMLElement).style.color = accent;
        } else {
          (e.currentTarget as HTMLElement).style.color = P.textMuted;
          (e.currentTarget as HTMLElement).style.background = P.borderLight;
        }
      }}
    >
      {icon} {label}
    </Link>
  );
}

// ─── LessonCard ───────────────────────────────────────────────────────────────

function LessonCard({
  lessonId, lessonNum, level, completed, score, locked, accent,
}: {
  lessonId: string;
  lessonNum: number;
  level: number;
  completed: boolean;
  score?: number;
  locked: boolean;
  accent: string;
}) {
  return (
    <div
      className="rounded-xl border p-4 transition-all"
      style={{
        background:  locked ? P.borderLight : completed ? `${accent}0F` : P.surface,
        borderColor: locked ? P.borderLight : completed ? `${accent}40` : P.border,
        opacity: locked ? 0.55 : 1,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{
              background: locked ? P.borderLight : completed ? accent : P.surfaceHover,
              color:      locked ? P.textFaint   : completed ? "#fff" : P.textMuted,
            }}>
            {locked ? <Lock size={11} /> : lessonNum}
          </span>
          <div>
            <p className="text-sm font-semibold" style={{ color: P.text }}>Bài {lessonNum}</p>
            <p className="text-xs" style={{ color: P.textFaint }}>20 từ</p>
          </div>
        </div>
        {completed && score !== undefined && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: `${accent}18`, color: accent }}>
            {score}%
          </span>
        )}
        {locked && <Lock size={13} style={{ color: P.textFaint }} />}
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-1.5">
        <ActionBtn href={`/vocabulary/lesson/${lessonId}`}    icon={<BookOpen size={12}/>}  label="Học"        primary locked={locked} accent={accent} />
        <ActionBtn href={`/vocabulary/flashcard/${lessonId}`} icon={<Zap      size={12}/>}  label="Flashcard"         locked={locked} accent={accent} />
        <ActionBtn href={`/vocabulary/writing/${lessonId}`}   icon={<PenTool  size={12}/>}  label="Luyện viết"        locked={locked} accent={accent} />
        <ActionBtn href={`/vocabulary/game/${lessonId}`}      icon={<Gamepad2 size={12}/>}  label="Game"              locked={locked} accent={accent} />
      </div>
    </div>
  );
}
