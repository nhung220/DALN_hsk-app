"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Eye, EyeOff, MessageCircle, RotateCcw, Volume2 } from "lucide-react";
import { DIALOGUE_SCENARIOS } from "@/lib/dialogueData";
import { loadCloudModuleProgress, saveCloudModuleProgress } from "@/lib/moduleProgress";

const P = { bg: "#FFFBEA", surface: "#FFFDF0", soft: "#FFF3B0", border: "#E8D98A", text: "#1C1408", muted: "#78614A" };
const STORAGE_KEY = "hsk_dialogue_completed_v1";

function speak(text: string) { if (!("speechSynthesis" in window)) return; speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = "zh-CN"; u.rate = 0.8; speechSynthesis.speak(u); }

export default function DialogueClient() {
  const [scenarioId, setScenarioId] = useState(DIALOGUE_SCENARIOS[0].id);
  const [showTranslation, setShowTranslation] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);
  const scenario = DIALOGUE_SCENARIOS.find((item) => item.id === scenarioId) ?? DIALOGUE_SCENARIOS[0];
  useEffect(() => {
    let local: string[] = [];
    try { local = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); } catch { /* ignore invalid cache */ }
    setCompleted(local);
    loadCloudModuleProgress().then((rows) => {
      if (!rows) return;
      const merged = Array.from(new Set([...local, ...rows.filter((r) => r.module === "dialogue" && r.completed).map((r) => r.itemId)]));
      setCompleted(merged); localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      local.forEach((itemId) => { void saveCloudModuleProgress("dialogue", itemId, { completed: true }); });
    });
  }, []);
  const choose = (index: number) => { if (selected !== null) return; setSelected(index); if (index === scenario.challenge.answer && !completed.includes(scenario.id)) { const updated = [...completed, scenario.id]; setCompleted(updated); localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); void saveCloudModuleProgress("dialogue", scenario.id, { completed: true, countAttempt: true }); } };
  const selectScenario = (id: string) => { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); setScenarioId(id); setSelected(null); };

  return <main className="min-h-screen" style={{ background: P.bg }}>
    <header className="border-b" style={{ background: "linear-gradient(135deg,#DCFCE7,#FFFBEA)", borderColor: P.border }}><div className="max-w-6xl mx-auto px-4 py-9 flex gap-3"><MessageCircle className="text-emerald-700"/><div><h1 className="text-2xl font-extrabold">Luyện hội thoại</h1><p className="text-sm" style={{ color: P.muted }}>Nghe, phân vai và chọn phản hồi trong tình huống thực tế.</p></div></div></header>
    <div className="max-w-6xl mx-auto px-4 py-7 grid lg:grid-cols-[280px_1fr] gap-6">
      <aside className="space-y-2">{DIALOGUE_SCENARIOS.map((item) => <button key={item.id} onClick={() => selectScenario(item.id)} className="w-full rounded-xl border p-3 text-left" style={{ background: item.id === scenario.id ? "#DCFCE7" : P.surface, borderColor: item.id === scenario.id ? "#16A34A" : P.border }}><div className="flex justify-between gap-2"><b>{item.title}</b>{completed.includes(item.id) && <CheckCircle size={16} className="text-emerald-600"/>}</div><p className="text-xs mt-1" style={{ color: P.muted }}>HSK {item.level} · {item.place}</p></button>)}</aside>
      <section>
        <div className="flex items-start justify-between gap-3 mb-5"><div><span className="text-xs font-bold text-emerald-700">{scenario.place} · HSK {scenario.level}</span><h2 className="text-xl font-bold mt-1">{scenario.title}</h2><p className="text-sm mt-1" style={{ color: P.muted }}>Mục tiêu: {scenario.goal}</p></div><button onClick={() => setShowTranslation((value) => !value)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm" style={{ background: P.soft }}>{showTranslation ? <EyeOff size={15}/> : <Eye size={15}/>} {showTranslation ? "Ẩn dịch" : "Hiện dịch"}</button></div>
        <div className="rounded-2xl border p-5 space-y-4" style={{ background: P.surface, borderColor: P.border }}>{scenario.lines.map((line, index) => <div key={`${line.speaker}-${index}`} className={`flex ${line.speaker === "B" ? "justify-end" : "justify-start"}`}><div className="max-w-[85%] rounded-2xl px-4 py-3" style={{ background: line.speaker === "A" ? "#ECFDF5" : "#FEF3C7", border: `1px solid ${line.speaker === "A" ? "#A7F3D0" : P.border}` }}><div className="flex items-start gap-3"><span className="w-7 h-7 flex-shrink-0 rounded-full grid place-items-center text-xs font-bold text-white" style={{ background: line.speaker === "A" ? "#059669" : "#D97706" }}>{line.speaker}</span><div><p className="hanzi text-lg font-semibold">{line.zh}</p><p className="text-xs mt-1 text-emerald-800">{line.pinyin}</p>{showTranslation && <p className="text-sm mt-1" style={{ color: P.muted }}>{line.vi}</p>}</div><button onClick={() => speak(line.zh)} aria-label="Nghe câu" className="p-1 text-emerald-700"><Volume2 size={16}/></button></div></div></div>)}</div>
        <div className="rounded-2xl border p-5 mt-5" style={{ background: P.surface, borderColor: P.border }}><h3 className="font-bold mb-3">Phản xạ giao tiếp</h3><p className="text-sm mb-4" style={{ color: P.muted }}>{scenario.challenge.prompt}</p><div className="grid sm:grid-cols-2 gap-2">{scenario.challenge.options.map((option, index) => { const correct = index === scenario.challenge.answer; const chosen = selected === index; return <button key={option} disabled={selected !== null} onClick={() => choose(index)} className="hanzi rounded-xl border p-3 text-left" style={{ background: selected !== null && correct ? "#DCFCE7" : selected !== null && chosen ? "#FEE2E2" : "#FFF8D6", borderColor: selected !== null && correct ? "#059669" : selected !== null && chosen ? "#DC2626" : P.border }}>{option}</button>; })}</div>{selected !== null && <div className="mt-4 flex items-start justify-between gap-3"><p className="text-sm" style={{ color: selected === scenario.challenge.answer ? "#047857" : "#B91C1C" }}>{selected === scenario.challenge.answer ? "✓ Chính xác. " : "✗ Chưa phù hợp. "}{scenario.challenge.explanation}</p><button onClick={() => setSelected(null)} className="flex items-center gap-1 text-sm font-semibold"><RotateCcw size={14}/> Làm lại</button></div>}</div>
      </section>
    </div>
  </main>;
}
