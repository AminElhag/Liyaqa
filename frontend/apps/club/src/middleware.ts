import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "@liyaqa/shared/i18n/config";

/**
 * JWT Payload interface
 */
interface JWTPayload {
  exp?: number;
  role?: string;
  scope?: string;
  account_type?: string;
  [key: string]: unknown;
}

/**
 * Public routes that don't require authentication
 */
const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/auth",
  "/member/login",
  "/ref",
  "/forms",
];

/**
 * Checks if a path is protected.
 * Uses a "default deny" approach: any route that isn't explicitly public
 * and isn't the bare root is treated as protected.
 */
function isProtectedRoute(pathname: string): boolean {
  const pathWithoutLocale = pathname.replace(/^\/(en|ar)/, "");

  // Root path is not protected (it's the landing/redirect page)
  if (pathWithoutLocale === "" || pathWithoutLocale === "/") {
    return false;
  }

  // Explicitly public routes are not protected
  if (isPublicRoute(pathname)) {
    return false;
  }

  // Everything else is protected (admin pages like /locations, /classes, /plans, etc.)
  return true;
}

/**
 * Checks if a path is public
 */
function isPublicRoute(pathname: string): boolean {
  const pathWithoutLocale = pathname.replace(/^\/(en|ar)/, "");
  return PUBLIC_ROUTES.some(
    (route) =>
      pathWithoutLocale === route || pathWithoutLocale.startsWith(route + "/")
  );
}

/**
 * Reads session metadata from the lightweight `session_meta` cookie,
 * falling back to the full `access_token` cookie or Authorization header.
 *
 * The `session_meta` cookie is a base64-encoded JSON object containing only
 * { exp, scope, role, account_type } — small enough to always fit within
 * the 4KB browser cookie limit, unlike the full JWT which can exceed it
 * when the permissions list is large.
 */
function getSessionFromRequest(request: NextRequest): JWTPayload | null {
  // 1. Try lightweight session_meta cookie (preferred)
  const metaCookie = request.cookies.get("session_meta")?.value;
  if (metaCookie) {
    try {
      const decoded = JSON.parse(
        Buffer.from(metaCookie, "base64").toString("utf-8")
      ) as JWTPayload;
      return decoded;
    } catch {
      // Malformed — fall through
    }
  }

  // 2. Fallback: full access_token cookie (backward compat)
  const cookieToken = request.cookies.get("access_token")?.value;
  if (cookieToken) {
    return decodeJWT(cookieToken);
  }

  // 3. Fallback: Authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return decodeJWT(authHeader.substring(7));
  }

  return null;
}

/**
 * Decodes JWT token (without verification - just for checking expiry)
 */
function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decoded = JSON.parse(
      Buffer.from(payload, "base64").toString("utf-8")
    ) as JWTPayload;

    return decoded;
  } catch {
    return null;
  }
}

/**
 * Checks if JWT token is expired
 */
function isTokenExpired(token: JWTPayload | null): boolean {
  if (!token || !token.exp) return true;

  const now = Math.floor(Date.now() / 1000);
  return token.exp < now;
}

/**
 * Authentication middleware
 */
async function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth check for public routes
  if (isPublicRoute(pathname)) {
    return null;
  }

  // Check if route is protected
  if (!isProtectedRoute(pathname)) {
    return null;
  }

  // Get session metadata from cookie (or fallback to full JWT)
  const decodedToken = getSessionFromRequest(request);

  // No valid session found - redirect to login
  if (!decodedToken) {
    const locale = pathname.split("/")[1] || defaultLocale;
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check if token is expired
  if (isTokenExpired(decodedToken)) {
    const locale = pathname.split("/")[1] || defaultLocale;
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    loginUrl.searchParams.set("expired", "true");
    return NextResponse.redirect(loginUrl);
  }

  // Reject platform-scoped tokens — they can't access facility endpoints.
  // This prevents cross-app cookie leakage when both apps run on localhost.
  if (decodedToken.scope === "platform") {
    const locale = pathname.split("/")[1] || defaultLocale;
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // For admin routes, validate EMPLOYEE account type (or legacy admin roles)
  const pathWithoutLocale = pathname.replace(/^\/(en|ar)/, "");
  const isAdminRoute =
    !pathWithoutLocale.startsWith("/member") &&
    !pathWithoutLocale.startsWith("/trainer") &&
    !pathWithoutLocale.startsWith("/login");

  if (isAdminRoute && pathWithoutLocale !== "" && pathWithoutLocale !== "/") {
    const accountType = decodedToken.account_type;
    const role = decodedToken.role;
    const isEmployeeToken =
      accountType === "EMPLOYEE" ||
      (!accountType &&
        role !== undefined &&
        ["SUPER_ADMIN", "CLUB_ADMIN", "STAFF"].includes(role));

    if (!isEmployeeToken) {
      const locale = pathname.split("/")[1] || defaultLocale;
      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set("wrong_portal", "true");
      return NextResponse.redirect(loginUrl);
    }
  }

  // Token is valid - continue
  return null;
}

/**
 * Create i18n middleware
 */
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

/**
 * Main middleware - chains auth and i18n middlewares
 */
export default async function middleware(request: NextRequest) {
  // First, run authentication middleware
  const authResponse = await authMiddleware(request);
  if (authResponse) {
    return authResponse;
  }

  // Then, run i18n middleware
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
