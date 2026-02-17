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

function getTokenFromRequest(request: NextRequest): string | null {
  const cookieToken = request.cookies.get("access_token")?.value;
  if (cookieToken) return cookieToken;

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.substring(7);

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

  const token = getTokenFromRequest(request);
  if (!token) {
    const locale = pathname.split("/")[1] || defaultLocale;
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const decoded = decodeJWT(token);
  if (!decoded || isTokenExpired(decoded)) {
    const locale = pathname.split("/")[1] || defaultLocale;
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    if (decoded && isTokenExpired(decoded)) {
      loginUrl.searchParams.set("expired", "true");
    }
    return NextResponse.redirect(loginUrl);
  }

  // Reject tokens that aren't for trainers (account_type claim)
  // Allow TRAINER account type, or legacy tokens with TRAINER role
  const accountType = decoded.account_type;
  const role = decoded.role;
  const isTrainerToken =
    accountType === "TRAINER" ||
    (!accountType && role === "TRAINER") ||
    role === "SUPER_ADMIN" ||
    role === "CLUB_ADMIN";

  if (!isTrainerToken) {
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
