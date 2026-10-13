import { NextRequest, NextResponse } from "next/server";
import { getPayloadFromRequest } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const payload = getPayloadFromRequest(req);
  if (!payload) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }
  return NextResponse.json({
    user: { id: payload.sub, name: payload.name, email: payload.email },
  });
}
