import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware — auth hiện dùng localStorage, không dùng cookie JWT.
 * Tất cả route đều được phép truy cập tự do từ middleware.
 * Việc kiểm tra đăng nhập (nếu cần) được xử lý ở client-side component.
 */
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
