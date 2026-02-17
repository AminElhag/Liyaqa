import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "@liyaqa/shared/i18n/config";

/**
 * JWT Payload interface
 */
interface JWTPayload {
  exp?: number;
  role?: string;
  [key: string]: unknown;
}

/**
 * Routes that require platform authentication
 * Use specific path matching to avoid false positives
 */
const PROTECTED_ROUTE_PATTERNS = [
  "/platform-dashboard",
  "/platform-users",
  "/clients",
  "/deals",
  "/client-plans",
  "/client-subscriptions",
  "/client-invoices",
  "/support",
  "/alerts",
  "/health",
  "/dunning",
  "/view-clubs",
];

/**
 * Public routes that don't require authentication
 */
const PUBLIC_ROUTES = ["/", "/platform-login", "/auth"];

/**
 * Checks if a path is protected
 * Uses exact prefix matching for known protected routes
 */
function isProtectedRoute(pathname: string): boolean {
  const pathWithoutLocale = pathname.replace(/^\/(en|ar)/, "");

  // Exact match or starts with pattern followed by / or end of string
  return PROTECTED_ROUTE_PATTERNS.some((route) => {
    return pathWithoutLocale === route ||
           pathWithoutLocale.startsWith(route + "/");
  });
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
 * Decodes JWT token
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
 * Checks if user has platform role
 */
function hasPlatformRole(token: JWTPayload | null): boolean {
  if (!token || !token.role) return false;

  const role = token.role;
  return (
    role === "PLATFORM_SUPER_ADMIN" ||
    role === "PLATFORM_ADMIN" ||
    role === "PLATFORM_STAFF"
  );
}

/**
 * Authentication middleware for platform
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

  // No valid session found - redirect to platform login
  if (!decodedToken) {
    const locale = pathname.split("/")[1] || defaultLocale;
    const loginUrl = new URL(`/${locale}/platform-login`, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check if token is expired
  if (isTokenExpired(decodedToken)) {
    const locale = pathname.split("/")[1] || defaultLocale;
    const loginUrl = new URL(`/${locale}/platform-login`, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    loginUrl.searchParams.set("expired", "true");
    return NextResponse.redirect(loginUrl);
  }

  // Check platform role - REQUIRED for all platform routes
  if (!hasPlatformRole(decodedToken)) {
    const locale = pathname.split("/")[1] || defaultLocale;
    // Return 403 Forbidden for non-platform users
    return new NextResponse("Forbidden - Platform access required", {
      status: 403,
    });
  }

  // Token is valid and has platform role - continue
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
