import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /admin/* routes
  if (pathname.startsWith("/admin")) {
    const cookieName = (process.env.COOKIE_NAME || "menumate_session").trim();
    const token = request.cookies.get(cookieName)?.value;

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

    // Staff (KDS users) can only access Kitchen
    if (payload.role === "staff" && pathname !== "/admin/kitchen" && pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/admin/kitchen", request.url));
    }

    // Allow access - continue to the route
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};


