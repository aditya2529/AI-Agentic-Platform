import { NextResponse, type NextRequest } from "next/server";

// Edge-runtime middleware: only checks for the *presence* of a session
// cookie, never decodes it. Real verification happens in the (app)/layout
// server component which has DB access.
//
// Database-session strategy can't run in edge, and the JWT-fallback path
// errors on our plain session-token cookies — so we avoid Auth.js entirely
// here. A cookie-presence check is enough for "redirect to /signin".
export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAuthPage = pathname === "/signin";
  const isProtected =
    pathname.startsWith("/agents") ||
    pathname.startsWith("/runs") ||
    pathname.startsWith("/settings");

  const cookie =
    req.cookies.get("authjs.session-token") ??
    req.cookies.get("__Secure-authjs.session-token");
  const hasSession = Boolean(cookie?.value);

  if (isProtected && !hasSession) {
    const url = new URL("/signin", req.nextUrl);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && hasSession) {
    return NextResponse.redirect(new URL("/agents", req.nextUrl));
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
