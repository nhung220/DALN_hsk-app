"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, CheckCircle, ChevronLeft, ChevronRight, RotateCcw, Volume2 } from "lucide-react";
import { VOCABULARY_TOPICS, type TopicWord } from "@/lib/topicData";
import { loadCloudModuleProgress, saveCloudModuleProgress } from "@/lib/moduleProgress";

const P = { bg: "#FFFBEA", surface: "#FFFDF0", soft: "#FFF3B0", border: "#E8D98A", text: "#1C1408", muted: "#78614A" };
const STORAGE_KEY = "hsk_topic_progress_v1";

function speak(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = 0.82;
  window.speechSynthesis.speak(utterance);
}

function makeOptions(answer: TopicWord, allWords: TopicWord[]) {
  const distractors = allWords.filter((word) => word.hanzi !== answer.hanzi).slice();
  for (let i = distractors.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [distractors[i], distractors[j]] = [distractors[j], distractors[i]];
  }
  const options = [answer, ...distractors.slice(0, 3)];
  return options.sort(() => Math.random() - 0.5);
}

export default function TopicVocabularyClient() {
  const [topicId, setTopicId] = useState(VOCABULARY_TOPICS[0].id);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [quiz, setQuiz] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState<string[]>([]);
  const topic = VOCABULARY_TOPICS.find((item) => item.id === topicId) ?? VOCABULARY_TOPICS[0];
  const word = topic.words[index];
  const allWords = useMemo(() => VOCABULARY_TOPICS.flatMap((item) => item.words), []);
  const options = useMemo(() => quiz ? makeOptions(word, allWords) : [], [quiz, word, allWords]);

  useEffect(() => {
    let local: string[] = [];
    try { local = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); } catch { /* ignore invalid cache */ }
    setCompleted(local);
    loadCloudModuleProgress().then((rows) => {
      if (!rows) return;
      const merged = Array.from(new Set([...local, ...rows.filter((r) => r.module === "topic" && r.completed).map((r) => r.itemId)]));
      setCompleted(merged); localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      local.forEach((itemId) => { void saveCloudModuleProgress("topic", itemId, { completed: true }); });
    });
  }, []);

  const chooseTopic = (id: string) => {
    setTopicId(id); setIndex(0); setFlipped(false); setQuiz(false); setSelected(null); setScore(0);
  };

  const next = () => {
    if (index < topic.words.length - 1) {
      setIndex((value) => value + 1); setFlipped(false); setSelected(null);
    } else if (!completed.includes(topic.id)) {
      const updated = [...completed, topic.id];
      setCompleted(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      void saveCloudModuleProgress("topic", topic.id, { completed: true });
    }
  };

  const answer = (value: string) => {
    if (selected) return;
    setSelected(value);
    if (value === word.hanzi) setScore((value) => value + 1);
  };

  return (
    <main className="min-h-screen" style={{ background: P.bg }}>
      <section className="border-b" style={{ background: "linear-gradient(135deg,#FFF3B0,#FFFBEA)", borderColor: P.border }}>
        <div className="max-w-6xl mx-auto px-4 py-9">
          <div className="flex items-center gap-3"><BookOpen className="text-amber-700" /><div><h1 className="text-2xl font-extrabold">Từ vựng theo chủ đề</h1><p className="text-sm" style={{ color: P.muted }}>Học theo tình huống, nghe phát âm và kiểm tra ngay sau mỗi chủ đề.</p></div></div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-7 grid lg:grid-cols-[300px_1fr] gap-6">
        <aside className="space-y-2">
          {VOCABULARY_TOPICS.map((item) => (
            <button key={item.id} onClick={() => chooseTopic(item.id)} className="w-full text-left rounded-xl border p-3 transition-all" style={{ background: item.id === topic.id ? "#FEF3C7" : P.surface, borderColor: item.id === topic.id ? "#D97706" : P.border }}>
              <div className="flex justify-between gap-2"><span className="font-bold">{item.icon} {item.title}</span>{completed.includes(item.id) && <CheckCircle size={16} className="text-emerald-600" />}</div>
              <p className="text-xs mt-1" style={{ color: P.muted }}>HSK {item.level} · {item.words.length} từ</p>
            </button>
          ))}
        </aside>

        <section>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div><h2 className="text-xl font-bold">{topic.icon} {topic.title}</h2><p className="text-sm" style={{ color: P.muted }}>{topic.description}</p></div>
            <button onClick={() => { setQuiz((value) => !value); setIndex(0); setSelected(null); setScore(0); setFlipped(false); }} className="rounded-xl px-4 py-2 text-sm font-bold text-white" style={{ background: quiz ? "#B45309" : "#059669" }}>{quiz ? "Học thẻ" : "Kiểm tra"}</button>
          </div>

          <div className="h-2 rounded-full overflow-hidden mb-5" style={{ background: P.soft }}><div className="h-full transition-all" style={{ width: `${((index + (selected ? 1 : 0)) / topic.words.length) * 100}%`, background: "#D97706" }} /></div>

          {!quiz ? (
            <button onClick={() => setFlipped((value) => !value)} className="w-full min-h-[330px] rounded-3xl border p-8 text-center shadow-sm" style={{ background: P.surface, borderColor: P.border }}>
              <p className="text-xs uppercase tracking-widest" style={{ color: P.muted }}>{index + 1}/{topic.words.length} · nhấn để {flipped ? "xem từ" : "lật thẻ"}</p>
              <p className="hanzi text-7xl font-black my-7">{word.hanzi}</p>
              <button onClick={(event) => { event.stopPropagation(); speak(word.hanzi); }} className="inline-flex items-center gap-2 rounded-full px-4 py-2" style={{ background: "#FEF3C7", color: "#B45309" }}><Volume2 size={17} /> {word.pinyin}</button>
              {flipped && <div className="mt-6 animate-fadeIn"><p className="text-xl font-bold text-emerald-700">{word.meaning}</p><p className="hanzi mt-4 text-lg">{word.example}</p><p className="text-sm mt-1" style={{ color: P.muted }}>{word.exampleVi}</p></div>}
            </button>
          ) : (
            <div className="min-h-[330px] rounded-3xl border p-7" style={{ background: P.surface, borderColor: P.border }}>
              <p className="text-sm text-center" style={{ color: P.muted }}>Chọn nghĩa đúng của từ</p><p className="hanzi text-6xl font-black text-center my-7">{word.hanzi}</p>
              <div className="grid sm:grid-cols-2 gap-3">{options.map((option) => { const revealed = selected !== null; const correct = option.hanzi === word.hanzi; const chosen = selected === option.hanzi; return <button key={option.hanzi} disabled={revealed} onClick={() => answer(option.hanzi)} className="rounded-xl border p-3 text-left font-semibold disabled:cursor-default" style={{ background: revealed && correct ? "#DCFCE7" : revealed && chosen ? "#FEE2E2" : "#FFF8D6", borderColor: revealed && correct ? "#059669" : revealed && chosen ? "#DC2626" : P.border }}>{option.meaning}</button>; })}</div>
              {selected && <p className="mt-5 text-center font-semibold" style={{ color: selected === word.hanzi ? "#059669" : "#DC2626" }}>{selected === word.hanzi ? "Chính xác!" : `Đáp án: ${word.meaning}`}</p>}
            </div>
          )}

          <div className="flex justify-between items-center mt-4">
            <button disabled={index === 0} onClick={() => { setIndex((value) => value - 1); setSelected(null); setFlipped(false); }} className="flex items-center gap-1 px-4 py-2 rounded-xl disabled:opacity-30" style={{ background: P.soft }}><ChevronLeft size={16}/> Trước</button>
            {quiz && <span className="text-sm font-bold text-emerald-700">Đúng: {score}/{topic.words.length}</span>}
            <button disabled={quiz && !selected} onClick={next} className="flex items-center gap-1 px-4 py-2 rounded-xl text-white disabled:opacity-40" style={{ background: "#B45309" }}>{index === topic.words.length - 1 ? <><RotateCcw size={15}/> Hoàn thành</> : <>Tiếp <ChevronRight size={16}/></>}</button>
          </div>
        </section>
      </div>
    </main>
  );
}
