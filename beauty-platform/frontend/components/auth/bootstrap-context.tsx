"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { BootstrapResponse } from "@/lib/types";

const BootstrapContext = createContext<BootstrapResponse | null>(null);

export function BootstrapProvider({
  value,
  children,
}: {
  value: BootstrapResponse;
  children: ReactNode;
}) {
  return <BootstrapContext.Provider value={value}>{children}</BootstrapContext.Provider>;
}

export function useBootstrap() {
  const ctx = useContext(BootstrapContext);
  if (!ctx) {
    throw new Error("BootstrapContext خارج از محدوده استفاده شده است.");
  }
  return ctx;
}
