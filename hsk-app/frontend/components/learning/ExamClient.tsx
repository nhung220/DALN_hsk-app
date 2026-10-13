"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle, Clock3, Trophy } from "lucide-react";
import { MOCK_EXAMS } from "@/lib/examData";
import { loadCloudModuleProgress, saveCloudModuleProgress } from "@/lib/moduleProgress";

const P = { bg: "#FFFBEA", surface: "#FFFDF0", soft: "#FFF3B0", border: "#E8D98A", text: "#1C1408", muted: "#78614A" };
const STORAGE_KEY = "hsk_mock_exam_results_v1";

export default function ExamClient() {
  const [examId, setExamId] = useState(MOCK_EXAMS[0].id);
  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [results, setResults] = useState<Record<string, number>>({});
  const exam = MOCK_EXAMS.find((item) => item.id === examId) ?? MOCK_EXAMS[0];
  const score = useMemo(() => Math.round(exam.questions.filter((question, index) => answers[index] === question.answer).length / exam.questions.length * 100), [answers, exam]);

  useEffect(() => {
    let local: Record<string, number> = {};
    try { local = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"); } catch { /* ignore invalid cache */ }
    setResults(local);
    loadCloudModuleProgress().then((rows) => {
      if (!rows) return;
      const merged = { ...local };
      rows.filter((r) => r.module === "exam" && r.bestScore !== null).forEach((r) => { merged[r.itemId] = Math.max(merged[r.itemId] ?? 0, r.bestScore ?? 0); });
      setResults(merged); localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      Object.entries(local).forEach(([itemId, value]) => { void saveCloudModuleProgress("exam", itemId, { score: value, completed: true }); });
    });
  }, []);
  const finish = useCallback(() => {
    if (submitted || !started) return;
    const updated = { ...results, [exam.id]: Math.max(results[exam.id] ?? 0, score) };
    setResults(updated); localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); setSubmitted(true);
    void saveCloudModuleProgress("exam", exam.id, { score, completed: true, countAttempt: true });
  }, [exam.id, results, score, started, submitted]);
  useEffect(() => { if (!started || submitted) return; const timer = window.setInterval(() => setTimeLeft((value) => Math.max(0, value - 1)), 1000); return () => clearInterval(timer); }, [started, submitted]);
  useEffect(() => { if (started && !submitted && timeLeft === 0) finish(); }, [finish, started, submitted, timeLeft]);

  const begin = () => { setAnswers({}); setCurrent(0); setSubmitted(false); setTimeLeft(exam.durationMinutes * 60); setStarted(true); };
  const changeExam = (id: string) => { setExamId(id); setStarted(false); setSubmitted(false); setAnswers({}); setCurrent(0); };
  const question = exam.questions[current];
  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const seconds = (timeLeft % 60).toString().padStart(2, "0");

  return <main className="min-h-screen" style={{ background: P.bg }}>
    <header className="border-b" style={{ background: "linear-gradient(135deg,#FEE2E2,#FFFBEA)", borderColor: P.border }}><div className="max-w-6xl mx-auto px-4 py-9 flex gap-3"><Trophy className="text-red-600"/><div><h1 className="text-2xl font-extrabold">Luyện thi HSK</h1><p className="text-sm" style={{ color: P.muted }}>Đề có thời gian, chấm điểm và giải thích chi tiết sau khi nộp.</p></div></div></header>
    <div className="max-w-6xl mx-auto px-4 py-7">
      {!started ? <><div className="grid md:grid-cols-3 gap-4">{MOCK_EXAMS.map((item) => <button key={item.id} onClick={() => changeExam(item.id)} className="rounded-2xl border p-5 text-left transition-all" style={{ background: item.id === exam.id ? "#FEF2F2" : P.surface, borderColor: item.id === exam.id ? "#DC2626" : P.border }}><div className="flex justify-between"><span className="text-xs font-bold text-red-600">HSK {item.level}</span>{results[item.id] !== undefined && <span className="text-xs font-bold text-emerald-700">Cao nhất {results[item.id]}%</span>}</div><h2 className="font-bold mt-2">{item.title}</h2><p className="text-sm mt-2" style={{ color: P.muted }}>{item.questions.length} câu · {item.durationMinutes} phút</p></button>)}</div><div className="rounded-2xl border p-6 mt-6 text-center" style={{ background: P.surface, borderColor: P.border }}><h2 className="text-xl font-bold">HSK {exam.level} · {exam.title}</h2><p className="text-sm mt-2" style={{ color: P.muted }}>Bài thi gồm từ vựng, ngữ pháp và đọc hiểu. Đồng hồ bắt đầu ngay khi nhấn nút.</p><button onClick={begin} className="mt-5 rounded-xl px-7 py-3 font-bold text-white bg-red-600">Bắt đầu làm bài</button></div></> : <div className="grid lg:grid-cols-[1fr_260px] gap-6">
        <section>
          <div className="flex items-center justify-between mb-4"><div><span className="text-xs font-bold text-red-600">{question.section}</span><h2 className="font-bold">Câu {current + 1}/{exam.questions.length}</h2></div><div className={`flex items-center gap-2 font-mono font-bold rounded-xl px-3 py-2 ${timeLeft < 60 ? "text-red-700" : ""}`} style={{ background: P.soft }}><Clock3 size={16}/>{minutes}:{seconds}</div></div>
          <div className="rounded-2xl border p-6" style={{ background: P.surface, borderColor: P.border }}>{question.context && <p className="hanzi rounded-xl p-4 mb-5 leading-8" style={{ background: "#FFF8D6" }}>{question.context}</p>}<p className="font-bold text-lg mb-5">{question.prompt}</p><div className="space-y-3">{question.options.map((option, index) => { const selected = answers[current] === index; const correct = index === question.answer; return <button key={option} disabled={submitted} onClick={() => setAnswers((value) => ({ ...value, [current]: index }))} className="w-full rounded-xl border p-3 text-left" style={{ background: submitted && correct ? "#DCFCE7" : submitted && selected ? "#FEE2E2" : selected ? "#FEF3C7" : "#FFF8D6", borderColor: submitted && correct ? "#059669" : submitted && selected ? "#DC2626" : selected ? "#D97706" : P.border }}><b className="mr-2">{String.fromCharCode(65 + index)}.</b>{option}</button>; })}</div>{submitted && <p className="text-sm mt-4" style={{ color: answers[current] === question.answer ? "#047857" : "#B91C1C" }}>{question.explanation}</p>}</div>
          <div className="flex justify-between mt-4"><button disabled={current === 0} onClick={() => setCurrent((value) => value - 1)} className="px-4 py-2 rounded-xl disabled:opacity-30" style={{ background: P.soft }}>Câu trước</button><button disabled={current === exam.questions.length - 1} onClick={() => setCurrent((value) => value + 1)} className="px-4 py-2 rounded-xl disabled:opacity-30" style={{ background: P.soft }}>Câu sau</button></div>
        </section>
        <aside><div className="rounded-2xl border p-4 sticky top-16" style={{ background: P.surface, borderColor: P.border }}><h3 className="font-bold mb-3">Phiếu trả lời</h3><div className="grid grid-cols-4 gap-2">{exam.questions.map((_, index) => <button key={index} onClick={() => setCurrent(index)} className="aspect-square rounded-lg text-sm font-bold" style={{ background: current === index ? "#DC2626" : answers[index] !== undefined ? "#DCFCE7" : P.soft, color: current === index ? "white" : P.text }}>{index + 1}</button>)}</div>{!submitted && Object.keys(answers).length < exam.questions.length && <p className="flex gap-2 text-xs mt-4 text-amber-800"><AlertTriangle size={14}/>Còn {exam.questions.length - Object.keys(answers).length} câu chưa trả lời.</p>}<button onClick={submitted ? begin : finish} className="w-full rounded-xl py-3 mt-4 font-bold text-white" style={{ background: submitted ? "#B45309" : "#DC2626" }}>{submitted ? "Làm lại đề" : "Nộp bài"}</button>{submitted && <div className="mt-4 rounded-xl p-4 text-center" style={{ background: score >= 60 ? "#DCFCE7" : "#FEE2E2" }}><CheckCircle className="inline" size={18}/><p className="font-black text-2xl mt-1">{score}%</p><p className="text-xs">{score >= 60 ? "Đạt" : "Cần luyện thêm"}</p></div>}</div></aside>
      </div>}
    </div>
  </main>;
}
