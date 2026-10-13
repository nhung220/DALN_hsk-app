"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { LogIn, LogOut, UserCircle2, ChevronDown, BookMarked, BarChart2 } from "lucide-react";

export default function AuthButton() {
  const { user, logout } = useAuth();
  const [open, setOpen]  = useState(false);
  const menuRef          = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Chưa đăng nhập ──────────────────────────────────────────────────────

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border"
          style={{ color: "#78614A", borderColor: "#E8D98A", background: "#FFF8D6" }}
        >
          <LogIn size={13} /> Đăng nhập
        </Link>
        <Link
          href="/register"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:brightness-110"
          style={{ background: "linear-gradient(135deg,#B45309,#D97706)" }}
        >
          Đăng ký
        </Link>
      </div>
    );
  }

  // ── Đã đăng nhập ────────────────────────────────────────────────────────

  const initials = user.name
    .split(" ")
    .map(w => w[0])
    .slice(-2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all"
        style={{ background: open ? "#FFF3B0" : "transparent" }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#FFF3B0"}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = open ? "#FFF3B0" : "transparent"}
      >
        {/* Avatar */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#B45309,#D97706)" }}
        >
          {initials}
        </div>
        <span className="text-sm font-medium max-w-[100px] truncate hidden sm:block"
          style={{ color: "#1C1408" }}>
          {user.name}
        </span>
        <ChevronDown
          size={13}
          style={{ color: "#A8956A", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
        />
      </button>

      {/* Dropdown menu */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-52 rounded-2xl border py-1.5 z-50 shadow-lg"
          style={{ background: "#FFF8D6", borderColor: "#E8D98A" }}
        >
          {/* User info */}
          <div className="px-4 py-2.5 border-b mb-1" style={{ borderColor: "#F0E9B8" }}>
            <p className="text-sm font-semibold truncate" style={{ color: "#1C1408" }}>{user.name}</p>
            <p className="text-xs truncate" style={{ color: "#A8956A" }}>{user.email}</p>
          </div>

          <Link
            href="/notebook"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2 text-sm transition-colors"
            style={{ color: "#78614A" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#FFF3B0"; (e.currentTarget as HTMLElement).style.color = "#1C1408"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#78614A"; }}
          >
            <BookMarked size={14} /> Sổ tay của tôi
          </Link>
          <Link
            href="/progress"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2 text-sm transition-colors"
            style={{ color: "#78614A" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#FFF3B0"; (e.currentTarget as HTMLElement).style.color = "#1C1408"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#78614A"; }}
          >
            <BarChart2 size={14} /> Tiến độ học
          </Link>

          <div className="border-t mt-1 pt-1" style={{ borderColor: "#F0E9B8" }}>
            <button
              onClick={() => { setOpen(false); void logout(); }}
              className="flex items-center gap-2.5 w-full px-4 py-2 text-sm transition-colors"
              style={{ color: "#C0392B" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(192,57,43,0.08)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <LogOut size={14} /> Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
