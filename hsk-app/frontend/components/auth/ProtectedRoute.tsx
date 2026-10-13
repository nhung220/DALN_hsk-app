"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function ProtectedRoute({ children, redirectTo = "/login" }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && !user && mounted) {
      // Lưu URL hiện tại để redirect về sau khi đăng nhập
      const currentPath = window.location.pathname + window.location.search;
      if (currentPath !== redirectTo) {
        sessionStorage.setItem("redirect_after_login", currentPath);
      }
      router.replace(redirectTo);
    }
  }, [user, loading, mounted, router, redirectTo]);

  // Đang loading hoặc chưa mount
  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg,#FFF3B0 0%,#FFFBEA 50%,#FFF8D6 100%)" }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin" style={{ color: "#B45309" }} />
          <p className="text-sm" style={{ color: "#78614A" }}>Đang tải...</p>
        </div>
      </div>
    );
  }

  // Chưa đăng nhập → đang redirect
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg,#FFF3B0 0%,#FFFBEA 50%,#FFF8D6 100%)" }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin" style={{ color: "#B45309" }} />
          <p className="text-sm" style={{ color: "#78614A" }}>Đang chuyển hướng...</p>
        </div>
      </div>
    );
  }

  // Đã đăng nhập → hiển thị nội dung
  return <>{children}</>;
}
