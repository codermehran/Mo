import type { AuthTokens, BootstrapResponse } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = await response.json().catch(() => undefined);
    const message = payload?.message || payload?.detail || "خطا در برقراری ارتباط با سرور";
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export async function requestOtp(payload: { phone: string; purpose: "login" | "recovery" }) {
  const response = await fetch(`${API_BASE_URL}/auth/request-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleResponse<{ message: string }>(response);
}

export async function verifyOtp(payload: {
  phone: string;
  code: string;
  purpose: "login" | "recovery";
}): Promise<AuthTokens> {
  const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleResponse<AuthTokens>(response);
}

export async function refreshSession(refreshToken?: string): Promise<AuthTokens> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  return handleResponse<AuthTokens>(response);
}

export async function fetchBootstrap(accessToken?: string): Promise<BootstrapResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/bootstrap`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });
  return handleResponse<BootstrapResponse>(response);
}
