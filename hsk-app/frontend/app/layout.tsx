import type { Metadata } from "next";
import { Noto_Sans_SC, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import AuthButton from "@/components/auth/AuthButton";
import Link from "next/link";
import { BookOpen } from "lucide-react";

// ─── Fonts ────────────────────────────────────────────────────────────────────

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",
});

const notoSansSC = Noto_Sans_SC({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subsets: ["chinese-simplified"] as any,
  weight: ["300", "400", "500", "700"],
  variable: "--font-noto",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "HSK Vocabulary - Học từ vựng tiếng Trung",
  description: "Ứng dụng học từ vựng HSK với flashcard SM-2, luyện viết và game từ vựng",
  other: {
    "color-scheme": "light",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${inter.variable} ${notoSansSC.variable}`} style={{ colorScheme: "light" }}>
      <body className="min-h-screen antialiased font-sans" style={{ backgroundColor: "#FFFBEA", color: "#1C1408" }}>
        {/* AuthProvider không nhận initialUser — session đọc từ localStorage client-side */}
        <AuthProvider>
          {/* ── Global Navbar ── */}
          <nav
            className="sticky top-0 z-50 border-b backdrop-blur-md"
            style={{ background: "rgba(255,251,234,0.92)", borderColor: "#E8D98A" }}
          >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between gap-4">
              <Link href="/"
                className="flex items-center gap-2 font-bold text-sm hover:opacity-80 transition-opacity flex-shrink-0"
                style={{ color: "#1C1408" }}
              >
                <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#B45309,#D97706)" }}>
                  <BookOpen size={13} className="text-white" />
                </div>
                <span className="hidden sm:inline">HSK 3.0</span>
              </Link>

              <div className="flex items-center gap-1 text-xs font-medium flex-1 justify-center">
                {[
                  ["/vocabulary", "Từ vựng"],
                  ["/writing",    "Luyện viết"],
                  ["/pronunciation", "Phát âm"],
                  ["/grammar",    "Ngữ pháp"],
                  ["/review",     "Ôn tập"],
                  ["/search",     "Tra từ"],
                  ["/notebook",   "Sổ tay"],
                  ["/progress",   "Tiến độ"],
                  ["/stats",      "Lịch ôn"],
                ].map(([href, label]) => (
                  <Link key={href} href={href}
                    className="px-3 py-1.5 rounded-lg transition-all text-[#78614A] hover:text-[#1C1408] hover:bg-[#F5E9C0]">
                    {label}
                  </Link>
                ))}
                <Link href="/ai-tutor"
                  className="px-3 py-1.5 rounded-lg font-semibold transition-all"
                  style={{ color: "#B45309" }}>
                  Gia sư AI
                </Link>
              </div>

              <div className="flex-shrink-0">
                <AuthButton />
              </div>
            </div>
          </nav>

          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
