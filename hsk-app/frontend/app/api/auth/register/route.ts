import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken, makeSetCookieHeader } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { name?: string; email?: string; password?: string };
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Vui lòng điền đầy đủ thông tin." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Mật khẩu phải có ít nhất 6 ký tự." }, { status: 400 });
    }

    // Normalize email về lowercase khi đăng ký
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedName  = name.trim();

    const existing = await prisma.user.findFirst({
      where: { email: normalizedEmail },
    });
    if (existing) {
      return NextResponse.json({ error: "Email này đã được đăng ký." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name: normalizedName, email: normalizedEmail, passwordHash },
      select: { id: true, name: true, email: true },
    });

    const token = signToken({ sub: user.id, name: user.name, email: user.email });

    return NextResponse.json(
      { user },
      {
        status: 201,
        headers: { "Set-Cookie": makeSetCookieHeader(token) },
      }
    );
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Lỗi server, thử lại sau." }, { status: 500 });
  }
}
