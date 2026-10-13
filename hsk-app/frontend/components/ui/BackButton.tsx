"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BackButton({ href }: { href?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => (href ? router.push(href) : router.back())}
      className="flex items-center gap-2 text-sm transition-colors"
      style={{ color: "#A8956A" }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#1C1408"}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#A8956A"}
    >
      <ArrowLeft size={16} />
      Quay lại
    </button>
  );
}
