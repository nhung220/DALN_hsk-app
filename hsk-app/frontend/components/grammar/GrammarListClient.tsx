"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { GrammarLevelData, GrammarPoint } from "@/lib/grammarDataServer";
import { useAuth } from "@/components/auth/AuthProvider";
import { CheckCircle2, ChevronLeft, ChevronRight, Circle, Search, Target } from "lucide-react";

const P = { bg: "#FFFBEA", surface: "#FFFDF0", soft: "#FFF3B0", border: "#E8D98A", text: "#1C1408", muted: "#78614A", faint: "#A8956A" };
const COLORS: Record<number, string> = { 1: "#C0392B", 2: "#2563EB", 3: "#059669", 4: "#B45309", 5: "#7C3AED", 6: "#EA580C" };
type Status = "new" | "learning" | "mastered";
const localizeStructure = (text: string) => text.replace(/Subj\./g, "Chủ ngữ").replace(/Verb Phrase/g, "Cụm động từ").replace(/Noun Phrase/g, "Cụm danh từ").replace(/Verb/g, "Động từ").replace(/Obj\./g, "Tân ngữ").replace(/Adj\./g, "Tính từ").replace(/Adv\./g, "Trạng từ").replace(/Noun/g, "Danh từ");

export default function GrammarListClient({ data }: { data: GrammarLevelData }) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "learning" | "mastered">("all");
  const [scores, setScores] = useState<Record<string, number[]>>({});
  const accent = COLORS[data.levelNumber] ?? COLORS[1];

  useEffect(() => {
    if (!user) return;
    fetch("/api/progress/grammar", { credentials: "include" }).then((r) => r.ok ? r.json() : null).then((result) => {
      const next: Record<string, number[]> = {};
      for (const row of result?.progress ?? []) (next[row.pointId] ??= []).push(row.bestScore);
      setScores(next);
    }).catch(() => {});
  }, [user]);

  const statusOf = (id: string): Status => {
    const values = scores[id] ?? [];
    if (values.length >= 2 && values.every((score) => score >= 80)) return "mastered";
    return values.length ? "learning" : "new";
  };
  const mastered = useMemo(() => data.points.filter((point) => statusOf(point.id) === "mastered").length, [data.points, scores]);
  const filtered = data.points.filter((point) => {
    const q = search.trim().toLowerCase();
    const matches = !q || point.title.toLowerCase().includes(q) || point.titleVi?.toLowerCase().includes(q) || point.structures.some((item) => item.toLowerCase().includes(q)) || point.usedFor.some((item) => item.toLowerCase().includes(q));
    const status = statusOf(point.id);
    return matches && (filter === "all" || status === filter);
  });

  return <main className="min-h-screen" style={{ background: P.bg }}>
    <header className="border-b" style={{ borderColor: P.border, background: `linear-gradient(135deg,${accent}18,#FFFBEA)` }}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link href="/grammar" className="inline-flex items-center gap-1 text-sm mb-5" style={{ color: P.muted }}><ChevronLeft size={15}/> Lộ trình ngữ pháp</Link>
        <div className="flex items-center gap-4"><div className="w-14 h-14 rounded-2xl grid place-items-center text-2xl font-black text-white" style={{ background: accent }}>{data.levelNumber}</div><div><p className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>Cấp độ HSK {data.levelNumber}</p><h1 className="text-2xl font-black mt-1">Ngữ pháp HSK {data.levelNumber}</h1><p className="text-sm mt-1" style={{ color: P.muted }}>{data.totalPoints} điểm · {data.totalExamples} câu ví dụ</p></div></div>
        <div className="mt-6 max-w-xl"><div className="flex justify-between text-xs mb-2"><span style={{ color: P.muted }}>Mức hoàn thành</span><b style={{ color: accent }}>{mastered}/{data.totalPoints} điểm</b></div><div className="h-2.5 rounded-full overflow-hidden bg-white"><div className="h-full rounded-full transition-all" style={{ width: `${data.totalPoints ? mastered / data.totalPoints * 100 : 0}%`, background: accent }}/></div><p className="text-[11px] mt-2" style={{ color: P.faint }}>Thành thạo khi cả hai bài luyện đều đạt từ 80%.</p></div>
      </div>
    </header>

    <div className="max-w-5xl mx-auto px-4 py-7 grid lg:grid-cols-[240px_1fr] gap-6">
      <aside className="lg:sticky lg:top-20 h-fit space-y-4">
        <div className="rounded-2xl border p-4" style={{ background: P.surface, borderColor: P.border }}><b className="text-sm">Cách học hiệu quả</b><ol className="mt-3 space-y-3 text-xs" style={{ color: P.muted }}><li><b style={{ color: accent }}>1. Hiểu</b> công thức và nghe ví dụ.</li><li><b style={{ color: accent }}>2. Điền từ</b> để nhận biết cách dùng.</li><li><b style={{ color: accent }}>3. Sắp xếp</b> để tự tạo câu.</li></ol></div>
        <div className="rounded-2xl border p-4 text-xs" style={{ background: "#F5F3FF", borderColor: "#DDD6FE", color: P.muted }}><b className="text-[#7C3AED]">Mẹo nhỏ</b><p className="mt-2 leading-5">Chỉ học 3–5 điểm mỗi lần. Làm lại những bài dưới 80% trước khi học bài mới.</p></div>
      </aside>
      <section>
        <div className="flex items-center gap-2 rounded-xl border px-4 py-3" style={{ borderColor: P.border, background: P.surface }}><Search size={17} style={{ color: P.faint }}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên, cấu trúc hoặc cách dùng..." className="w-full bg-transparent outline-none text-sm"/></div>
        <div className="flex gap-2 my-4 overflow-x-auto pb-1">{([{ id: "all", label: "Tất cả" }, { id: "learning", label: "Đang học" }, { id: "mastered", label: "Đã thành thạo" }] as const).map((item) => <button key={item.id} onClick={() => setFilter(item.id)} className="whitespace-nowrap rounded-full border px-3.5 py-2 text-xs font-bold" style={{ background: filter === item.id ? accent : P.surface, borderColor: filter === item.id ? accent : P.border, color: filter === item.id ? "white" : P.muted }}>{item.label}</button>)}</div>
        <p className="text-xs mb-3" style={{ color: P.faint }}>Hiển thị {filtered.length}/{data.totalPoints} điểm ngữ pháp</p>
        <div className="space-y-3">{filtered.map((point) => <PointCard key={point.id} point={point} level={data.levelNumber} accent={accent} status={statusOf(point.id)} scores={scores[point.id] ?? []}/>)}</div>
        {!filtered.length && <div className="text-center rounded-2xl border py-14" style={{ borderColor: P.border, color: P.faint }}>Không tìm thấy điểm ngữ pháp phù hợp.</div>}
      </section>
    </div>
  </main>;
}

function PointCard({ point, level, accent, status, scores }: { point: GrammarPoint; level: number; accent: string; status: Status; scores: number[] }) {
  return <Link href={`/grammar/${level}/${point.id}`} className="group block rounded-2xl border p-5 hover:-translate-y-0.5 hover:shadow-md transition-all" style={{ borderColor: status === "mastered" ? "#86EFAC" : P.border, background: P.surface }}>
    <div className="flex items-start gap-4"><div className="mt-0.5 w-9 h-9 shrink-0 rounded-xl grid place-items-center" style={{ background: status === "mastered" ? "#DCFCE7" : `${accent}14`, color: status === "mastered" ? "#059669" : accent }}>{status === "mastered" ? <CheckCircle2 size={18}/> : status === "learning" ? <Target size={18}/> : <Circle size={16}/>}</div><div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><h2 className="font-bold leading-snug">{point.titleVi ?? point.title}</h2><ChevronRight size={17} className="shrink-0 group-hover:translate-x-1 transition-transform" style={{ color: P.faint }}/></div>{point.structures[0] && <p className="mt-2 rounded-lg px-3 py-2 font-mono text-xs truncate" style={{ background: `${accent}0D`, color: accent }}>{localizeStructure(point.structures[0])}</p>}<div className="flex flex-wrap gap-1.5 mt-3"><span className="rounded-full bg-[#F5E9C0] px-2 py-1 text-[10px] text-[#78614A]">{point.examples.length} ví dụ</span>{point.usedFor.slice(0, 2).map((item) => <span key={item} className="rounded-full bg-[#F0E9B8] px-2 py-1 text-[10px] text-[#78614A]">{item}</span>)}{scores.length > 0 && <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold" style={{ color: accent }}>Tốt nhất {Math.max(...scores)}%</span>}</div></div></div>
  </Link>;
}
