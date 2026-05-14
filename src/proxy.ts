import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const publicPaths = ["/", "/login"];
const publicApiPrefixes = [
  "/api/auth",
  "/api/billing/webhook",
  "/api/inngest",
];

function isPublicPath(pathname: string) {
  return publicPaths.includes(pathname) || publicApiPrefixes.some((prefix) => pathname.startsWith(prefix));
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (token) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("callbackUrl", `${pathname}${req.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export default proxy;

export const config = {
  matcher: [
    "/api/:path*",
    "/admin/:path*",
    "/agents/:path*",
    "/billing/:path*",
    "/builder/:path*",
    "/dashboard/:path*",
    "/learn/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/templates/:path*",
    "/workflows/:path*",
  ],
};
