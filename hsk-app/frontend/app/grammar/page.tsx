import Link from "next/link";
import { ArrowRight, BookOpenCheck, BookText, Brain, CheckCircle2, Layers3, PenLine, Route, Sparkles } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { fetchGrammarLevelSync } from "@/lib/grammarDataServer";

export const metadata = { title: "Ngữ pháp | HSK 3.0" };

const COLORS = ["#C0392B", "#2563EB", "#059669", "#B45309", "#7C3AED", "#EA580C"];

export default function GrammarPage() {
  const levels = Array.from({ length: 6 }, (_, index) => {
    const data = fetchGrammarLevelSync(index + 1);
    return { number: index + 1, points: data.totalPoints, examples: data.totalExamples, color: COLORS[index] };
  });
  const totalPoints = levels.reduce((sum, level) => sum + level.points, 0);
  const totalExamples = levels.reduce((sum, level) => sum + level.examples, 0);

  return <ProtectedRoute><main className="min-h-screen bg-[#FFFBEA] text-[#1C1408]">
    <section className="border-b border-[#E8D98A] bg-[radial-gradient(circle_at_top_right,#EDE9FE_0,transparent_38%),linear-gradient(135deg,#FFF3B0,#FFFBEA)]">
      <div className="max-w-6xl mx-auto px-4 py-10 md:py-14 grid lg:grid-cols-[1.25fr_.75fr] gap-8 items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/70 border border-[#E8D98A] px-3 py-1.5 text-xs font-bold text-[#7C3AED]"><Sparkles size={14}/> Lộ trình ngữ pháp HSK</span>
          <h1 className="mt-4 text-3xl md:text-5xl font-black leading-tight">Hiểu cấu trúc.<br/><span className="text-[#7C3AED]">Dùng được trong câu.</span></h1>
          <p className="mt-4 max-w-2xl text-[#78614A] leading-7">Học từng điểm ngữ pháp theo một quy trình ngắn: nắm công thức, quan sát ví dụ, tự hoàn thành câu rồi sắp xếp câu để ghi nhớ chủ động.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/grammar/1" className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-5 py-3 text-sm font-bold text-white hover:brightness-110">Bắt đầu từ HSK 1 <ArrowRight size={16}/></Link>
            <span className="rounded-xl border border-[#E8D98A] bg-white/60 px-4 py-3 text-sm text-[#78614A]"><b className="text-[#1C1408]">{totalPoints}</b> điểm · <b className="text-[#1C1408]">{totalExamples.toLocaleString("vi-VN")}</b> ví dụ</span>
          </div>
        </div>
        <div className="rounded-3xl border border-[#D8C7FF] bg-white/75 p-5 shadow-[0_20px_50px_rgba(124,58,237,.10)]">
          <p className="text-sm font-extrabold mb-4">Một bài học gồm 3 bước</p>
          <div className="space-y-3">
            {[
              { icon: BookOpenCheck, n: "01", title: "Hiểu", text: "Công thức và ví dụ có phát âm", color: "#7C3AED" },
              { icon: PenLine, n: "02", title: "Áp dụng", text: "Điền thành phần còn thiếu", color: "#2563EB" },
              { icon: Brain, n: "03", title: "Ghi nhớ", text: "Tự sắp xếp thành câu hoàn chỉnh", color: "#059669" },
            ].map((step) => <div key={step.n} className="flex items-center gap-4 rounded-2xl border border-[#EEE6C7] bg-[#FFFDF0] p-4"><div className="w-10 h-10 rounded-xl grid place-items-center text-white" style={{ background: step.color }}><step.icon size={19}/></div><div className="flex-1"><div className="flex justify-between"><b>{step.title}</b><span className="text-xs font-black" style={{ color: step.color }}>{step.n}</span></div><p className="text-xs mt-1 text-[#78614A]">{step.text}</p></div></div>)}
          </div>
        </div>
      </div>
    </section>

    <section className="max-w-6xl mx-auto px-4 py-9">
      <div className="flex items-end justify-between gap-4 mb-5"><div><p className="text-xs font-bold uppercase tracking-widest text-[#7C3AED]">Chọn cấp độ</p><h2 className="text-2xl font-black mt-1">Lộ trình từ cơ bản đến nâng cao</h2></div><Route className="text-[#A8956A]"/></div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {levels.map((level, index) => <Link key={level.number} href={`/grammar/${level.number}`} className="group relative overflow-hidden rounded-2xl border border-[#E8D98A] bg-[#FFFDF0] p-5 hover:-translate-y-1 hover:shadow-lg transition-all">
          <div className="absolute -right-5 -top-8 text-[110px] font-black opacity-[.045]">{level.number}</div>
          <div className="flex items-start justify-between"><div className="w-11 h-11 rounded-xl grid place-items-center font-black text-white" style={{ background: level.color }}>{level.number}</div>{index === 0 && <span className="rounded-full bg-[#DCFCE7] px-2.5 py-1 text-[10px] font-bold text-[#047857]">Nên bắt đầu</span>}</div>
          <h3 className="mt-5 text-lg font-extrabold">Ngữ pháp HSK {level.number}</h3>
          <p className="mt-1 text-sm text-[#78614A]">{level.points} điểm ngữ pháp · {level.examples} ví dụ</p>
          <div className="mt-5 flex items-center justify-between text-xs font-bold" style={{ color: level.color }}><span>Vào học</span><ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/></div>
        </Link>)}
      </div>
      <div className="mt-7 grid md:grid-cols-3 gap-3">
        {[{ icon: Layers3, title: "Học đúng thứ tự", text: "Bắt đầu từ HSK phù hợp và hoàn thành lần lượt." }, { icon: CheckCircle2, title: "Điểm cao nhất", text: "Mỗi chế độ lưu kết quả tốt nhất theo tài khoản." }, { icon: BookText, title: "Ôn qua ví dụ", text: "Nghe câu mẫu, ẩn pinyin và tự đoán nghĩa." }].map((item) => <div key={item.title} className="flex gap-3 rounded-2xl bg-[#FFF3B0]/55 p-4"><item.icon className="text-[#B45309] shrink-0" size={20}/><div><b className="text-sm">{item.title}</b><p className="text-xs mt-1 leading-5 text-[#78614A]">{item.text}</p></div></div>)}
      </div>
    </section>
  </main></ProtectedRoute>;
}
