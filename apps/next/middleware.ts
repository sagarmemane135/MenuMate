import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /admin/* routes
  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get(
      process.env.COOKIE_NAME || "menumate_session"
    )?.value;

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = await verifyToken(token);
    if (!payload) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check if accessing super admin route
    if (pathname.startsWith("/admin/super")) {
      if (payload.role !== "super_admin") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    }

    // Allow access - continue to the route
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};


