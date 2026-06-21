import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/tokens";
import { consumeRateLimit } from "@/lib/rate-limiter";

// Rate limit for general API traffic: 100 requests per minute per IP
const API_RATE_LIMIT = 100;
const API_RATE_WINDOW_MS = 60_000;

type AccountType = "Sender" | "Recipient";

function getAccountTypeFromRole(role: string | null | undefined): AccountType | null {
  if (!role) return null;
  const normalized = role.toLowerCase();
  if (normalized === "sender") return "Sender";
  if (normalized === "recipient") return "Recipient";
  return null;
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "127.0.0.1"
  );
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Apply rate-limit headers to all /api/* routes
  if (pathname.startsWith("/api/")) {
    const ip = getClientIp(request);
    const status = consumeRateLimit(
      `mw:${ip}`,
      API_RATE_LIMIT,
      API_RATE_WINDOW_MS,
    );

    response.headers.set("x-ratelimit-limit", String(status.limit));
    response.headers.set("x-ratelimit-remaining", String(status.remaining));
    response.headers.set(
      "x-ratelimit-reset",
      String(Date.now() + status.resetMs),
    );
  }

  // Inject account-type header for authenticated requests
  const authHeader =
    request.headers.get("authorization") ||
    request.headers.get("Authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const payload = await verifyAccessToken(token);

    if (payload) {
      const accountType = getAccountTypeFromRole(payload.role);
      if (accountType) {
        // Set the x-middleware-request-* variant that Next.js uses to
        // forward custom headers to the origin request.
        response.headers.set("x-account-type", accountType);
        response.headers.set("x-middleware-request-x-account-type", accountType);
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/api/:path*", "/dashboard/:path*"],
};
