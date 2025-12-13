import { NextRequest, NextResponse } from "next/server";

const REFRESH_COOKIE_NAME = "refresh_token";
const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 14;

function buildCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export async function GET(request: NextRequest) {
  const hasRefreshToken = Boolean(request.cookies.get(REFRESH_COOKIE_NAME));
  return NextResponse.json({ hasRefreshToken });
}

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => undefined as unknown as { refreshToken?: string });
  const refreshToken = payload?.refreshToken;

  if (!refreshToken || typeof refreshToken !== "string") {
    return NextResponse.json({ message: "refreshToken موردنیاز است" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(REFRESH_COOKIE_NAME, refreshToken, buildCookieOptions(REFRESH_COOKIE_MAX_AGE));
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(REFRESH_COOKIE_NAME, "", buildCookieOptions(0));
  return response;
}
