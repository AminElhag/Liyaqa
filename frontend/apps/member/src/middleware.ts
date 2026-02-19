import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "@liyaqa/shared/i18n/config";

interface JWTPayload {
  exp?: number;
  role?: string;
  scope?: string;
  account_type?: string;
  [key: string]: unknown;
}

const PUBLIC_ROUTES = ["/login", "/auth"];

function isPublicRoute(pathname: string): boolean {
  const pathWithoutLocale = pathname.replace(/^\/(en|ar)/, "");
  return PUBLIC_ROUTES.some(
    (route) =>
      pathWithoutLocale === route || pathWithoutLocale.startsWith(route + "/")
  );
}

function isProtectedRoute(pathname: string): boolean {
  const pathWithoutLocale = pathname.replace(/^\/(en|ar)/, "");
  if (pathWithoutLocale === "" || pathWithoutLocale === "/") return false;
  if (isPublicRoute(pathname)) return false;
  return true;
}

function getTokenPayload(request: NextRequest): JWTPayload | null {
  // 1. Try session_meta cookie (lightweight metadata set by client)
  const metaCookie = request.cookies.get("session_meta")?.value;
  if (metaCookie) {
    try {
      return JSON.parse(Buffer.from(metaCookie, "base64").toString("utf-8"));
    } catch { /* fall through */ }
  }

  // 2. Fallback: access_token cookie (legacy) or Authorization header
  const rawToken =
    request.cookies.get("access_token")?.value ??
    (request.headers.get("authorization")?.startsWith("Bearer ")
      ? request.headers.get("authorization")!.substring(7)
      : null);
  if (rawToken) return decodeJWT(rawToken);

  return null;
}

function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    return JSON.parse(
      Buffer.from(parts[1], "base64").toString("utf-8")
    ) as JWTPayload;
  } catch {
    return null;
  }
}

function isTokenExpired(token: JWTPayload | null): boolean {
  if (!token || !token.exp) return true;
  return token.exp < Math.floor(Date.now() / 1000);
}

async function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedRoute(pathname)) return null;

  const payload = getTokenPayload(request);
  if (!payload || isTokenExpired(payload)) {
    const locale = pathname.split("/")[1] || defaultLocale;
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    if (payload && isTokenExpired(payload)) {
      loginUrl.searchParams.set("expired", "true");
    }
    return NextResponse.redirect(loginUrl);
  }

  // Reject tokens that aren't for members (account_type claim)
  // Allow MEMBER account type, or legacy tokens with MEMBER role
  const accountType = payload.account_type;
  const role = payload.role;
  const isMemberToken =
    accountType === "MEMBER" ||
    (!accountType && role === "MEMBER") ||
    role === "SUPER_ADMIN" ||
    role === "CLUB_ADMIN";

  if (!isMemberToken) {
    const locale = pathname.split("/")[1] || defaultLocale;
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("wrong_portal", "true");
    return NextResponse.redirect(loginUrl);
  }

  return null;
}

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

export default async function middleware(request: NextRequest) {
  const authResponse = await authMiddleware(request);
  if (authResponse) return authResponse;
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
