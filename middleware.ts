import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, User, SessionData } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);

  const { pathname } = request.nextUrl;

  // Protect Admin Routes
  if (pathname.startsWith("/admin")) {
    if (!session.user?.isLoggedIn) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (session.user.role !== "admin" && session.user.role !== "super_admin") {
      // Redirect to home or show unauthorized page
      // For now, redirect to home with a query param
      return NextResponse.redirect(new URL("/?error=unauthorized", request.url));
    }
  }

  // Protect Profile
  if (pathname.startsWith("/profile")) {
    if (!session.user?.isLoggedIn) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/profile/:path*"],
};
