import Link from "next/link";
import {
  BookOpen, Zap, BarChart2, Volume2,
  Search, PenTool, MessageCircle, FileText,
  Trophy, BookMarked, Layers, Mic,
  ChevronRight, Sparkles, Flame, Star, GraduationCap,
} from "lucide-react";

interface ModuleCard {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  desc: string;
  count: string;
  href: string;
}

const MODULES: ModuleCard[] = [
  {
    icon: <Volume2 size={22} className="text-white" />,
    iconBg: "#0891B2",
    title: "Luyện phát âm Pinyin",
    desc: "Nghe âm chuẩn theo bốn thanh điệu, ghi âm và tự so sánh cách phát âm",
    count: "407 âm tiết",
    href: "/pronunciation",
  },
  {
    icon: <GraduationCap size={22} className="text-white" />,
    iconBg: "#7C3AED",
    title: "Giáo trình HSK",
    desc: "Học theo chuẩn HSK quốc tế từ cấp độ 1 đến 6, phù hợp với mọi trình độ",
    count: "105 bài",
    href: "/vocabulary",
  },
  {
    icon: <Layers size={22} className="text-white" />,
    iconBg: "#D97706",
    title: "Từ vựng chủ đề",
    desc: "Hệ thống từ vựng được phân loại theo chủ đề để học và phát hiện",
    count: "23 chủ đề",
    href: "/topics",
  },
  {
    icon: <MessageCircle size={22} className="text-white" />,
    iconBg: "#16A34A",
    title: "Hội thoại",
    desc: "Luyện tập hội thoại thực tế với các tình huống giao tiếp hàng ngày",
    count: "32 tình huống",
    href: "/dialogues",
  },
  {
    icon: <FileText size={22} className="text-white" />,
    iconBg: "#7C3AED",
    title: "Đọc hiểu",
    desc: "Nâng cao khả năng đọc hiểu với các bài văn từ cơ bản đến nâng cao",
    count: "33 bài",
    href: "/reading",
  },
  {
    icon: <Trophy size={22} className="text-white" />,
    iconBg: "#DC2626",
    title: "Luyện thi",
    desc: "Đề thi thử với hệ thống chấm điểm tự động và phân tích chi tiết",
    count: "7 đề thi",
    href: "/exams",
  },
  {
    icon: <BookMarked size={22} className="text-white" />,
    iconBg: "#2563EB",
    title: "Sổ tay",
    desc: "Lưu từ vựng yêu thích, ghi chú cá nhân và ôn lại bất cứ lúc nào",
    count: "Cá nhân hoá",
    href: "/notebook",
  },
  {
    icon: <Search size={22} className="text-white" />,
    iconBg: "#0D9488",
    title: "Tra từ điển",
    desc: "Tìm kiếm từ vựng HSK 1–7 với pinyin, nghĩa, ví dụ và bộ thủ",
    count: "2,100+ từ",
    href: "/search",
  },
  {
    icon: <BarChart2 size={22} className="text-white" />,
    iconBg: "#EA580C",
    title: "Tiến độ",
    desc: "Theo dõi quá trình học tập, thống kê chuỗi ngày và điểm số",
    count: "Thống kê",
    href: "/progress",
  },
  {
    icon: <PenTool size={22} className="text-white" />,
    iconBg: "#9333EA",
    title: "Luyện viết",
    desc: "Luyện viết chữ Hán chuẩn nét, có hướng dẫn và điểm số real-time",
    count: "50 bài",
    href: "/writing",
  },
  {
    icon: <Zap size={22} className="text-white" />,
    iconBg: "#B45309",
    title: "Ôn tập hôm nay",
    desc: "Lịch ôn SM-2 tự động, tối ưu bộ nhớ dài hạn với flashcard",
    count: "SM-2",
    href: "/review",
  },
  {
    icon: <Mic size={22} className="text-white" />,
    iconBg: "#0891B2",
    title: "Gia sư AI",
    desc: "Luyện hội thoại, hỏi ngữ pháp và nhận giải thích từ AI thông minh",
    count: "AI",
    href: "/ai-tutor",
  },
];

const LEVELS = [
  { n: 1, label: "Sơ cấp 1",   words: "500",  color: "#2563EB", bg: "#EFF6FF" },
  { n: 2, label: "Sơ cấp 2",   words: "772",  color: "#0EA5E9", bg: "#F0F9FF" },
  { n: 3, label: "Trung cấp",  words: "973",  color: "#16A34A", bg: "#F0FDF4" },
  { n: 4, label: "Trung cấp",  words: "1000", color: "#15803D", bg: "#F0FDF4" },
  { n: 5, label: "Cao cấp",    words: "1071", color: "#B45309", bg: "#FFFBEB" },
  { n: 6, label: "Cao cấp",    words: "1140", color: "#D97706", bg: "#FFFBEB" },
  { n: 7, label: "Thành thạo", words: "1000", color: "#DC2626", bg: "#FEF2F2" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFBEA" }}>

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#FFF8D0 0%,#FFF3A0 50%,#FFEDB0 100%)" }}>
        <div className="pointer-events-none absolute top-0 left-0 w-[500px] h-[500px] opacity-40"
          style={{ background: "radial-gradient(circle at 20% 20%,#FDE68A,transparent 60%)" }} />
        <div className="pointer-events-none absolute bottom-0 right-0 w-[400px] h-[400px] opacity-30"
          style={{ background: "radial-gradient(circle at 80% 80%,#FCD34D,transparent 60%)" }} />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

            {/* Left */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold mb-5"
                style={{ background: "#FEF3C7", borderColor: "#FCD34D", color: "#92400E" }}>
                <Sparkles size={12} />
                Nền tảng học tiếng Trung #1 Việt Nam
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl leading-[1.05] mb-4"
                style={{ color: "#1C1408", fontWeight: 900, letterSpacing: "-0.02em" }}>
                Chinh phục
                <br />
                <span style={{
                  background: "linear-gradient(90deg,#B45309,#D97706)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontWeight: 900,
                }}>
                  Tiếng Trung
                </span>
                {" "}dễ dàng
              </h1>

              <p className="text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8"
                style={{ color: "#78614A" }}>
                Hệ thống học tiếng Trung toàn diện theo chuẩn HSK quốc tế — từ vựng, ngữ pháp,
                luyện viết, ôn tập — tất cả trong một nền tảng duy nhất.
              </p>

              <div className="flex flex-wrap gap-3 justify-center lg:justify-start mb-8">
                <Link href="/vocabulary"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 hover:scale-[1.02]"
                  style={{ background: "linear-gradient(135deg,#B45309,#D97706)" }}>
                  <BookOpen size={16} />
                  Bắt đầu học ngay
                </Link>
                <Link href="/review"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02]"
                  style={{ background: "#FEF3C7", border: "1.5px solid #FCD34D", color: "#92400E" }}>
                  <Zap size={16} />
                  Ôn tập flashcard
                </Link>
              </div>

              <div className="flex items-center gap-3 justify-center lg:justify-start">
                <div className="flex -space-x-2">
                  {["#7C3AED","#2563EB","#16A34A","#DC2626"].map((c, i) => (
                    <div key={i} className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ background: c, borderColor: "#FFFBEA" }}>
                      {["A","B","C","D"][i]}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} size={12} className="text-yellow-500" fill="currentColor" />)}
                  </div>
                  <span className="text-xs" style={{ color: "#78614A" }}>
                    Hơn <strong style={{ color: "#1C1408" }}>50,000+</strong> học viên đang học
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Feature card */}
            <div className="flex-shrink-0 w-full max-w-xs lg:max-w-sm">
              <div className="rounded-2xl border overflow-hidden shadow-lg"
                style={{ background: "#FFFDF0", borderColor: "#E8D98A" }}>
                <div className="px-6 py-6 text-center border-b"
                  style={{ background: "#FEF9C3", borderColor: "#FDE68A" }}>
                  <div className="hanzi text-6xl font-black mb-1" style={{ color: "#1C1408", lineHeight: 1.1 }}>你好</div>
                  <div className="text-sm tracking-widest mb-2" style={{ color: "#78614A" }}>nǐ hǎo</div>
                  <div className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full"
                    style={{ background: "#FEF3C7", color: "#92400E" }}>
                    <Volume2 size={11} /> Xin chào
                  </div>
                </div>

                <div className="px-5 py-4 border-b" style={{ borderColor: "#F5E9C0" }}>
                  <p className="text-[10px] uppercase tracking-widest font-semibold mb-2.5" style={{ color: "#A08060" }}>
                    HSK LEVEL
                  </p>
                  <div className="flex gap-1.5">
                    {[1,2,3,4,5].map(n => (
                      <Link key={n} href={`/vocabulary?level=${n}`}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all hover:scale-105"
                        style={n === 1
                          ? { background: "#B45309", color: "white" }
                          : { background: "#FEF3C7", color: "#92400E", border: "1px solid #FCD34D" }}>
                        {n}
                      </Link>
                    ))}
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs"
                      style={{ background: "#F5E9C0", color: "#A08060" }}>···</span>
                  </div>
                </div>

                <div className="px-5 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "#FEF3C7" }}>
                    <Flame size={20} className="text-orange-500" />
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: "#1C1408" }}>7 Ngày</p>
                    <p className="text-xs" style={{ color: "#78614A" }}>Chuỗi học liên tục</p>
                  </div>
                  <div className="ml-auto text-lg">🔥</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3">
                {[
                  { v: "7",    l: "Cấp độ",  c: "#B45309" },
                  { v: "105",  l: "Bài học",  c: "#1C1408" },
                  { v: "2.1k+",l: "Từ vựng", c: "#16A34A" },
                ].map(s => (
                  <div key={s.l} className="rounded-xl border py-3 text-center"
                    style={{ background: "#FFFDF0", borderColor: "#E8D98A" }}>
                    <p className="text-lg font-extrabold" style={{ color: s.c }}>{s.v}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "#78614A" }}>{s.l}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══ FEATURES ══════════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-semibold rounded-full px-3 py-1 mb-3"
            style={{ background: "#FEF3C7", color: "#92400E", border: "1px solid #FCD34D" }}>
            <Sparkles size={11} /> Nội dung đa dạng
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-2" style={{ color: "#1C1408" }}>
            Tất cả những gì bạn cần<br />
            <span style={{
              background: "linear-gradient(90deg,#B45309,#D97706)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              để thành thạo tiếng Trung
            </span>
          </h2>
          <p className="text-sm max-w-md mx-auto" style={{ color: "#78614A" }}>
            11 chuyên mục học tập được thiết kế khoa học, phù hợp từ người mới bắt đầu đến nâng cao
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {MODULES.map((m) => (
            <Link key={m.title} href={m.href}>
              <div className="group h-full rounded-2xl border p-5 cursor-pointer
                transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
                style={{ background: "#FFFDF0", borderColor: "#E8D98A" }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: m.iconBg }}>
                  {m.icon}
                </div>
                <h3 className="font-bold text-sm mb-1.5" style={{ color: "#1C1408" }}>{m.title}</h3>
                <p className="text-xs leading-relaxed mb-4" style={{ color: "#78614A" }}>{m.desc}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: "#A08060" }}>
                    <BookOpen size={11} />
                    <span>{m.count}</span>
                  </div>
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center transition-all group-hover:translate-x-0.5"
                    style={{ background: "#FEF3C7" }}>
                    <ChevronRight size={13} style={{ color: "#B45309" }} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ══ LEVELS ════════════════════════════════════════════════════════════ */}
      <section style={{ background: "#FFF8D0" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-[11px] uppercase tracking-widest font-semibold mb-1" style={{ color: "#B45309" }}>
                Lộ trình học
              </p>
              <h2 className="text-2xl font-extrabold" style={{ color: "#1C1408" }}>Chọn cấp độ của bạn</h2>
            </div>
            <Link href="/vocabulary"
              className="inline-flex items-center gap-1.5 text-sm transition-colors hover:opacity-80"
              style={{ color: "#78614A" }}>
              Xem tất cả <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {LEVELS.map(lv => (
              <Link key={lv.n} href={`/vocabulary?level=${lv.n}`}>
                <div className="group rounded-2xl border p-4 text-center cursor-pointer
                  transition-all duration-200 hover:scale-105 hover:shadow-md"
                  style={{ background: lv.bg, borderColor: "#E8D98A" }}>
                  <p className="text-3xl font-black mb-1" style={{ color: lv.color }}>{lv.n}</p>
                  <p className="font-semibold text-xs" style={{ color: "#1C1408" }}>HSK {lv.n}</p>
                  <p className="text-[10px] mt-0.5 hidden sm:block" style={{ color: "#78614A" }}>{lv.label}</p>
                  <div className="mt-2 text-[10px] font-medium px-2 py-0.5 rounded-full inline-block"
                    style={{ background: `${lv.color}18`, color: lv.color }}>
                    {lv.words} từ
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
