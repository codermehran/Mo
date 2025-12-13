"use client";

import { useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { fetchBootstrap, refreshSession } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { BootstrapProvider } from "@/components/auth/bootstrap-context";

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { accessToken, refreshToken, hasRefreshToken, isHydrated, setTokens, clearTokens } = useAuth();

  const shouldAttemptRefresh = useMemo(
    () => !accessToken && hasRefreshToken,
    [accessToken, hasRefreshToken],
  );

  const refreshMutation = useMutation({
    mutationFn: (token?: string) => refreshSession(token),
    onSuccess: (tokens) => setTokens(tokens),
    onError: () => {
      clearTokens();
      router.replace("/login");
    },
  });

  useEffect(() => {
    if (isHydrated && !accessToken && !hasRefreshToken && !refreshMutation.isSuccess) {
      router.replace("/login");
    }
  }, [accessToken, hasRefreshToken, isHydrated, refreshMutation.isSuccess, router]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!accessToken && !hasRefreshToken) {
      router.replace("/login");
    }
    if (shouldAttemptRefresh && !refreshMutation.isPending && !refreshMutation.isSuccess) {
      refreshMutation.mutate(refreshToken ?? undefined);
    }
  }, [
    accessToken,
    hasRefreshToken,
    refreshMutation,
    refreshToken,
    router,
    shouldAttemptRefresh,
    isHydrated,
  ]);

  const bootstrapQuery = useQuery({
    queryKey: ["bootstrap", accessToken],
    queryFn: () => fetchBootstrap(accessToken || undefined),
    enabled: Boolean(accessToken),
    retry: false,
  });

  useEffect(() => {
    if (bootstrapQuery.isError) {
      clearTokens();
      router.replace("/login");
    }
  }, [bootstrapQuery.isError, clearTokens, router]);

  const showLoader =
    !isHydrated ||
    refreshMutation.isPending ||
    (shouldAttemptRefresh && !refreshMutation.isSuccess) ||
    (!accessToken && !refreshMutation.isSuccess) ||
    bootstrapQuery.isLoading;

  if (showLoader) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-2 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-slate-600">در حال بررسی ورود...</p>
        </div>
      </div>
    );
  }

  if (!bootstrapQuery.data) {
    return null;
  }

  return <BootstrapProvider value={bootstrapQuery.data}>{children}</BootstrapProvider>;
}
