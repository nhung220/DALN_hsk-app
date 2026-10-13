"use client";

/**
 * AuthProvider — API mode
 * Gọi /api/auth/* để xác thực, lưu session trong JWT cookie (HttpOnly).
 * Trạng thái user client được đồng bộ từ /api/auth/me khi mount.
 */

import {
  createContext, useContext, useState, useCallback, useEffect,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

// ─── Sync localStorage data → DB sau khi đăng nhập ──────────────────────────

/**
 * Khi user đăng nhập lần đầu, đẩy toàn bộ dữ liệu còn trong localStorage
 * (SM-2 cards, lesson progress, notebook) lên DB trước khi tải trang học.
 */
async function syncLocalStorageToDB(): Promise<void> {
  if (typeof window === "undefined") return;

  // 1. SM-2 Flashcard cards
  try {
    const raw = localStorage.getItem("hsk_progress");
    if (raw) {
      const cards = Object.values(JSON.parse(raw) as Record<string, unknown>);
      if (cards.length > 0) {
        await fetch("/api/progress/flashcard/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ cards }),
        });
      }
    }
  } catch { /* ignore */ }

  // 2. Lesson progress
  try {
    const raw = localStorage.getItem("hsk_lesson_progress");
    if (raw) {
      const lp = JSON.parse(raw) as Record<string, { completed: boolean; score?: number }>;
      await Promise.all(Object.entries(lp).filter(([, entry]) => entry.completed).map(([lessonId, entry]) =>
          fetch("/api/progress/lesson", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ lessonId, completed: true, score: entry.score ?? 0 }),
          }).catch(() => {})
      ));
    }
  } catch { /* ignore */ }

  // 3. Gate results
  try {
    const raw = localStorage.getItem("hsk_gate_v1");
    if (raw) {
      const gates = JSON.parse(raw) as Record<string, { passed: boolean; score: number }>;
      await Promise.all(Object.entries(gates).map(([setId, entry]) =>
        fetch("/api/progress/gate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ setId, passed: entry.passed, score: entry.score }),
        }).catch(() => {})
      ));
    }
  } catch { /* ignore */ }

  // 4. Notebook entries
  try {
    const raw = localStorage.getItem("hsk_notebook_v1");
    if (raw) {
      const notebook = JSON.parse(raw) as Record<string, {
        wordId: string; level: string; simplified: string;
        pinyin: string; meaning: string; note: string;
      }>;
      await Promise.all(Object.values(notebook).map(entry =>
        fetch("/api/user/notebook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(entry),
        }).catch(() => {})
      ));
    }
  } catch { /* ignore */ }

  // 5. Progress from the newer learning modules
  const moduleCaches: Array<[string, string, "list" | "scores"]> = [
    ["topic", "hsk_topic_progress_v1", "list"],
    ["reading", "hsk_reading_scores_v1", "scores"],
    ["dialogue", "hsk_dialogue_completed_v1", "list"],
    ["exam", "hsk_mock_exam_results_v1", "scores"],
  ];
  for (const [module, key, shape] of moduleCaches) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as string[] | Record<string, number>;
      const entries: Array<[string, number | undefined]> = shape === "list"
        ? (parsed as string[]).map((itemId) => [itemId, undefined])
        : Object.entries(parsed as Record<string, number>);
      await Promise.all(entries.map(([itemId, score]) => fetch("/api/progress/modules", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ module, itemId, completed: true, ...(score !== undefined && { score }) }),
      })));
    } catch { /* ignore malformed local cache or offline state */ }
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({
  children,
  initialUser = null,
}: {
  children: ReactNode;
  initialUser?: AuthUser | null;
}) {
  const [user, setUser]       = useState<AuthUser | null>(initialUser);
  const [loading, setLoading] = useState(!initialUser); // loading cho đến khi check xong
  const router                = useRouter();

  // Khôi phục session từ JWT cookie khi mount (gọi /api/auth/me)
  useEffect(() => {
    if (initialUser) { setLoading(false); return; }
    fetch("/api/auth/me", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.user) setUser(data.user as AuthUser);
      })
      .catch(() => {/* offline */})
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/auth/me", { credentials: "include" });
      if (r.ok) {
        const data = await r.json() as { user: AuthUser };
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch { setUser(null); }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    console.log("[AuthProvider] login start", { email });
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      console.log("[AuthProvider] login response status", r.status, r.ok);
      const data = await r.json() as { user?: AuthUser; error?: string };
      console.log("[AuthProvider] login data", data);
      if (!r.ok) {
        console.log("[AuthProvider] login failed", data.error);
        return { error: data.error ?? "Đăng nhập thất bại." };
      }
      if (data.user) {
        console.log("[AuthProvider] setting user", data.user);
        await syncLocalStorageToDB();
        setUser(data.user);
      }
      console.log("[AuthProvider] login success, returning empty error");
      return {};
    } catch (e) {
      console.error("[AuthProvider] login exception", e);
      return { error: "Không thể kết nối server. Thử lại sau." };
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    console.log("[AuthProvider] register start", { name, email });
    try {
      const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password }),
      });
      console.log("[AuthProvider] register response status", r.status, r.ok);
      const data = await r.json() as { user?: AuthUser; error?: string };
      console.log("[AuthProvider] register data", data);
      if (!r.ok) {
        console.log("[AuthProvider] register failed", data.error);
        return { error: data.error ?? "Đăng ký thất bại." };
      }
      if (data.user) {
        console.log("[AuthProvider] setting user", data.user);
        await syncLocalStorageToDB();
        setUser(data.user);
      }
      console.log("[AuthProvider] register success, returning empty error");
      return {};
    } catch (e) {
      console.error("[AuthProvider] register exception", e);
      return { error: "Không thể kết nối server. Thử lại sau." };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Xóa JWT cookie ở server
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch { /* offline — vẫn clear client */ }
    // Xóa dữ liệu localStorage của tài khoản hiện tại để tránh lẫn
    // dữ liệu với tài khoản khác đăng nhập sau
    if (typeof window !== "undefined") {
      localStorage.removeItem("hsk_progress");
      localStorage.removeItem("hsk_lesson_progress");
      localStorage.removeItem("hsk_gate_v1");
      localStorage.removeItem("hsk_notebook_v1");
      localStorage.removeItem("hsk_topic_progress_v1");
      localStorage.removeItem("hsk_reading_scores_v1");
      localStorage.removeItem("hsk_dialogue_completed_v1");
      localStorage.removeItem("hsk_mock_exam_results_v1");
    }
    setUser(null);
    router.push("/");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
