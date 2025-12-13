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
  const { accessToken, refreshToken, setTokens, clearTokens } = useAuth();

  const shouldAttemptRefresh = useMemo(
    () => !accessToken && Boolean(refreshToken),
    [accessToken, refreshToken],
  );

  const refreshMutation = useMutation({
    mutationFn: () => refreshSession(refreshToken ?? undefined),
    onSuccess: (tokens) => setTokens(tokens),
    onError: () => {
      clearTokens();
      router.replace("/login");
    },
  });

  useEffect(() => {
    if (!accessToken && !refreshToken && !refreshMutation.isPending) {
      router.replace("/login");
    }
    if (shouldAttemptRefresh && !refreshMutation.isPending && !refreshMutation.isSuccess) {
      refreshMutation.mutate();
    }
  }, [accessToken, refreshMutation, refreshToken, router, shouldAttemptRefresh]);

  const bootstrapQuery = useQuery({
    queryKey: ["bootstrap"],
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
