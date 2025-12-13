"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AuthTokens } from "@/lib/types";
import { getCookie, setCookie } from "@/lib/cookies";

interface AuthContextValue {
  accessToken: string | null;
  refreshToken: string | null;
  setTokens: (tokens?: AuthTokens) => void;
  clearTokens: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  useEffect(() => {
    const existingRefresh = getCookie("refresh_token");
    if (existingRefresh) {
      setRefreshToken(existingRefresh);
    }
  }, []);

  const persistRefreshToken = (token?: string) => {
    if (token) {
      setCookie("refresh_token", token, 60 * 60 * 24 * 14);
      setRefreshToken(token);
    } else {
      setCookie("refresh_token", "", -1);
      setRefreshToken(null);
    }
  };

  const value = useMemo(
    () => ({
      accessToken,
      refreshToken,
      setTokens: (tokens?: AuthTokens) => {
        if (!tokens) {
          setAccessToken(null);
          persistRefreshToken();
          return;
        }
        if (tokens.accessToken) {
          setAccessToken(tokens.accessToken);
        }
        if (tokens.refreshToken) {
          persistRefreshToken(tokens.refreshToken);
        }
      },
      clearTokens: () => {
        setAccessToken(null);
        persistRefreshToken();
      },
    }),
    [accessToken, refreshToken],
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
