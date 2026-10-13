"use client";

import { useEffect, useState } from "react";
import { BookOpenText, CheckCircle, Eye, EyeOff, Volume2 } from "lucide-react";
import { READING_LESSONS } from "@/lib/readingData";
import { loadCloudModuleProgress, saveCloudModuleProgress } from "@/lib/moduleProgress";

const P = { bg: "#FFFBEA", surface: "#FFFDF0", soft: "#FFF3B0", border: "#E8D98A", text: "#1C1408", muted: "#78614A" };
const STORAGE_KEY = "hsk_reading_scores_v1";

export default function ReadingClient() {
  const [lessonId, setLessonId] = useState(READING_LESSONS[0].id);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [attemptScore, setAttemptScore] = useState<number | null>(null);
  const [showSupport, setShowSupport] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({});
  const lesson = READING_LESSONS.find((item) => item.id === lessonId) ?? READING_LESSONS[0];

  useEffect(() => {
    let local: Record<string, number> = {};
    try { local = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"); } catch { /* ignore invalid cache */ }
    setScores(local);
    loadCloudModuleProgress().then((rows) => {
      if (!rows) return;
      const merged = { ...local };
      rows.filter((r) => r.module === "reading" && r.bestScore !== null).forEach((r) => { merged[r.itemId] = Math.max(merged[r.itemId] ?? 0, r.bestScore ?? 0); });
      setScores(merged); localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      Object.entries(local).forEach(([itemId, value]) => { void saveCloudModuleProgress("reading", itemId, { score: value, completed: true }); });
    });
  }, []);
  const selectLesson = (id: string) => { setLessonId(id); setAnswers({}); setSubmitted(false); setAttemptScore(null); setShowSupport(false); };
  const submit = () => {
    if (Object.keys(answers).length !== lesson.questions.length) return;
    const correct = lesson.questions.filter((question, index) => answers[index] === question.answer).length;
    const score = Math.round(correct / lesson.questions.length * 100);
    const updated = { ...scores, [lesson.id]: Math.max(scores[lesson.id] ?? 0, score) };
    setScores(updated); setAttemptScore(score); localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); setSubmitted(true);
    void saveCloudModuleProgress("reading", lesson.id, { score, completed: true, countAttempt: true });
  };
  const speak = () => { if (!("speechSynthesis" in window)) return; speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(lesson.passage); utterance.lang = "zh-CN"; utterance.rate = 0.78; speechSynthesis.speak(utterance); };

  return <main className="min-h-screen" style={{ background: P.bg }}>
    <header className="border-b" style={{ background: "linear-gradient(135deg,#EDE9FE,#FFFBEA)", borderColor: P.border }}><div className="max-w-6xl mx-auto px-4 py-9 flex gap-3"><BookOpenText className="text-violet-700"/><div><h1 className="text-2xl font-extrabold">Luyện đọc hiểu</h1><p className="text-sm" style={{ color: P.muted }}>Đọc theo cấp độ, học từ khóa và kiểm tra mức độ hiểu bài.</p></div></div></header>
    <div className="max-w-6xl mx-auto px-4 py-7 grid lg:grid-cols-[280px_1fr] gap-6">
      <aside className="space-y-2">{READING_LESSONS.map((item) => <button key={item.id} onClick={() => selectLesson(item.id)} className="w-full rounded-xl border p-3 text-left" style={{ background: item.id === lesson.id ? "#F3E8FF" : P.surface, borderColor: item.id === lesson.id ? "#7C3AED" : P.border }}><div className="flex justify-between"><b>{item.title}</b>{scores[item.id] !== undefined && <span className="text-xs font-bold text-emerald-700">{scores[item.id]}%</span>}</div><p className="text-xs mt-1" style={{ color: P.muted }}>HSK {item.level} · {item.questions.length} câu hỏi</p></button>)}</aside>
      <section className="space-y-5">
        <article className="rounded-2xl border p-6" style={{ background: P.surface, borderColor: P.border }}>
          <div className="flex items-start justify-between gap-3"><div><span className="text-xs font-bold text-violet-700">HSK {lesson.level}</span><h2 className="text-xl font-bold mt-1">{lesson.title}</h2></div><button onClick={speak} className="rounded-xl p-2" style={{ background: P.soft }} aria-label="Nghe bài đọc"><Volume2 size={19}/></button></div>
          <p className="hanzi text-xl leading-10 mt-5">{lesson.passage}</p>
          <button onClick={() => setShowSupport((value) => !value)} className="flex items-center gap-2 text-sm font-semibold mt-4 text-violet-700">{showSupport ? <EyeOff size={15}/> : <Eye size={15}/>} {showSupport ? "Ẩn hỗ trợ" : "Xem pinyin và bản dịch"}</button>
          {showSupport && <div className="mt-4 rounded-xl p-4 space-y-3" style={{ background: "#F5F3FF" }}><p className="text-sm leading-6 text-violet-900">{lesson.pinyin}</p><p className="text-sm leading-6" style={{ color: P.muted }}>{lesson.translation}</p></div>}
          <div className="flex flex-wrap gap-2 mt-5">{lesson.vocabulary.map((word) => <span key={word.hanzi} className="rounded-lg px-3 py-2 text-xs" style={{ background: P.soft }}><b className="hanzi">{word.hanzi}</b> · {word.pinyin} · {word.meaning}</span>)}</div>
        </article>
        {lesson.questions.map((question, qIndex) => <div key={question.question} className="rounded-2xl border p-5" style={{ background: P.surface, borderColor: P.border }}><p className="font-bold mb-3">{qIndex + 1}. <span className="hanzi">{question.question}</span></p><div className="grid sm:grid-cols-2 gap-2">{question.options.map((option, optionIndex) => { const selected = answers[qIndex] === optionIndex; const correct = optionIndex === question.answer; return <button key={option} disabled={submitted} onClick={() => setAnswers((value) => ({ ...value, [qIndex]: optionIndex }))} className="rounded-xl border p-3 text-left hanzi" style={{ background: submitted && correct ? "#DCFCE7" : submitted && selected ? "#FEE2E2" : selected ? "#FEF3C7" : "#FFF8D6", borderColor: submitted && correct ? "#059669" : submitted && selected ? "#DC2626" : selected ? "#D97706" : P.border }}>{option}</button>; })}</div>{submitted && <p className="text-sm mt-3" style={{ color: answers[qIndex] === question.answer ? "#047857" : "#B91C1C" }}>{answers[qIndex] === question.answer ? "✓ Chính xác. " : "✗ Chưa đúng. "}{question.explanation}</p>}</div>)}
        <button onClick={submitted ? () => { setAnswers({}); setSubmitted(false); setAttemptScore(null); } : submit} disabled={!submitted && Object.keys(answers).length !== lesson.questions.length} className="w-full rounded-xl py-3 font-bold text-white disabled:opacity-40" style={{ background: "#7C3AED" }}>{submitted ? "Làm lại bài này" : "Nộp bài đọc hiểu"}</button>
        {submitted && attemptScore !== null && <div className="rounded-xl p-4 text-center font-bold text-emerald-800" style={{ background: "#DCFCE7" }}><CheckCircle className="inline mr-2" size={18}/>Điểm lần này: {attemptScore}% · Cao nhất: {scores[lesson.id]}%</div>}
      </section>
    </div>
  </main>;
}
