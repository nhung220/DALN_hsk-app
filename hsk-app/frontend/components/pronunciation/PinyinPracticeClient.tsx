"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Headphones, Mic, Play, RotateCcw, Search, Shuffle, Square, Volume2 } from "lucide-react";
import rawData from "@/public/data/pinyin-syllables.json";

type Syllable = { id: string; syllable: string; tone: number; display: string; initial: string | null; final: string; audio: string };
const data = rawData as Syllable[];
const tones = [
  { label: "cao và đều", sign: "—", color: "#DC2626" },
  { label: "đi lên", sign: "↗", color: "#D97706" },
  { label: "hạ rồi lên", sign: "∨", color: "#16A34A" },
  { label: "đi xuống", sign: "↘", color: "#2563EB" },
];
const P = { bg: "#FFFBEA", surface: "#FFFDF0", border: "#E8D98A", muted: "#78614A" };

export default function PinyinPracticeClient() {
  const bases = useMemo(() => [...new Set(data.map((x) => x.syllable))], []);
  const [base, setBase] = useState("ma");
  const [tone, setTone] = useState(1);
  const [query, setQuery] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordUrl, setRecordUrl] = useState<string | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const variants = data.filter((x) => x.syllable === base);
  const current = variants.find((x) => x.tone === tone) ?? variants[0] ?? data[0];
  const filtered = bases.filter((x) => x.includes(query.toLowerCase().trim().replaceAll("ü", "v"))).slice(0, 100);

  useEffect(() => () => { audio.current?.pause(); recorder.current?.stream.getTracks().forEach((x) => x.stop()); }, []);
  function play(item: Syllable) { audio.current?.pause(); audio.current = new Audio(item.audio); void audio.current.play(); }
  function randomize() { const item = data[Math.floor(Math.random() * data.length)]; setBase(item.syllable); setTone(item.tone); }
  async function toggleRecord() {
    if (recording) { recorder.current?.stop(); setRecording(false); return; }
    if (!navigator.mediaDevices || !("MediaRecorder" in window)) { alert("Trình duyệt này chưa hỗ trợ ghi âm."); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const next = new MediaRecorder(stream); chunks.current = []; recorder.current = next;
      next.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
      next.onstop = () => { setRecordUrl((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(new Blob(chunks.current, { type: next.mimeType })); }); stream.getTracks().forEach((x) => x.stop()); };
      next.start(); setRecording(true);
    } catch { alert("Không thể dùng micro. Hãy cấp quyền rồi thử lại."); }
  }

  return <main className="min-h-screen" style={{ background: P.bg }}>
    <header className="border-b" style={{ background: "linear-gradient(135deg,#CFFAFE,#FFFBEA)", borderColor: P.border }}><div className="max-w-6xl mx-auto px-4 py-9 flex gap-3"><Mic className="text-cyan-700"/><div><h1 className="text-2xl font-extrabold">Luyện phát âm Pinyin</h1><p className="text-sm mt-1" style={{ color: P.muted }}>Nghe âm chuẩn, luyện thanh điệu, ghi âm và tự so sánh.</p></div></div></header>
    <div className="max-w-6xl mx-auto px-4 py-7 grid lg:grid-cols-[300px_1fr] gap-6">
      <aside className="rounded-2xl border p-4 self-start" style={{ background: P.surface, borderColor: P.border }}>
        <label className="relative block"><Search size={15} className="absolute left-3 top-3 text-stone-500"/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm: ma, shi, lü..." className="w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-cyan-500" style={{ borderColor: P.border }}/></label>
        <p className="text-xs my-3" style={{ color: P.muted }}>{bases.length} âm tiết · {data.length} mẫu âm</p>
        <div className="grid grid-cols-4 gap-1.5 max-h-[520px] overflow-y-auto">{filtered.map((item) => <button key={item} onClick={() => { setBase(item); setTone(data.find((x) => x.syllable === item)?.tone ?? 1); }} className="rounded-lg border py-2 text-sm font-semibold" style={{ background: item === base ? "#CFFAFE" : "white", borderColor: item === base ? "#0891B2" : P.border }}>{item.replaceAll("v", "ü")}</button>)}</div>
      </aside>
      <section className="space-y-5">
        <div className="rounded-2xl border p-6 sm:p-8 text-center" style={{ background: P.surface, borderColor: P.border }}>
          <div className="flex justify-end"><button onClick={randomize} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold bg-cyan-50 text-cyan-700"><Shuffle size={15}/> Ngẫu nhiên</button></div>
          <p className="text-xs uppercase tracking-widest font-bold" style={{ color: P.muted }}>Âm tiết đang luyện</p>
          <p className="text-7xl sm:text-8xl font-black my-4" style={{ color: tones[current.tone - 1]?.color }}>{current.display}</p>
          <div className="flex justify-center gap-2 mb-4">{variants.map((item) => <button key={item.id} onClick={() => setTone(item.tone)} className="w-12 h-12 rounded-xl border text-xl font-bold hover:scale-105" style={{ background: item.tone === tone ? tones[item.tone - 1].color : "#FFF8D6", color: item.tone === tone ? "white" : tones[item.tone - 1].color, borderColor: tones[item.tone - 1].color }}>{item.display}</button>)}</div>
          <p className="text-sm font-semibold mb-4" style={{ color: tones[current.tone - 1]?.color }}>Thanh {current.tone}: {tones[current.tone - 1]?.label}</p>
          <button onClick={() => play(current)} className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-white font-bold bg-cyan-700"><Volume2 size={19}/> Nghe âm chuẩn</button>
          <div className="grid sm:grid-cols-2 gap-3 mt-7 text-left"><div className="rounded-xl p-4 bg-cyan-50"><p className="text-xs" style={{ color: P.muted }}>Thanh mẫu (âm đầu)</p><p className="text-xl font-bold text-cyan-800">{current.initial?.replaceAll("v", "ü") || "Không có"}</p></div><div className="rounded-xl p-4 bg-amber-50"><p className="text-xs" style={{ color: P.muted }}>Vận mẫu (vần)</p><p className="text-xl font-bold text-amber-800">{current.final.replaceAll("v", "ü")}</p></div></div>
        </div>
        <div className="rounded-2xl border p-5" style={{ background: P.surface, borderColor: P.border }}><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold flex gap-2"><Headphones size={18}/> Ghi âm để so sánh</h2><p className="text-xs mt-1" style={{ color: P.muted }}>Nghe mẫu → ghi âm → nghe lại giọng của bạn.</p></div><button onClick={toggleRecord} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-white font-semibold ${recording ? "bg-red-600" : "bg-green-600"}`}>{recording ? <Square size={15}/> : <Mic size={15}/>} {recording ? "Dừng ghi" : "Bắt đầu ghi"}</button></div>{recording && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 animate-pulse">● Đang ghi… hãy đọc “{current.display}”</p>}{recordUrl && !recording && <div className="mt-4 flex items-center gap-3"><audio src={recordUrl} controls className="h-10 max-w-full"/><button onClick={() => setRecordUrl(null)} className="flex items-center gap-1 text-sm"><RotateCcw size={14}/> Ghi lại</button></div>}</div>
        <div className="rounded-2xl border p-5 bg-amber-50" style={{ borderColor: P.border }}><h2 className="font-bold mb-3">Luyện nhanh bốn thanh</h2><div className="grid sm:grid-cols-2 gap-2">{tones.map((item, i) => <button key={item.label} disabled={!variants.some((x) => x.tone === i + 1)} onClick={() => { const next = variants.find((x) => x.tone === i + 1); if (next) { setTone(i + 1); play(next); } }} className="flex items-center gap-3 rounded-xl border bg-white p-3 disabled:opacity-40" style={{ borderColor: P.border }}><Play size={14} style={{ color: item.color }}/><span>Thanh {i + 1}: {item.label}</span><b className="ml-auto text-xl" style={{ color: item.color }}>{item.sign}</b></button>)}</div></div>
      </section>
    </div>
  </main>;
}
