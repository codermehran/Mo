"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AuthTokens } from "@/lib/types";
import { getCookie, setCookie, type CookieOptions } from "@/lib/cookies";

interface AuthContextValue {
  accessToken: string | null;
  refreshToken: string | null;
  hasRefreshToken: boolean;
  setTokens: (tokens?: AuthTokens) => void;
  clearTokens: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const REFRESH_COOKIE_NAME = "refresh_token";
const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 14;
const refreshCookieOptions: CookieOptions = {
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [hasRefreshToken, setHasRefreshToken] = useState(false);

  useEffect(() => {
    const existingRefresh = getCookie(REFRESH_COOKIE_NAME);
    if (existingRefresh) {
      setRefreshToken(existingRefresh);
      setHasRefreshToken(true);
    }

    const checkHttpOnlyCookie = async () => {
      try {
        const response = await fetch("/api/auth/refresh-token");
        if (!response.ok) return;
        const payload = (await response.json()) as { hasRefreshToken?: boolean };
        setHasRefreshToken(Boolean(payload.hasRefreshToken));
      } catch {
        setHasRefreshToken(false);
      }
    };

    void checkHttpOnlyCookie();
  }, []);

  const persistRefreshToken = async (token?: string) => {
    if (token) {
      setCookie(REFRESH_COOKIE_NAME, token, REFRESH_COOKIE_MAX_AGE, refreshCookieOptions);
      setRefreshToken(token);
      setHasRefreshToken(true);
      try {
        await fetch("/api/auth/refresh-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: token }),
        });
      } catch {
        // No-op: best-effort persistence to HttpOnly cookie
      }
    } else {
      setCookie(REFRESH_COOKIE_NAME, "", -1, refreshCookieOptions);
      setRefreshToken(null);
      setHasRefreshToken(false);
      try {
        await fetch("/api/auth/refresh-token", { method: "DELETE" });
      } catch {
        // No-op
      }
    }
  };

  const value = useMemo(
    () => ({
      accessToken,
      refreshToken,
      hasRefreshToken,
      setTokens: (tokens?: AuthTokens) => {
        if (!tokens) {
          setAccessToken(null);
          void persistRefreshToken();
          return;
        }
        if (tokens.accessToken) {
          setAccessToken(tokens.accessToken);
        }
        if (tokens.refreshToken) {
          void persistRefreshToken(tokens.refreshToken);
        }
      },
      clearTokens: () => {
        setAccessToken(null);
        void persistRefreshToken();
      },
    }),
    [accessToken, hasRefreshToken, refreshToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("AuthContext خارج از AuthProvider استفاده شده است.");
  }
  return ctx;
}
