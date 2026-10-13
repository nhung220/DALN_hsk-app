"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { loadProgress } from "@/lib/hskData";
import { localDateKey } from "@/lib/dateKey";
import {
  Home, Brain, Flame, Calendar, BarChart2,
  CheckCircle, Target, Clock, BookOpen, ChevronRight,
} from "lucide-react";

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

// ─── Types ────────────────────────────────────────────────────────────────────
interface DailyRecord {
  date:         string;
  totalCards:   number;
  correctCards: number;
  sessions:     number;
  durationSec:  number;
  score:        number;
}

interface Stats {
  streak:        number;
  totalSessions: number;
  totalCards:    number;
  avgScore:      number;
  activeDays:    number;
  allCards:      number;
  dueToday:      number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}p ${s}s` : `${m}p`;
}

function getHeatColor(score: number, cards: number): string {
  if (cards === 0) return P.borderLight;
  if (score >= 90) return "#059669";
  if (score >= 70) return "#16A34A";
  if (score >= 50) return "#B45309";
  if (score >= 1)  return "#EA580C";
  return "#E8D98A";
}

function getHeatIntensity(cards: number, max: number): string {
  if (cards === 0 || max === 0) return P.borderLight;
  const ratio = cards / max;
  if (ratio >= 0.8) return "#059669";
  if (ratio >= 0.5) return "#16A34A";
  if (ratio >= 0.2) return "#B45309";
  return "#FDE68A";
}

// Tạo lưới 52 tuần × 7 ngày cho calendar heatmap
function buildCalendarGrid(daily: DailyRecord[], weeks = 17): {
  date: string; cards: number; score: number; sessions: number; durationSec: number;
}[][] {
  const map = new Map(daily.map(d => [d.date, d]));
  const today = new Date();
  // Bắt đầu từ ngày đầu tuần (Chủ nhật) cách đây `weeks` tuần
  const start = new Date(today);
  start.setDate(start.getDate() - (weeks * 7) + 1);
  // Align về Chủ nhật
  start.setDate(start.getDate() - start.getDay());

  const grid: { date: string; cards: number; score: number; sessions: number; durationSec: number; }[][] = [];
  for (let w = 0; w < weeks; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const cur = new Date(start);
      cur.setDate(start.getDate() + w * 7 + d);
      const dateStr = localDateKey(cur);
      const rec = map.get(dateStr);
      week.push({
        date:        dateStr,
        cards:       rec?.totalCards   ?? 0,
        score:       rec?.score        ?? 0,
        sessions:    rec?.sessions     ?? 0,
        durationSec: rec?.durationSec  ?? 0,
      });
    }
    grid.push(week);
  }
  return grid;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function StatsClient() {
  const { user } = useAuth();
  const [daily,   setDaily]   = useState<DailyRecord[]>([]);
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [range,   setRange]   = useState<17 | 26 | 52>(17); // tuần
  const [hovered, setHovered] = useState<{ date: string; cards: number; score: number; sessions: number; durationSec: number; x: number; y: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    if (user) {
      // Dùng DB
      fetch(`/api/review/history?days=${range * 7}&date=${localDateKey()}`, { credentials: "include" })
        .then(r => r.ok ? r.json() : null)
        .then((data: { daily: DailyRecord[]; stats: Stats } | null) => {
          if (data) {
            setDaily(data.daily);
            setStats(data.stats);
          }
        })
        .catch(console.error);
    } else {
      // Fallback localStorage
      const sm2    = loadProgress();
      const today  = localDateKey();

      // Fake stats từ localStorage (không có lịch sử theo ngày)
      const cards       = Object.values(sm2);
      const dueToday    = cards.filter(c => c.nextReview <= today).length;
      const allCards    = cards.length;

      setStats({
        streak: 0, totalSessions: 0, totalCards: 0,
        avgScore: 0, activeDays: 0, allCards, dueToday,
      });
      setDaily([]);

      // Tạo dữ liệu giả từ lastReview của SM-2
      const byDate = new Map<string, { cards: number; correct: number }>();
      for (const c of cards) {
        if (c.lastReview) {
          const ex = byDate.get(c.lastReview) ?? { cards: 0, correct: 0 };
          byDate.set(c.lastReview, {
            cards:   ex.cards   + 1,
            correct: ex.correct + (c.repetitions > 0 ? 1 : 0),
          });
        }
      }

      const fakeDaily: DailyRecord[] = Array.from(byDate.entries()).map(([date, v]) => ({
        date,
        totalCards:   v.cards,
        correctCards: v.correct,
        sessions:     1,
        durationSec:  0,
        score: v.cards > 0 ? Math.round((v.correct / v.cards) * 100) : 0,
      }));
      setDaily(fakeDaily.sort((a, b) => a.date.localeCompare(b.date)));

      // Tính streak
      let streak = 0;
      const dateSet = new Set(fakeDaily.map(d => d.date));
      const cur = new Date();
      while (dateSet.has(localDateKey(cur))) {
        streak++;
        cur.setDate(cur.getDate() - 1);
      }

      setStats(prev => prev ? { ...prev, streak, activeDays: fakeDaily.length } : {
        streak, totalSessions: fakeDaily.length,
        totalCards: fakeDaily.reduce((a, d) => a + d.totalCards, 0),
        avgScore: 0, activeDays: fakeDaily.length, allCards, dueToday,
      });
    }
  }, [user, range]);

  if (!mounted) return null;

  const grid    = buildCalendarGrid(daily, range);
  const maxCards = Math.max(...daily.map(d => d.totalCards), 1);

  // Recent 30 days bar chart data
  const today = new Date();
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (29 - i));
    const dateStr = localDateKey(d);
    const rec = daily.find(x => x.date === dateStr);
    return { date: dateStr, label: `${d.getDate()}/${d.getMonth() + 1}`, cards: rec?.totalCards ?? 0, score: rec?.score ?? 0 };
  });
  const maxBarCards = Math.max(...last30.map(d => d.cards), 1);

  // Day of week labels
  const DOW = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  // Month labels for heatmap
  const monthLabels: { label: string; col: number }[] = [];
  let lastMonth = -1;
  grid.forEach((week, wi) => {
    const d = new Date(week[1].date);
    if (d.getMonth() !== lastMonth) {
      monthLabels.push({ label: d.toLocaleDateString("vi-VN", { month: "short" }), col: wi });
      lastMonth = d.getMonth();
    }
  });

  return (
    <div className="min-h-screen" style={{ background: P.bg }}>

      {/* ── Header ── */}
      <div className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#FFF3B0 0%,#FFFBEA 50%,#FFF8D6 100%)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <nav className="flex items-center gap-1.5 mb-5 text-xs" style={{ color: P.textFaint }}>
            <Link href="/" className="flex items-center gap-1 hover:underline">
              <Home size={11} /> Trang chủ
            </Link>
            <span>/</span>
            <span style={{ color: P.textMuted }}>Thống kê ôn tập</span>
          </nav>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#7C3AED,#B45309)" }}>
              <Brain size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold" style={{ color: P.text }}>Thống kê ôn tập</h1>
              <p className="text-sm" style={{ color: P.textMuted }}>
                Lịch học theo ngày · SM-2 · Tiến độ flashcard
              </p>
            </div>
          </div>

          {/* ── Summary stats ── */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  icon: <Flame size={20} />, label: "Chuỗi ngày",
                  value: `${stats.streak} ngày`,
                  color: stats.streak > 0 ? "#EA580C" : P.textFaint,
                  bg: stats.streak > 0 ? "rgba(234,88,12,0.1)" : P.surfaceH,
                },
                {
                  icon: <Brain size={20} />, label: "Từ đã ôn",
                  value: stats.totalCards.toLocaleString(),
                  color: "#7C3AED", bg: "rgba(124,58,237,0.1)",
                },
                {
                  icon: <Target size={20} />, label: "Điểm TB",
                  value: `${stats.avgScore}%`,
                  color: stats.avgScore >= 80 ? "#059669" : stats.avgScore >= 60 ? "#B45309" : "#C0392B",
                  bg: "rgba(5,150,105,0.1)",
                },
                {
                  icon: <Calendar size={20} />, label: "Ngày đã học",
                  value: `${stats.activeDays} ngày`,
                  color: "#2563EB", bg: "rgba(37,99,235,0.1)",
                },
              ].map(s => (
                <div key={s.label} className="rounded-2xl border p-4"
                  style={{ background: P.surface, borderColor: P.border }}>
                  <div className="flex items-center gap-2 mb-2" style={{ color: s.color }}>{s.icon}</div>
                  <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs mt-0.5" style={{ color: P.textFaint }}>{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── SM-2 tổng quan ── */}
        {stats && (
          <div className="rounded-2xl border p-5"
            style={{ background: P.surface, borderColor: P.border }}>
            <h2 className="text-sm font-bold mb-4" style={{ color: P.text }}>
              Bộ thẻ SM-2 hiện tại
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "Tổng thẻ đang ôn", value: stats.allCards,  color: P.text },
                {
                  label: "Cần ôn hôm nay",
                  value: stats.dueToday,
                  color: stats.dueToday > 0 ? "#C0392B" : "#059669",
                },
                {
                  label: "Đã ôn ngày mai trở đi",
                  value: stats.allCards - stats.dueToday,
                  color: "#059669",
                },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-3"
                  style={{ background: P.surfaceH }}>
                  <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs mt-0.5" style={{ color: P.textFaint }}>{s.label}</p>
                </div>
              ))}
            </div>
            {stats.dueToday > 0 && (
              <Link href="/review"
                className="mt-4 flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold text-white hover:brightness-110 transition-all"
                style={{ background: "linear-gradient(135deg,#C0392B,#E74C3C)" }}>
                <span className="flex items-center gap-2">
                  <Brain size={16} /> Ôn {stats.dueToday} từ ngay bây giờ
                </span>
                <ChevronRight size={16} />
              </Link>
            )}
          </div>
        )}

        {/* ── Calendar Heatmap ── */}
        <div className="rounded-2xl border p-5" style={{ background: P.surface, borderColor: P.border }}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-sm font-bold" style={{ color: P.text }}>
              Lịch học theo ngày
            </h2>
            <div className="flex gap-1.5">
              {([17, 26, 52] as const).map(w => (
                <button key={w}
                  onClick={() => setRange(w)}
                  className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                  style={range === w
                    ? { background: "#B45309", color: "#fff" }
                    : { background: P.surfaceH, color: P.textMuted }}>
                  {w === 17 ? "4 tháng" : w === 26 ? "6 tháng" : "1 năm"}
                </button>
              ))}
            </div>
          </div>

          {/* Heatmap grid */}
          <div className="overflow-x-auto pb-2">
            <div style={{ minWidth: grid.length * 16 + 30 }}>
              {/* Month labels */}
              <div className="flex mb-1 ml-7">
                {grid.map((_, wi) => {
                  const ml = monthLabels.find(m => m.col === wi);
                  return (
                    <div key={wi} style={{ width: 14, marginRight: 2 }}>
                      {ml && (
                        <span className="text-[9px] whitespace-nowrap" style={{ color: P.textFaint }}>
                          {ml.label}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-0.5">
                {/* Day labels */}
                <div className="flex flex-col gap-0.5 mr-1">
                  {DOW.map((d, i) => (
                    <div key={d} className="flex items-center justify-end"
                      style={{ height: 14, width: 22 }}>
                      {i % 2 === 1 && (
                        <span className="text-[9px]" style={{ color: P.textFaint }}>{d}</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Weeks */}
                {grid.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-0.5">
                    {week.map((day, di) => {
                      const isFuture = day.date > localDateKey();
                      const color = isFuture ? "transparent"
                        : day.cards === 0 ? P.borderLight
                        : getHeatIntensity(day.cards, maxCards);
                      return (
                        <div
                          key={di}
                          style={{
                            width: 14, height: 14,
                            background: color,
                            borderRadius: 3,
                            border: day.cards > 0 ? `1px solid ${color}cc` : `1px solid ${P.borderLight}`,
                            cursor: day.cards > 0 ? "pointer" : "default",
                            position: "relative",
                          }}
                          onMouseEnter={e => {
                            if (day.cards > 0) {
                              const rect = (e.target as HTMLElement).getBoundingClientRect();
                              setHovered({ ...day, x: rect.left, y: rect.top });
                            }
                          }}
                          onMouseLeave={() => setHovered(null)}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-[10px]" style={{ color: P.textFaint }}>Ít</span>
            {["#FDE68A", "#B45309", "#16A34A", "#059669"].map(c => (
              <div key={c} style={{ width: 12, height: 12, background: c, borderRadius: 2 }} />
            ))}
            <span className="text-[10px]" style={{ color: P.textFaint }}>Nhiều</span>
          </div>

          {/* Tooltip */}
          {hovered && (
            <div
              className="fixed z-50 rounded-xl border px-3 py-2 text-xs shadow-lg pointer-events-none"
              style={{
                left: Math.min(hovered.x, window.innerWidth - 160),
                top:  hovered.y - 80,
                background: P.surface,
                borderColor: P.border,
                color: P.text,
              }}>
              <p className="font-semibold mb-1">{new Date(hovered.date).toLocaleDateString("vi-VN", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}</p>
              <p style={{ color: P.textMuted }}>{hovered.cards} từ ôn · {hovered.score}% đúng</p>
              {hovered.durationSec > 0 && <p style={{ color: P.textFaint }}>{formatDuration(hovered.durationSec)}</p>}
            </div>
          )}
        </div>

        {/* ── Bar chart 30 ngày gần nhất ── */}
        <div className="rounded-2xl border p-5" style={{ background: P.surface, borderColor: P.border }}>
          <h2 className="text-sm font-bold mb-5" style={{ color: P.text }}>
            30 ngày gần nhất
          </h2>
          <div className="flex items-end gap-1 h-32">
            {last30.map((d, i) => {
              const h = maxBarCards > 0 ? Math.round((d.cards / maxBarCards) * 100) : 0;
              const isToday = d.date === localDateKey();
              const color = d.cards === 0 ? P.borderLight
                : d.score >= 80 ? "#059669"
                : d.score >= 60 ? "#B45309"
                : "#C0392B";
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group"
                  title={`${d.label}: ${d.cards} từ, ${d.score}%`}>
                  <div className="w-full rounded-t-sm transition-all relative"
                    style={{
                      height: `${Math.max(h, d.cards > 0 ? 4 : 0)}%`,
                      background: color,
                      minHeight: d.cards > 0 ? 4 : 0,
                      outline: isToday ? `2px solid #B45309` : "none",
                      outlineOffset: 1,
                    }}>
                    {/* Tooltip on hover */}
                    {d.cards > 0 && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10
                        whitespace-nowrap rounded-lg border px-2 py-1 text-[10px]"
                        style={{ background: P.surface, borderColor: P.border, color: P.text }}>
                        {d.cards} từ · {d.score}%
                      </div>
                    )}
                  </div>
                  {/* Date label: chỉ hiện mỗi 5 ngày */}
                  {i % 5 === 0 && (
                    <span className="text-[9px] rotate-0" style={{ color: P.textFaint }}>
                      {d.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend màu */}
          <div className="flex items-center gap-4 mt-4 text-[10px]" style={{ color: P.textFaint }}>
            <span className="flex items-center gap-1">
              <span style={{ display: "inline-block", width: 10, height: 10, background: "#059669", borderRadius: 2 }} />
              ≥80% đúng
            </span>
            <span className="flex items-center gap-1">
              <span style={{ display: "inline-block", width: 10, height: 10, background: "#B45309", borderRadius: 2 }} />
              60-79%
            </span>
            <span className="flex items-center gap-1">
              <span style={{ display: "inline-block", width: 10, height: 10, background: "#C0392B", borderRadius: 2 }} />
              &lt;60%
            </span>
          </div>
        </div>

        {/* ── Bảng lịch sử chi tiết ── */}
        {daily.length > 0 && (
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: P.border }}>
            <div className="px-5 py-4" style={{ background: P.surface }}>
              <h2 className="text-sm font-bold" style={{ color: P.text }}>
                Lịch sử phiên ôn tập
              </h2>
            </div>
            <div className="divide-y" style={{ borderColor: P.borderLight }}>
              {[...daily].reverse().slice(0, 30).map(d => (
                <div key={d.date} className="flex items-center px-5 py-3 gap-4"
                  style={{ background: P.bg }}>
                  <div className="w-24 flex-shrink-0">
                    <p className="text-sm font-semibold" style={{ color: P.text }}>
                      {new Date(d.date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                    </p>
                    <p className="text-xs" style={{ color: P.textFaint }}>
                      {new Date(d.date).toLocaleDateString("vi-VN", { weekday: "short" })}
                    </p>
                  </div>

                  {/* Bar score */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs" style={{ color: P.textMuted }}>
                        {d.totalCards} từ
                      </span>
                      <span className="text-xs font-bold"
                        style={{ color: d.score >= 80 ? "#059669" : d.score >= 60 ? "#B45309" : "#C0392B" }}>
                        {d.score}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: P.borderLight }}>
                      <div className="h-full rounded-full"
                        style={{
                          width: `${d.score}%`,
                          background: d.score >= 80 ? "#059669" : d.score >= 60 ? "#B45309" : "#C0392B",
                        }} />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0 text-xs" style={{ color: P.textFaint }}>
                    <span className="flex items-center gap-1">
                      <CheckCircle size={11} style={{ color: "#059669" }} />
                      {d.correctCards}/{d.totalCards}
                    </span>
                    {d.durationSec > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {formatDuration(d.durationSec)}
                      </span>
                    )}
                    {d.sessions > 1 && (
                      <span>{d.sessions} phiên</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {daily.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: P.surfaceH }}>
              <BarChart2 size={28} style={{ color: P.textFaint }} />
            </div>
            <p className="text-sm font-semibold mb-2" style={{ color: P.textMuted }}>
              Chưa có dữ liệu ôn tập
            </p>
            <p className="text-xs mb-6" style={{ color: P.textFaint }}>
              Học flashcard và ôn tập để thấy thống kê tại đây
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/vocabulary"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:brightness-110 transition-all"
                style={{ background: "linear-gradient(135deg,#B45309,#D97706)" }}>
                <BookOpen size={15} /> Học từ vựng
              </Link>
              <Link href="/review"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all"
                style={{ borderColor: P.border, color: P.textMuted, background: P.surface }}>
                <Brain size={15} /> Ôn tập
              </Link>
            </div>
          </div>
        )}

        {!user && daily.length === 0 && (
          <div className="rounded-2xl border p-5 text-center"
            style={{ background: P.surface, borderColor: P.border }}>
            <p className="text-sm mb-3" style={{ color: P.textMuted }}>
              Đăng nhập để lưu lịch sử ôn tập theo ngày lên cloud
            </p>
            <Link href="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg,#7C3AED,#B45309)" }}>
              Đăng nhập
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
