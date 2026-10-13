"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { Eye, EyeOff, LogIn, BookOpen, Loader2, CheckCircle } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const router    = useRouter();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }
      // Hiện thông báo thành công trước khi chuyển trang
      setSuccess(true);
      // Redirect về trang trước đó hoặc về vocabulary
      const redirectTo = typeof window !== "undefined" 
        ? sessionStorage.getItem("redirect_after_login") || "/vocabulary"
        : "/vocabulary";
      if (typeof window !== "undefined") sessionStorage.removeItem("redirect_after_login");
      setTimeout(() => router.replace(redirectTo), 800);
    } catch (err) {
      console.error("[login] caught:", err);
      setError("Đã có lỗi xảy ra. Thử lại sau.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg,#FFF3B0 0%,#FFFBEA 50%,#FFF8D6 100%)" }}>
      {/* Glow */}
      <div className="pointer-events-none fixed -top-32 left-1/3 w-96 h-96 rounded-full opacity-20"
        style={{ background: "radial-gradient(circle,#B4530966,transparent 70%)" }} />

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/"
            className="inline-flex items-center gap-2 mb-6 transition-colors text-sm font-medium"
            style={{ color: "#A8956A" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#1C1408"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#A8956A"}
          >
            <BookOpen size={16} /> Về trang chủ
          </Link>
          <h1 className="text-3xl font-extrabold mb-1" style={{ color: "#1C1408" }}>Đăng nhập</h1>
          <p className="text-sm" style={{ color: "#78614A" }}>Tiếp tục hành trình học HSK của bạn</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border p-6 space-y-4"
          style={{ background: "#FFF8D6", borderColor: "#E8D98A" }}
        >
          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#A8956A" }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              placeholder="ten@email.com"
              className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all"
              style={{ borderColor: "#E8D98A", background: "#FFFBEA", color: "#1C1408" }}
              onFocus={e => (e.currentTarget.style.borderColor = "#B45309")}
              onBlur={e => (e.currentTarget.style.borderColor = "#E8D98A")}
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#A8956A" }}>Mật khẩu</label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Ít nhất 6 ký tự"
                className="w-full rounded-xl border px-4 py-3 pr-11 text-sm outline-none transition-all"
                style={{ borderColor: "#E8D98A", background: "#FFFBEA", color: "#1C1408" }}
                onFocus={e => (e.currentTarget.style.borderColor = "#B45309")}
                onBlur={e => (e.currentTarget.style.borderColor = "#E8D98A")}
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: "#A8956A" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#1C1408"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#A8956A"}
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs rounded-xl px-3 py-2"
              style={{ color: "#C0392B", background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.25)" }}>
              {error}
            </p>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center gap-2 text-xs rounded-xl px-3 py-2"
              style={{ color: "#059669", background: "rgba(5,150,105,0.08)", border: "1px solid rgba(5,150,105,0.25)" }}>
              <CheckCircle size={14} />
              Đăng nhập thành công! Đang chuyển trang...
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || success}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: success ? "linear-gradient(135deg,#059669,#047857)" : "linear-gradient(135deg,#B45309,#D97706)" }}
          >
            {loading || success ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
            {success ? "Đang chuyển trang..." : loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <p className="text-center text-sm mt-5" style={{ color: "#A8956A" }}>
          Chưa có tài khoản?{" "}
          <Link href="/register" className="font-semibold transition-colors" style={{ color: "#B45309" }}>
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
