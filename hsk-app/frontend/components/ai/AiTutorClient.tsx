"use client";

import { useState } from "react";
import { Bot, CheckCircle, Languages, BookOpen, Sparkles, AlertCircle, Loader2, RotateCcw, ChevronDown, Volume2 } from "lucide-react";
import Link from "next/link";

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

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "grammar" | "translate" | "explain";

interface GrammarResult {
  isCorrect: boolean;
  correctedSentence: string;
  errors: { type: string; original: string; suggestion: string; explanation: string }[];
  score: number;
  overallFeedback: string;
}

interface TranslateResult {
  score: number;
  referenceSolution: string;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

interface ExplainResult {
  meanings: string[];
  examples: { zh: string; vi: string; pinyin: string }[];
  synonyms: string[];
  antonyms: string[];
  memoryTip: string;
  usageNote?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const style =
    score >= 85 ? { color: "#059669", background: "rgba(5,150,105,0.12)", border: "1px solid rgba(5,150,105,0.3)" } :
    score >= 65 ? { color: "#B45309", background: "rgba(180,83,9,0.12)",  border: "1px solid rgba(180,83,9,0.3)" } :
                  { color: "#C0392B", background: "rgba(192,57,43,0.12)", border: "1px solid rgba(192,57,43,0.3)" };
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold" style={style}>
      {score}/100
    </span>
  );
}

function playTTS(text: string) {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "zh-CN"; utt.rate = 0.85;
    window.speechSynthesis.speak(utt);
  }
}

// ─── Shared input styles ──────────────────────────────────────────────────────

const inputClass = "w-full rounded-2xl border px-4 py-3 bg-transparent resize-none outline-none transition-all";
const inputStyle = { borderColor: P.border, color: P.text, background: P.surface, fontFamily: "'Noto Sans SC', Inter, sans-serif" };
const labelStyle = { color: P.textFaint };

// ─── Grammar Tab ──────────────────────────────────────────────────────────────

function GrammarTab() {
  const [sentence, setSentence] = useState("");
  const [result,   setResult]   = useState<GrammarResult | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const check = async () => {
    if (!sentence.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/ai/grammar", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentence }),
      });
      const data = await res.json() as GrammarResult & { error?: string };
      if (!res.ok) { setError(data.error ?? "Lỗi AI."); return; }
      setResult(data);
    } catch { setError("Không thể kết nối. Thử lại sau."); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={labelStyle}>
          Nhập câu tiếng Trung
        </label>
        <div className="relative">
          <textarea
            value={sentence}
            onChange={e => setSentence(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) void check(); }}
            placeholder="Ví dụ: 我昨天去了图书馆看书。"
            rows={3}
            className={`${inputClass} text-base placeholder-[#A8956A]`}
            style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = "#B45309")}
            onBlur={e => (e.currentTarget.style.borderColor = P.border)}
          />
          {sentence && (
            <button onClick={() => playTTS(sentence)}
              className="absolute right-3 bottom-3 transition-colors"
              style={{ color: P.textFaint }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#7C3AED"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = P.textFaint}>
              <Volume2 size={16} />
            </button>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs" style={{ color: P.textFaint }}>Ctrl+Enter để gửi · Tối đa 500 ký tự</p>
          <p className="text-xs" style={{ color: P.textFaint }}>{sentence.length}/500</p>
        </div>
      </div>

      <button onClick={check} disabled={loading || !sentence.trim()}
        className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: "linear-gradient(135deg,#7C3AED,#B45309)" }}>
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
        {loading ? "Đang phân tích..." : "Chấm ngữ pháp"}
      </button>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm"
          style={{ borderColor: "rgba(192,57,43,0.3)", background: "rgba(192,57,43,0.08)", color: "#C0392B" }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {result && (
        <div className="rounded-2xl border p-5 space-y-4 animate-in fade-in duration-300"
          style={{
            borderColor: result.isCorrect ? "rgba(5,150,105,0.3)" : "rgba(192,57,43,0.3)",
            background: result.isCorrect ? "rgba(5,150,105,0.05)" : "rgba(192,57,43,0.04)",
          }}>

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              {result.isCorrect
                ? <CheckCircle size={20} style={{ color: "#059669" }} />
                : <AlertCircle size={20} style={{ color: "#C0392B" }} />}
              <span className="font-bold" style={{ color: P.text }}>
                {result.isCorrect ? "Câu đúng ✓" : "Có lỗi cần sửa"}
              </span>
            </div>
            <ScoreBadge score={result.score} />
          </div>

          {!result.isCorrect && (
            <div className="rounded-xl border px-4 py-3" style={{ borderColor: "rgba(5,150,105,0.25)", background: "rgba(5,150,105,0.06)" }}>
              <p className="text-xs mb-1 font-medium" style={{ color: "#059669" }}>Câu đúng:</p>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-base" style={{ color: "#059669", fontFamily: "'Noto Sans SC', sans-serif" }}>
                  {result.correctedSentence}
                </p>
                <button onClick={() => playTTS(result.correctedSentence)}
                  className="transition-colors flex-shrink-0" style={{ color: "#059669" }}>
                  <Volume2 size={14} />
                </button>
              </div>
            </div>
          )}

          {result.errors.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: P.textFaint }}>Phân tích lỗi</p>
              {result.errors.map((err, i) => (
                <div key={i} className="rounded-xl border px-4 py-3 space-y-1"
                  style={{ borderColor: P.border, background: P.surface }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(192,57,43,0.12)", color: "#C0392B" }}>
                      {err.type}
                    </span>
                    <span className="text-sm line-through" style={{ color: P.textFaint, fontFamily: "'Noto Sans SC', sans-serif" }}>{err.original}</span>
                    <span style={{ color: P.border }}>→</span>
                    <span className="text-sm font-semibold" style={{ color: "#059669", fontFamily: "'Noto Sans SC', sans-serif" }}>{err.suggestion}</span>
                  </div>
                  <p className="text-xs" style={{ color: P.textMuted }}>{err.explanation}</p>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-xl border px-4 py-3"
            style={{ borderColor: "rgba(124,58,237,0.25)", background: "rgba(124,58,237,0.06)" }}>
            <p className="text-xs mb-1 font-medium" style={{ color: "#7C3AED" }}>Nhận xét tổng quan</p>
            <p className="text-sm" style={{ color: P.textMuted }}>{result.overallFeedback}</p>
          </div>

          <button onClick={() => { setResult(null); setSentence(""); }}
            className="flex items-center gap-1.5 text-xs transition-colors"
            style={{ color: P.textFaint }}>
            <RotateCcw size={12} /> Nhập câu mới
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Translate Tab ────────────────────────────────────────────────────────────

function TranslateTab() {
  const [direction,       setDirection]       = useState<"zh2vi" | "vi2zh">("zh2vi");
  const [original,        setOriginal]        = useState("");
  const [userTranslation, setUserTranslation] = useState("");
  const [result,          setResult]          = useState<TranslateResult | null>(null);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState("");

  const check = async () => {
    if (!original.trim() || !userTranslation.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/ai/translate", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ original, userTranslation, direction }),
      });
      const data = await res.json() as TranslateResult & { error?: string };
      if (!res.ok) { setError(data.error ?? "Lỗi AI."); return; }
      setResult(data);
    } catch { setError("Không thể kết nối. Thử lại sau."); }
    finally { setLoading(false); }
  };

  const srcLang = direction === "zh2vi" ? "Câu tiếng Trung" : "Câu tiếng Việt";
  const dstLang = direction === "zh2vi" ? "Bản dịch của bạn (tiếng Việt)" : "Bản dịch của bạn (tiếng Trung)";

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {(["zh2vi", "vi2zh"] as const).map(d => (
          <button key={d} onClick={() => { setDirection(d); setResult(null); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={direction === d
              ? { background: "#059669", color: "#fff" }
              : { background: P.surfaceHover, color: P.textMuted }}>
            <Languages size={14} />
            {d === "zh2vi" ? "中 → Việt" : "Việt → 中"}
          </button>
        ))}
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={labelStyle}>{srcLang}</label>
        <textarea value={original} onChange={e => setOriginal(e.target.value)} rows={2}
          placeholder={direction === "zh2vi" ? "Ví dụ: 我每天都会学习中文。" : "Ví dụ: Tôi học tiếng Trung mỗi ngày."}
          className={`${inputClass} placeholder-[#A8956A]`} style={inputStyle}
          onFocus={e => (e.currentTarget.style.borderColor = "#059669")}
          onBlur={e => (e.currentTarget.style.borderColor = P.border)} />
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={labelStyle}>{dstLang}</label>
        <textarea value={userTranslation} onChange={e => setUserTranslation(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) void check(); }} rows={2}
          placeholder="Nhập bản dịch của bạn..."
          className={`${inputClass} placeholder-[#A8956A]`} style={inputStyle}
          onFocus={e => (e.currentTarget.style.borderColor = "#059669")}
          onBlur={e => (e.currentTarget.style.borderColor = P.border)} />
      </div>

      <button onClick={check} disabled={loading || !original.trim() || !userTranslation.trim()}
        className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: "linear-gradient(135deg,#059669,#34D399)" }}>
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
        {loading ? "Đang chấm điểm..." : "Chấm bài dịch"}
      </button>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm"
          style={{ borderColor: "rgba(192,57,43,0.3)", background: "rgba(192,57,43,0.08)", color: "#C0392B" }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {result && (
        <div className="rounded-2xl border p-5 space-y-4 animate-in fade-in duration-300"
          style={{ borderColor: "rgba(5,150,105,0.3)", background: "rgba(5,150,105,0.04)" }}>

          <div className="flex items-center justify-between flex-wrap gap-3">
            <span className="font-bold" style={{ color: P.text }}>Kết quả chấm điểm</span>
            <ScoreBadge score={result.score} />
          </div>

          <div className="rounded-xl border px-4 py-3"
            style={{ borderColor: "rgba(5,150,105,0.25)", background: "rgba(5,150,105,0.06)" }}>
            <p className="text-xs mb-1 font-medium" style={{ color: "#059669" }}>Bản dịch mẫu tốt nhất:</p>
            <p className="font-semibold" style={{ color: "#059669", fontFamily: "'Noto Sans SC', Inter, sans-serif" }}>
              {result.referenceSolution}
            </p>
          </div>

          <p className="text-sm leading-relaxed" style={{ color: P.textMuted }}>{result.feedback}</p>

          <div className="grid sm:grid-cols-2 gap-3">
            {result.strengths.length > 0 && (
              <div className="rounded-xl border px-4 py-3"
                style={{ borderColor: "rgba(5,150,105,0.2)", background: "rgba(5,150,105,0.06)" }}>
                <p className="text-xs font-bold mb-2" style={{ color: "#059669" }}>✓ Điểm tốt</p>
                <ul className="space-y-1">
                  {result.strengths.map((s, i) => <li key={i} className="text-xs" style={{ color: P.textMuted }}>• {s}</li>)}
                </ul>
              </div>
            )}
            {result.improvements.length > 0 && (
              <div className="rounded-xl border px-4 py-3"
                style={{ borderColor: "rgba(234,88,12,0.2)", background: "rgba(234,88,12,0.06)" }}>
                <p className="text-xs font-bold mb-2" style={{ color: "#EA580C" }}>↑ Cần cải thiện</p>
                <ul className="space-y-1">
                  {result.improvements.map((s, i) => <li key={i} className="text-xs" style={{ color: P.textMuted }}>• {s}</li>)}
                </ul>
              </div>
            )}
          </div>

          <button onClick={() => { setResult(null); setOriginal(""); setUserTranslation(""); }}
            className="flex items-center gap-1.5 text-xs transition-colors" style={{ color: P.textFaint }}>
            <RotateCcw size={12} /> Làm bài mới
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Explain Tab ──────────────────────────────────────────────────────────────

function ExplainTab() {
  const [hanzi,   setHanzi]   = useState("");
  const [context, setContext] = useState("");
  const [showCtx, setShowCtx] = useState(false);
  const [result,  setResult]  = useState<ExplainResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const explain = async () => {
    if (!hanzi.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/ai/explain", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hanzi, context: context || undefined }),
      });
      const data = await res.json() as ExplainResult & { error?: string };
      if (!res.ok) { setError(data.error ?? "Lỗi AI."); return; }
      setResult(data);
    } catch { setError("Không thể kết nối. Thử lại sau."); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={labelStyle}>
          Nhập chữ Hán hoặc từ cần giải thích
        </label>
        <div className="flex gap-2">
          <input value={hanzi} onChange={e => setHanzi(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") void explain(); }}
            placeholder="Ví dụ: 学习 hoặc 一下"
            className="flex-1 rounded-xl border px-4 py-3 bg-transparent outline-none transition-all placeholder-[#A8956A] text-base"
            style={{ ...inputStyle, fontFamily: "'Noto Sans SC', sans-serif" }}
            onFocus={e => (e.currentTarget.style.borderColor = "#B45309")}
            onBlur={e => (e.currentTarget.style.borderColor = P.border)} />
          {hanzi && (
            <button onClick={() => playTTS(hanzi)}
              className="px-4 rounded-xl border transition-all"
              style={{ borderColor: P.border, color: P.textFaint, background: P.surface }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "#7C3AED";
                (e.currentTarget as HTMLElement).style.color = "#7C3AED";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = P.border;
                (e.currentTarget as HTMLElement).style.color = P.textFaint;
              }}>
              <Volume2 size={18} />
            </button>
          )}
        </div>
      </div>

      <div>
        <button onClick={() => setShowCtx(v => !v)}
          className="flex items-center gap-1.5 text-xs transition-colors" style={{ color: P.textFaint }}>
          <ChevronDown size={12} className={showCtx ? "rotate-180 transition-transform" : "transition-transform"} />
          Thêm ngữ cảnh câu (tuỳ chọn, cho kết quả chính xác hơn)
        </button>
        {showCtx && (
          <textarea value={context} onChange={e => setContext(e.target.value)} rows={2}
            placeholder="Câu chứa từ này... VD: 我们需要学习更多的词汇。"
            className={`mt-2 ${inputClass} placeholder-[#A8956A] text-sm`} style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = "#B45309")}
            onBlur={e => (e.currentTarget.style.borderColor = P.border)} />
        )}
      </div>

      <button onClick={explain} disabled={loading || !hanzi.trim()}
        className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: "linear-gradient(135deg,#B45309,#F59E0B)" }}>
        {loading ? <Loader2 size={16} className="animate-spin" /> : <BookOpen size={16} />}
        {loading ? "Đang giải thích..." : "Giải thích từ"}
      </button>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm"
          style={{ borderColor: "rgba(192,57,43,0.3)", background: "rgba(192,57,43,0.08)", color: "#C0392B" }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {result && (
        <div className="rounded-2xl border p-5 space-y-4 animate-in fade-in duration-300"
          style={{ borderColor: "rgba(180,83,9,0.3)", background: "rgba(180,83,9,0.04)" }}>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "#B45309" }}>Nghĩa</p>
            <ul className="space-y-1">
              {result.meanings.map((m, i) => (
                <li key={i} className="text-sm" style={{ color: P.textMuted }}>
                  <span className="mr-2" style={{ color: P.textFaint }}>{i + 1}.</span>{m}
                </li>
              ))}
            </ul>
          </div>

          {result.examples.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "#B45309" }}>Câu ví dụ</p>
              <div className="space-y-2">
                {result.examples.map((ex, i) => (
                  <div key={i} className="rounded-xl border px-4 py-3"
                    style={{ borderColor: P.border, background: P.surface }}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold" style={{ color: P.text, fontFamily: "'Noto Sans SC', sans-serif" }}>{ex.zh}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#7C3AED" }}>{ex.pinyin}</p>
                        <p className="text-xs mt-0.5" style={{ color: P.textMuted }}>{ex.vi}</p>
                      </div>
                      <button onClick={() => playTTS(ex.zh)}
                        className="transition-colors flex-shrink-0 mt-0.5" style={{ color: P.textFaint }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#B45309"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = P.textFaint}>
                        <Volume2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            {result.synonyms.length > 0 && (
              <div className="rounded-xl border px-4 py-3"
                style={{ borderColor: "rgba(37,99,235,0.2)", background: "rgba(37,99,235,0.06)" }}>
                <p className="text-xs font-bold mb-2" style={{ color: "#2563EB" }}>Từ đồng nghĩa</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.synonyms.map((s, i) => (
                    <button key={i} onClick={() => { setHanzi(s); setResult(null); }}
                      className="px-2 py-0.5 rounded-lg text-xs font-medium border transition-colors"
                      style={{ borderColor: "rgba(37,99,235,0.3)", color: "#2563EB", fontFamily: "'Noto Sans SC', sans-serif" }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {result.antonyms.length > 0 && (
              <div className="rounded-xl border px-4 py-3"
                style={{ borderColor: "rgba(192,57,43,0.2)", background: "rgba(192,57,43,0.06)" }}>
                <p className="text-xs font-bold mb-2" style={{ color: "#C0392B" }}>Từ trái nghĩa</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.antonyms.map((s, i) => (
                    <button key={i} onClick={() => { setHanzi(s); setResult(null); }}
                      className="px-2 py-0.5 rounded-lg text-xs font-medium border transition-colors"
                      style={{ borderColor: "rgba(192,57,43,0.3)", color: "#C0392B", fontFamily: "'Noto Sans SC', sans-serif" }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {result.memoryTip && (
            <div className="rounded-xl border px-4 py-3"
              style={{ borderColor: "rgba(180,83,9,0.25)", background: "rgba(180,83,9,0.06)" }}>
              <p className="text-xs font-bold mb-1" style={{ color: "#B45309" }}>💡 Mẹo nhớ từ</p>
              <p className="text-sm" style={{ color: P.textMuted }}>{result.memoryTip}</p>
            </div>
          )}

          {result.usageNote && (
            <div className="rounded-xl border px-4 py-3"
              style={{ borderColor: "rgba(124,58,237,0.25)", background: "rgba(124,58,237,0.06)" }}>
              <p className="text-xs font-bold mb-1" style={{ color: "#7C3AED" }}>📌 Lưu ý khi dùng</p>
              <p className="text-sm" style={{ color: P.textMuted }}>{result.usageNote}</p>
            </div>
          )}

          <button onClick={() => { setResult(null); setHanzi(""); setContext(""); }}
            className="flex items-center gap-1.5 text-xs transition-colors" style={{ color: P.textFaint }}>
            <RotateCcw size={12} /> Tra từ khác
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ReactNode; color: string; desc: string }[] = [
  {
    id: "grammar",
    label: "Chấm ngữ pháp",
    icon: <CheckCircle size={16} />,
    color: "#7C3AED",
    desc: "Phân tích lỗi ngữ pháp, gợi ý sửa câu",
  },
  {
    id: "translate",
    label: "Chấm bài dịch",
    icon: <Languages size={16} />,
    color: "#059669",
    desc: "Chấm điểm và nhận xét bản dịch của bạn",
  },
  {
    id: "explain",
    label: "Giải thích từ",
    icon: <BookOpen size={16} />,
    color: "#B45309",
    desc: "Nghĩa, ví dụ, đồng nghĩa, mẹo nhớ từ",
  },
];

export default function AiTutorClient() {
  const [activeTab, setActiveTab] = useState<Tab>("grammar");
  const active = TABS.find(t => t.id === activeTab)!;

  return (
    <div style={{ minHeight: "100vh", background: P.bg }}>
      {/* ── Hero header ── */}
      <div className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#FFF3B0 0%,#FFFBEA 60%,#FFF8D6 100%)" }}>
        <div className="pointer-events-none absolute -top-24 left-1/3 w-80 h-80 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle,#B45309,transparent 70%)" }} />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#7C3AED,#B45309)" }}>
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight" style={{ color: P.text }}>
                Gia sư <span style={{ color: "#7C3AED" }}>AI</span>
              </h1>
              <p className="text-sm" style={{ color: P.textMuted }}>Powered by Gemini 1.5 Flash · Miễn phí 20 lượt/ngày</p>
            </div>
          </div>

          {/* Tab selector */}
          <div className="flex flex-wrap gap-2">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={activeTab === tab.id
                  ? { background: tab.color, color: "#fff", boxShadow: `0 0 20px ${tab.color}40` }
                  : { background: P.surfaceHover, color: P.textMuted }}>
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Tab description */}
        <div className="flex items-center gap-2 mb-6 p-4 rounded-2xl border"
          style={{ borderColor: `${active.color}30`, background: `${active.color}08` }}>
          <span style={{ color: active.color }}>{active.icon}</span>
          <p className="text-sm" style={{ color: P.textMuted }}>{active.desc}</p>
        </div>

        {activeTab === "grammar"   && <GrammarTab />}
        {activeTab === "translate" && <TranslateTab />}
        {activeTab === "explain"   && <ExplainTab />}
      </div>
    </div>
  );
}
