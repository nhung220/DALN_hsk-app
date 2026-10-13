import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken, makeSetCookieHeader } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null) as { email?: string; password?: string } | null;
    if (!body) {
      return NextResponse.json({ error: "Dữ liệu đăng nhập không hợp lệ." }, { status: 400 });
    }
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Vui lòng nhập email và mật khẩu." }, { status: 400 });
    }

    // Luôn so sánh lowercase — tìm case-insensitive qua Prisma
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
      select: { id: true, name: true, email: true, passwordHash: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Email hoặc mật khẩu không đúng." }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Email hoặc mật khẩu không đúng." }, { status: 401 });
    }

    const token = signToken({ sub: user.id, name: user.name, email: user.email });

    return NextResponse.json(
      { user: { id: user.id, name: user.name, email: user.email } },
      { headers: { "Set-Cookie": makeSetCookieHeader(token) } }
    );
  } catch (err) {
    console.error("[login]", err);
    if (err instanceof Error && err.message === "AUTH_SECRET_MISSING") {
      return NextResponse.json({ error: "Máy chủ chưa cấu hình NEXTAUTH_SECRET." }, { status: 503 });
    }
    if (err instanceof Error && /Can't reach database server|connection|P1001/i.test(err.message)) {
      return NextResponse.json({ error: "Không thể kết nối cơ sở dữ liệu. Vui lòng thử lại sau." }, { status: 503 });
    }
    return NextResponse.json({ error: "Lỗi server, thử lại sau." }, { status: 500 });
  }
}
