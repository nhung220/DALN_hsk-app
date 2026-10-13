/**
 * JWT helpers — server-only
 */
import jwt from "jsonwebtoken";
import type { NextRequest } from "next/server";

const DEV_SECRET = "dev_secret_change_me";

if (!process.env.NEXTAUTH_SECRET && process.env.NODE_ENV !== "production") {
  console.warn("[auth] NEXTAUTH_SECRET chưa được set — đang dùng fallback. KHÔNG dùng trong production!");
}
const COOKIE_NAME = "hsk_token";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 ngày

export interface JwtPayload {
  sub: string;   // userId
  name: string;
  email: string;
  iat?: number;
  exp?: number;
}

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV !== "production") return DEV_SECRET;
  throw new Error("AUTH_SECRET_MISSING");
}

export function signToken(payload: Omit<JwtPayload, "iat" | "exp">): string {
  return jwt.sign(payload, getSecret(), { expiresIn: MAX_AGE });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, getSecret()) as JwtPayload;
  } catch {
    return null;
  }
}

/** Lấy userId từ cookie của request, trả null nếu không có / hết hạn */
export function getUserIdFromRequest(req: NextRequest): string | null {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.sub ?? null;
}

/** Lấy full payload từ cookie */
export function getPayloadFromRequest(req: NextRequest): JwtPayload | null {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** Header Set-Cookie để đặt token */
export function makeSetCookieHeader(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax${secure}`;
}

/** Header Set-Cookie để xóa token */
export function makeClearCookieHeader(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}
