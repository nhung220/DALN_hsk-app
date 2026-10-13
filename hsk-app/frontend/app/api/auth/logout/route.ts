import { NextResponse } from "next/server";
import { makeClearCookieHeader } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    { ok: true },
    { headers: { "Set-Cookie": makeClearCookieHeader() } }
  );
}
