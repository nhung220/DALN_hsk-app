"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { Eye, EyeOff, UserPlus, BookOpen, Loader2, CheckCircle } from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const router       = useRouter();

  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Mật khẩu phải có ít nhất 6 ký tự."); return; }
    setLoading(true);
    try {
      const res = await register(name, email, password);
      if (res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }
      // Hiện thông báo thành công rồi chuyển về từ vựng (đã có session)
      setSuccess(true);
      setTimeout(() => router.replace("/vocabulary"), 1000);
    } catch (err) {
      console.error("[register]", err);
      setError("Đã có lỗi xảy ra. Thử lại sau.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg,#FFF3B0 0%,#FFFBEA 50%,#FFF8D6 100%)" }}>
      <div className="pointer-events-none fixed -top-32 right-1/3 w-96 h-96 rounded-full opacity-20"
        style={{ background: "radial-gradient(circle,#B4530966,transparent 70%)" }} />

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/"
            className="inline-flex items-center gap-2 mb-6 transition-colors text-sm font-medium"
            style={{ color: "#A8956A" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#1C1408"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#A8956A"}
          >
            <BookOpen size={16} /> Về trang chủ
          </Link>
          <h1 className="text-3xl font-extrabold mb-1" style={{ color: "#1C1408" }}>Tạo tài khoản</h1>
          <p className="text-sm" style={{ color: "#78614A" }}>Miễn phí · Lưu tiến độ học mọi thiết bị</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border p-6 space-y-4"
          style={{ background: "#FFF8D6", borderColor: "#E8D98A" }}
        >
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#A8956A" }}>Họ tên</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required autoFocus
              placeholder="Nguyễn Văn A"
              className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all"
              style={{ borderColor: "#E8D98A", background: "#FFFBEA", color: "#1C1408" }}
              onFocus={e => (e.currentTarget.style.borderColor = "#B45309")}
              onBlur={e => (e.currentTarget.style.borderColor = "#E8D98A")}
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#A8956A" }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
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
            {/* Strength hint */}
            {password.length > 0 && (
              <div className="flex gap-1 mt-1">
                {[1,2,3].map(i => (
                  <div key={i} className="h-1 flex-1 rounded-full transition-all"
                    style={{
                      background: password.length >= i * 4
                        ? i === 1 ? "#C0392B" : i === 2 ? "#B45309" : "#059669"
                        : "#E8D98A"
                    }} />
                ))}
              </div>
            )}
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
              Tạo tài khoản thành công! Đang chuyển trang...
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || success}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: success ? "linear-gradient(135deg,#059669,#047857)" : "linear-gradient(135deg,#B45309,#D97706)" }}
          >
            {loading || success ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            {success ? "Đang chuyển trang..." : loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
          </button>

          <p className="text-center text-xs pt-1" style={{ color: "#A8956A" }}>
            Bằng cách đăng ký, bạn đồng ý lưu dữ liệu học tập trên server của chúng tôi.
          </p>
        </form>

        <p className="text-center text-sm mt-5" style={{ color: "#A8956A" }}>
          Đã có tài khoản?{" "}
          <Link href="/login" className="font-semibold transition-colors" style={{ color: "#B45309" }}>
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
